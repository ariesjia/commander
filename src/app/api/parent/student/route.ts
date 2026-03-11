import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent, getStudentId } from "@/lib/api-auth";

export async function PUT(request: Request) {
  const auth = await requireParent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const body = await request.json();
  const nickname = body?.nickname ? String(body.nickname).trim() : null;

  if (!nickname) {
    return NextResponse.json({ error: "请输入昵称" }, { status: 400 });
  }

  const student = await prisma.student.update({
    where: { id: studentId },
    data: { nickname },
  });

  return NextResponse.json({ nickname: student.nickname });
}
