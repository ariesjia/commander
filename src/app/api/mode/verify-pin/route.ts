import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  verifySessionToken,
  verifyPin,
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  recordPinFailure,
  clearPinFailures,
  isPinLocked,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const payload = await verifySessionToken(token);
    if (!payload) {
      return NextResponse.json({ error: "登录已过期" }, { status: 401 });
    }

    if (payload.mode === "parent") {
      return NextResponse.json({ success: true, mode: "parent" });
    }

    const body = await request.json();
    const pin = String(body?.pin ?? "").trim();

    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "请输入 4 位 PIN 码" }, { status: 400 });
    }

    if (isPinLocked(payload.userId)) {
      return NextResponse.json(
        { error: "PIN 码错误次数过多，请 1 分钟后再试" },
        { status: 429 }
      );
    }

    const parent = await prisma.parent.findUnique({
      where: { id: payload.userId },
    });

    if (!parent) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const valid = await verifyPin(pin, parent.pinHash);
    if (!valid) {
      const result = recordPinFailure(payload.userId);
      if (result.locked) {
        return NextResponse.json(
          { error: "PIN 码错误次数过多，请 1 分钟后再试" },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `PIN 码错误，还可尝试 ${result.remainingAttempts ?? 0} 次` },
        { status: 401 }
      );
    }

    clearPinFailures(payload.userId);

    const newToken = await createSessionToken({
      userId: payload.userId,
      email: payload.email,
      mode: "parent",
    });

    const res = NextResponse.json({ success: true, mode: "parent" });
    res.cookies.set(SESSION_COOKIE, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return res;
  } catch (e) {
    console.error("Verify PIN error:", e);
    return NextResponse.json({ error: "验证失败" }, { status: 500 });
  }
}
