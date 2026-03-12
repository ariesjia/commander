import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent, getStudentId } from "@/lib/api-auth";
import { getTodayStr, getWeekStartStr } from "@/lib/utils";

function isExpired(task: { type: string }, todayStr: string, weekStr: string): boolean {
  const now = new Date();
  if (task.type === "WEEKLY") {
    const sundayEnd = new Date(weekStr);
    sundayEnd.setDate(sundayEnd.getDate() + 6);
    sundayEnd.setHours(23, 59, 59, 999);
    return now > sundayEnd;
  }
  const endOfDay = new Date(todayStr);
  endOfDay.setHours(23, 59, 59, 999);
  return now > endOfDay;
}

export async function GET(request: Request) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const [tasks, taskLogs] = await Promise.all([
    prisma.task.findMany({
      where: { parentId: auth.parentId, isActive: true },
    }),
    prisma.taskLog.findMany({ where: { studentId } }),
  ]);

  const todayStr = getTodayStr();
  const weekStr = getWeekStartStr();

  const tasksWithStatus = tasks.map((t) => {
    // RULE can be done multiple times per day - always show pending for next confirmation
    const log =
      t.type === "RULE"
        ? null
        : t.type === "WEEKLY"
          ? taskLogs.find((l) => l.taskId === t.id && l.completedAt >= new Date(weekStr))
          : taskLogs.find((l) => l.taskId === t.id && l.completedAt.toISOString().startsWith(todayStr));

    let status: "pending" | "completed" | "expired" = "pending";
    if (log) status = "completed";
    else if (isExpired(t, todayStr, weekStr)) status = "expired";

    return {
      id: t.id,
      name: t.name,
      description: t.description,
      type: t.type,
      maxPoints: t.maxPoints,
      penaltyPoints: t.penaltyPoints ?? 0,
      isActive: t.isActive,
      createdAt: t.createdAt.toISOString(),
      status,
      completedAt: log?.completedAt.toISOString(),
    };
  });

  return NextResponse.json(tasksWithStatus);
}
