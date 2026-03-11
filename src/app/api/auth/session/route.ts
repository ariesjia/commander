import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const payload = await verifySessionToken(token);
    if (!payload) {
      return NextResponse.json({ user: null });
    }

    const parent = await prisma.parent.findUnique({
      where: { id: payload.userId },
      include: { student: true },
    });

    if (!parent) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        email: parent.email,
        childNickname: parent.student?.nickname ?? "",
      },
      mode: payload.mode,
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
