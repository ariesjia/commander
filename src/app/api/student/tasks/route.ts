import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent, getStudentId } from "@/lib/api-auth";
import { getTodayStr, getWeekStartStr, toChinaDateStr } from "@/lib/utils";

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
          ? taskLogs.find((l) => l.taskId === t.id && l.completedAt >= new Date(weekStr + "T00:00:00+08:00"))
          : taskLogs.find((l) => l.taskId === t.id && toChinaDateStr(l.completedAt) === todayStr);

    const status: "pending" | "completed" = log ? "completed" : "pending";

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
