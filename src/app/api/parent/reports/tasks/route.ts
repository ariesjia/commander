import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent, getStudentId } from "@/lib/api-auth";
import { TaskType } from "@prisma/client";
import { getDateRangeChina } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const auth = await requireParent();
    if (!auth.ok) return auth.response;

    const studentId = await getStudentId(auth.parentId);
    if (!studentId) {
      return NextResponse.json({ error: "未找到学生" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") ?? "week") as "week" | "month";
    const dateStr = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

    if (period !== "week" && period !== "month") {
      return NextResponse.json({ error: "period 需为 week 或 month" }, { status: 400 });
    }

    const { start, end } = getDateRangeChina(period, dateStr);

    const [tasks, taskLogs] = await Promise.all([
      prisma.task.findMany({
        where: { parentId: auth.parentId, isActive: true, deletedAt: null },
        select: { id: true, type: true },
      }),
      prisma.taskLog.findMany({
        where: {
          studentId,
          completedAt: { gte: start, lt: end },
        },
        include: { task: { select: { type: true } } },
      }),
    ]);

    const dailyTasks = tasks.filter((t) => t.type === TaskType.DAILY);
    const weeklyTasks = tasks.filter((t) => t.type === TaskType.WEEKLY);
    const ruleTasks = tasks.filter((t) => t.type === TaskType.RULE);

    const dailyCompleted = taskLogs.filter((l) => l.task.type === TaskType.DAILY).length;
    const weeklyCompleted = taskLogs.filter((l) => l.task.type === TaskType.WEEKLY).length;
    const ruleCompleted = taskLogs.filter((l) => l.task.type === TaskType.RULE).length;

    const totalCompleted = taskLogs.length;
    const pointsAwarded = taskLogs.reduce((sum, l) => sum + l.pointsAwarded, 0);

    const daysInPeriod = period === "week" ? 7 : new Date(end.getTime() - 1).getUTCDate();
    const dailyMax = dailyTasks.length * daysInPeriod;
    const weeklyMax = period === "week" ? weeklyTasks.length : weeklyTasks.length * 4;
    const dailyRate = dailyMax > 0 ? Math.round((dailyCompleted / dailyMax) * 100) : 0;
    const weeklyRate = weeklyMax > 0 ? Math.round((weeklyCompleted / weeklyMax) * 100) : 0;

    return NextResponse.json({
      period,
      dateStr,
      start: start.toISOString(),
      end: end.toISOString(),
      totalCompleted,
      dailyCompleted,
      weeklyCompleted,
      ruleCompleted,
      pointsAwarded,
      dailyTaskCount: dailyTasks.length,
      weeklyTaskCount: weeklyTasks.length,
      ruleTaskCount: ruleTasks.length,
      dailyRate,
      weeklyRate,
    });
  } catch (e) {
    console.error("Task report error:", e);
    return NextResponse.json({ error: "获取任务报告失败" }, { status: 500 });
  }
}
