import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "mech_session";

async function getSession(request: NextRequest): Promise<{ userId: string; mode: "parent" | "student" } | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const secret = process.env.SESSION_SECRET ?? process.env.NEXTAUTH_SECRET;
    if (!secret || secret.length < 32) return null;
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return {
      userId: payload.userId as string,
      mode: payload.mode as "parent" | "student",
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getSession(request);

  const isAuth = !!session;
  const isLoginPage = pathname === "/login" || pathname === "/register";
  const isParentRoute = pathname.startsWith("/parent");
  const isStudentRoute = pathname.startsWith("/student");

  if (isLoginPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL("/parent", request.url));
    }
    return NextResponse.next();
  }

  if (!isAuth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/parent", request.url));
  }

  if (isParentRoute && session!.mode !== "parent") {
    return NextResponse.redirect(new URL("/student", request.url));
  }

  if (isStudentRoute && session!.mode !== "student") {
    return NextResponse.redirect(new URL("/parent", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register", "/parent/:path*", "/student/:path*"],
};
