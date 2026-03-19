import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent, getStudentId } from "@/lib/api-auth";
import { getCurrentStage, getEvolutionLevel } from "@/lib/mecha-config";
import { getTodayStr, getWeekStartStr, toChinaDateStr } from "@/lib/utils";

export async function GET(request: Request) {
  const auth = await requireParent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const [parent, student, tasks, taskLogs, exchanges] = await Promise.all([
    prisma.parent.findUniqueOrThrow({
      where: { id: auth.parentId },
      select: { showPinyin: true, baseScore: true },
    }),
    prisma.student.findUniqueOrThrow({
      where: { id: studentId },
      include: { studentMechas: true, primaryMecha: true },
    }),
    prisma.task.findMany({ where: { parentId: auth.parentId, isActive: true, deletedAt: null } }),
    prisma.taskLog.findMany({
      where: { studentId },
      orderBy: { completedAt: "desc" },
    }),
    prisma.exchange.findMany({
      where: { studentId, status: "PENDING" },
      include: { reward: true },
    }),
  ]);

  const weekStart = getWeekStartStr();
  const todayStr = getTodayStr();
  const weekStartDate = new Date(weekStart + "T00:00:00+08:00");
  const weeklyCompletedCount = taskLogs.filter((l) => l.completedAt >= weekStartDate).length;
  const weeklyTotalCount = tasks.length;

  const tasksWithLogs = tasks.map((t) => {
    const hasLog =
      t.type === "DAILY" || t.type === "RULE"
        ? taskLogs.some((l) => l.taskId === t.id && toChinaDateStr(l.completedAt) === todayStr)
        : taskLogs.some((l) => l.taskId === t.id && l.completedAt >= weekStartDate);
    return { task: t, completed: hasLog };
  });

  const pendingConfirmCount = tasksWithLogs.filter((t) => !t.completed).length;
  const pendingExchangeCount = exchanges.length;

  // primaryMechaId 可能未回填（迁移前领养），有 studentMechas 时用第一个并回填
  let primaryMecha = student.primaryMecha;
  if (!primaryMecha && student.studentMechas.length > 0) {
    const first = student.studentMechas.sort((a, b) => a.adoptedAt.getTime() - b.adoptedAt.getTime())[0]!;
    await prisma.student.update({
      where: { id: studentId },
      data: { primaryMechaId: first.id },
    });
    primaryMecha = first;
  }
  const primarySlug = primaryMecha?.mechaSlug ?? null;
  const primaryMechaPoints = primaryMecha?.points ?? 0;

  const mechaPointsBySlug: Record<string, number> = {};
  for (const sm of student.studentMechas) {
    mechaPointsBySlug[sm.mechaSlug] = sm.points;
  }
  const adoptedMechas = primarySlug
    ? [
        student.studentMechas.find((sm) => sm.mechaSlug === primarySlug)!,
        ...student.studentMechas.filter((sm) => sm.mechaSlug !== primarySlug),
      ].filter(Boolean)
    : [...student.studentMechas];
  const adoptedMechaIds = adoptedMechas.map((sm) => sm.mechaSlug);
  const mechaStage = getCurrentStage(primaryMechaPoints);
  const evolutionLevel = getEvolutionLevel(primaryMechaPoints);

  let mechaName: string | null = null;
  let mechaLevelName: string | null = null;
  if (primarySlug) {
    const mechaConfig = await prisma.mecha.findUnique({
      where: { slug: primarySlug },
      include: { levels: { orderBy: { level: "asc" } } },
    });
    if (mechaConfig) {
      mechaName = mechaConfig.name;
      const levels = mechaConfig.levels;
      let levelInfo = levels[0] ?? null;
      for (const l of levels) {
        if (primaryMechaPoints >= l.threshold) levelInfo = l;
        else break;
      }
      mechaLevelName = levelInfo?.name ?? null;
    }
  }

  return NextResponse.json({
    showPinyin: parent.showPinyin,
    baseScore: (parent.baseScore ?? 1) as 0.1 | 1 | 10,
    student: {
      nickname: student.nickname,
      totalPoints: student.totalPoints,
      balance: student.balance,
      frozenPoints: student.frozenPoints,
      streakDays: student.streakDays,
      mechaPoints: primaryMechaPoints,
    },
    weeklyCompletedCount,
    weeklyTotalCount,
    pendingConfirmCount,
    pendingExchangeCount,
    mechaStage,
    evolutionLevel,
    mechaName,
    mechaLevelName,
    adoptedMechaIds,
    adoptedMechas: adoptedMechas.map((sm) => ({ id: sm.id, slug: sm.mechaSlug, points: sm.points })),
    mechaPointsBySlug,
    pendingExchanges: exchanges.map((e) => ({
      id: e.id,
      rewardName: e.reward.name,
      pointsCost: e.pointsCost,
      createdAt: e.createdAt.toISOString(),
    })),
  });
}
