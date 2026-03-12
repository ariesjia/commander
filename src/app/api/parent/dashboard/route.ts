import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent, getStudentId } from "@/lib/api-auth";
import { getCurrentStage, getEvolutionLevel } from "@/lib/mecha-config";
import { getWeekStartStr } from "@/lib/utils";

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
      select: { showPinyin: true },
    }),
    prisma.student.findUniqueOrThrow({
      where: { id: studentId },
      include: { studentMechas: true },
    }),
    prisma.task.findMany({ where: { parentId: auth.parentId, isActive: true } }),
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
  const weeklyCompletedCount = taskLogs.filter((l) => l.completedAt >= new Date(weekStart)).length;
  const weeklyTotalCount = tasks.length;

  const todayStr = new Date().toISOString().split("T")[0];
  const tasksWithLogs = tasks.map((t) => {
    const periodKey = t.type === "DAILY" || t.type === "RULE" ? todayStr : weekStart;
    const hasLog =
      t.type === "DAILY" || t.type === "RULE"
        ? taskLogs.some((l) => l.taskId === t.id && l.completedAt.toISOString().startsWith(periodKey))
        : taskLogs.some((l) => l.taskId === t.id && l.completedAt >= new Date(periodKey));
    return { task: t, completed: hasLog };
  });

  const pendingConfirmCount = tasksWithLogs.filter((t) => !t.completed).length;
  const pendingExchangeCount = exchanges.length;

  const adoptedIds = student.adoptedMechaIds ?? [];
  const primarySlug = adoptedIds[0] ?? null;
  const primaryMecha = primarySlug
    ? student.studentMechas.find((sm) => sm.mechaSlug === primarySlug)
    : null;
  const primaryMechaPoints = primaryMecha?.points ?? 0;
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
    pendingExchanges: exchanges.map((e) => ({
      id: e.id,
      rewardName: e.reward.name,
      pointsCost: e.pointsCost,
      createdAt: e.createdAt.toISOString(),
    })),
  });
}
