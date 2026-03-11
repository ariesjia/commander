import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, hashPin, createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, pin, childNickname } = body;

    if (!email || !password || !pin || !childNickname) {
      return NextResponse.json(
        { error: "请填写邮箱、密码、PIN 码和孩子昵称" },
        { status: 400 }
      );
    }

    const emailStr = String(email).trim().toLowerCase();
    const pinStr = String(pin).trim();
    const nicknameStr = String(childNickname).trim();

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
    }
    if (!/^\d{4}$/.test(pinStr)) {
      return NextResponse.json({ error: "PIN 码必须是 4 位数字" }, { status: 400 });
    }
    if (!nicknameStr) {
      return NextResponse.json({ error: "请输入孩子昵称" }, { status: 400 });
    }

    const existing = await prisma.parent.findUnique({ where: { email: emailStr } });
    if (existing) {
      return NextResponse.json({ error: "该邮箱已被注册" }, { status: 400 });
    }

    const [passwordHash, pinHash] = await Promise.all([
      hashPassword(password),
      hashPin(pinStr),
    ]);

    const { parent, student } = await prisma.$transaction(async (tx) => {
      const parent = await tx.parent.create({
        data: {
          email: emailStr,
          passwordHash,
          pinHash,
        },
      });
      const student = await tx.student.create({
        data: {
          parentId: parent.id,
          nickname: nicknameStr,
        },
      });
      return { parent, student };
    });

    const token = await createSessionToken({
      userId: parent.id,
      email: parent.email,
      mode: "parent",
    });

    const res = NextResponse.json({
      success: true,
      user: {
        email: parent.email,
        childNickname: student.nickname,
      },
    });

    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return res;
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
