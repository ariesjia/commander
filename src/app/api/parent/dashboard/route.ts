import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent, getStudentId } from "@/lib/api-auth";
import { getCurrentStage } from "@/lib/mecha-config";
import { getWeekStartStr } from "@/lib/utils";

export async function GET(request: Request) {
  const auth = await requireParent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const [student, tasks, taskLogs, exchanges] = await Promise.all([
    prisma.student.findUniqueOrThrow({ where: { id: studentId } }),
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

  const tasksWithLogs = tasks.map((t) => {
    const periodKey = t.type === "DAILY" ? new Date().toISOString().split("T")[0] : weekStart;
    const hasLog =
      t.type === "DAILY"
        ? taskLogs.some((l) => l.taskId === t.id && l.completedAt.toISOString().startsWith(periodKey))
        : taskLogs.some((l) => l.taskId === t.id && l.completedAt >= new Date(periodKey));
    return { task: t, completed: hasLog };
  });

  const pendingConfirmCount = tasksWithLogs.filter((t) => !t.completed).length;
  const pendingExchangeCount = exchanges.length;

  const mechaStage = getCurrentStage(student.totalPoints);

  return NextResponse.json({
    student: {
      nickname: student.nickname,
      totalPoints: student.totalPoints,
      balance: student.balance,
      frozenPoints: student.frozenPoints,
      streakDays: student.streakDays,
    },
    weeklyCompletedCount,
    weeklyTotalCount,
    pendingConfirmCount,
    pendingExchangeCount,
    mechaStage,
    pendingExchanges: exchanges.map((e) => ({
      id: e.id,
      rewardName: e.reward.name,
      pointsCost: e.pointsCost,
      createdAt: e.createdAt.toISOString(),
    })),
  });
}
