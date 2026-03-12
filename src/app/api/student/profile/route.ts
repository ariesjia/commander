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
    include: { parent: { select: { showPinyin: true } }, studentMechas: true },
  });

  const adoptedIds = student.adoptedMechaIds ?? [];
  const primarySlug = adoptedIds[0] ?? null;
  const primaryMecha = primarySlug
    ? student.studentMechas.find((sm) => sm.mechaSlug === primarySlug)
    : null;
  const primaryMechaPoints = primaryMecha?.points ?? 0;

  const mechaStage = getCurrentStage(primaryMechaPoints);
  const evolutionLevel = getEvolutionLevel(primaryMechaPoints);

  const mechaPointsBySlug: Record<string, number> = {};
  for (const sm of student.studentMechas) {
    mechaPointsBySlug[sm.mechaSlug] = sm.points;
  }

  return NextResponse.json({
    showPinyin: student.parent.showPinyin,
    nickname: student.nickname,
    adoptedMechaIds: adoptedIds,
    mechaPointsBySlug,
    totalPoints: student.totalPoints,
    balance: student.balance,
    frozenPoints: student.frozenPoints,
    streakDays: student.streakDays,
    mechaStage,
    evolutionLevel,
  });
}
