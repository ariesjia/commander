import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent, getStudentId } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
    include: { parent: { select: { mechaChatEnabled: true } } },
  });

  if (!student.parent.mechaChatEnabled) {
    return NextResponse.json(
      { error: "家长已关闭机甲对话", code: "MECHA_CHAT_DISABLED" },
      { status: 403 },
    );
  }

  const sessions = await prisma.mechaChatSession.findMany({
    where: { studentId },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      id: true,
      mechaSlug: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ sessions });
}

export async function POST() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
    include: {
      parent: { select: { mechaChatEnabled: true } },
      primaryMecha: true,
    },
  });

  if (!student.parent.mechaChatEnabled) {
    return NextResponse.json(
      { error: "家长已关闭机甲对话", code: "MECHA_CHAT_DISABLED" },
      { status: 403 },
    );
  }

  if (!student.primaryMecha) {
    return NextResponse.json(
      { error: "请先领养并选择主机甲", code: "NEED_PRIMARY_MECHA" },
      { status: 400 },
    );
  }

  const session = await prisma.mechaChatSession.create({
    data: {
      studentId,
      mechaSlug: student.primaryMecha.mechaSlug,
    },
    select: {
      id: true,
      mechaSlug: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(session);
}
