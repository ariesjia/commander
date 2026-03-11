import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ mode: null, loggedIn: false });
    }

    const payload = await verifySessionToken(token);
    if (!payload) {
      return NextResponse.json({ mode: null, loggedIn: false });
    }

    return NextResponse.json({
      mode: payload.mode,
      loggedIn: true,
    });
  } catch {
    return NextResponse.json({ mode: null, loggedIn: false });
  }
}
