import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import type { SessionPayload } from "@/lib/auth";

async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  let token = cookieStore.get(SESSION_COOKIE)?.value ?? null;
  if (!token) {
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const cookieHeader = headersList.get("cookie");
    const match = cookieHeader?.match(new RegExp(`${SESSION_COOKIE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]+)`));
    token = match?.[1] ?? null;
  }
  return token;
}

async function getSession(): Promise<SessionPayload | null> {
  const token = await getSessionToken();
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireParent(): Promise<
  | { ok: true; session: SessionPayload; parentId: string }
  | { ok: false; response: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: "未登录" }, { status: 401 }) };
  }
  if (session.mode !== "parent") {
    return { ok: false, response: NextResponse.json({ error: "请先切换到家长模式" }, { status: 403 }) };
  }
  return { ok: true, session, parentId: session.userId };
}

export async function requireStudent(): Promise<
  | { ok: true; session: SessionPayload; parentId: string }
  | { ok: false; response: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: "未登录" }, { status: 401 }) };
  }
  if (session.mode !== "student") {
    return { ok: false, response: NextResponse.json({ error: "请先切换到学生模式" }, { status: 403 }) };
  }
  return { ok: true, session, parentId: session.userId };
}

export async function getStudentId(parentId: string): Promise<string | null> {
  const student = await prisma.student.findUnique({
    where: { parentId },
  });
  return student?.id ?? null;
}
