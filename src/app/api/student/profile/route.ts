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
    include: { parent: { select: { showPinyin: true, baseScore: true } }, studentMechas: true, primaryMecha: true },
  });

  // primaryMechaId 可能未回填（迁移前领养），有 studentMechas 时用第一个并回填
  let primaryMecha = student.primaryMecha ?? null;
  if (!primaryMecha && student.studentMechas.length > 0) {
    const first = student.studentMechas.sort((a, b) => a.adoptedAt.getTime() - b.adoptedAt.getTime())[0]!;
    await prisma.student.update({
      where: { id: studentId },
      data: { primaryMechaId: first.id },
    });
    primaryMecha = first;
  }
  const primarySlug = primaryMecha?.mechaSlug ?? null;
  const adoptedMechas =
    primarySlug
      ? [
          student.studentMechas.find((sm) => sm.mechaSlug === primarySlug)!,
          ...student.studentMechas.filter((sm) => sm.mechaSlug !== primarySlug),
        ].filter(Boolean)
      : [...student.studentMechas];
  const adoptedMechaIds = adoptedMechas.map((sm) => sm.mechaSlug);
  const primaryMechaPoints = primaryMecha?.points ?? 0;

  const mechaStage = getCurrentStage(primaryMechaPoints);
  const evolutionLevel = getEvolutionLevel(primaryMechaPoints);

  const mechaPointsBySlug: Record<string, number> = {};
  for (const sm of student.studentMechas) {
    mechaPointsBySlug[sm.mechaSlug] = sm.points;
  }

  return NextResponse.json({
    showPinyin: student.parent.showPinyin,
    baseScore: (student.parent.baseScore ?? 1) as 0.1 | 1 | 10,
    nickname: student.nickname,
    adoptedMechaIds,
    adoptedMechas: adoptedMechas.map((sm) => ({ id: sm.id, slug: sm.mechaSlug, points: sm.points })),
    mechaPointsBySlug,
    totalPoints: student.totalPoints,
    balance: student.balance,
    frozenPoints: student.frozenPoints,
    streakDays: student.streakDays,
    mechaStage,
    evolutionLevel,
  });
}
