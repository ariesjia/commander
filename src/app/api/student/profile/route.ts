import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent, getStudentId } from "@/lib/api-auth";
import { getCurrentStage, getEvolutionLevel } from "@/lib/mecha-config";

export async function GET(request: Request) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
    include: { parent: true },
  });

  const mechaStage = getCurrentStage(student.totalPoints);
  const evolutionLevel = getEvolutionLevel(student.totalPoints);

  return NextResponse.json({
    nickname: student.nickname,
    totalPoints: student.totalPoints,
    balance: student.balance,
    frozenPoints: student.frozenPoints,
    streakDays: student.streakDays,
    mechaStage,
    evolutionLevel,
  });
}
