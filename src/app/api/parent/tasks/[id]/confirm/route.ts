import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent, getStudentId } from "@/lib/api-auth";
import { getTodayStr, getWeekStartStr } from "@/lib/utils";
import { PointsLogType } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireParent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const { id: taskId } = await params;

  const task = await prisma.task.findFirst({
    where: { id: taskId, parentId: auth.parentId },
  });

  if (!task) {
    return NextResponse.json({ error: "任务不存在" }, { status: 404 });
  }

  if (!task.isActive) {
    return NextResponse.json({ error: "任务已停用" }, { status: 400 });
  }

  const todayStr = getTodayStr();
  const weekStr = getWeekStartStr();

  const existingLog = await prisma.taskLog.findFirst({
    where: {
      taskId,
      studentId,
      ...(task.type === "DAILY"
        ? {
            completedAt: {
              gte: new Date(todayStr),
              lt: new Date(new Date(todayStr).getTime() + 86400000),
            },
          }
        : {
            completedAt: { gte: new Date(weekStr) },
          }),
    },
  });

  if (existingLog) {
    return NextResponse.json(
      { error: task.type === "DAILY" ? "今日已确认过该任务" : "本周已确认过该任务" },
      { status: 400 }
    );
  }

  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });

  const todayDate = new Date(todayStr);
  const lastActive = student.lastActiveAt;
  const lastActiveDate = lastActive ? lastActive.toISOString().split("T")[0] : null;
  const isConsecutive =
    lastActiveDate === todayStr ||
    (lastActiveDate &&
      todayDate.getTime() - new Date(lastActiveDate).getTime() <= 86400000);
  const newStreak =
    isConsecutive
      ? lastActiveDate === todayStr
        ? student.streakDays
        : student.streakDays + 1
      : 1;

  await prisma.$transaction([
    prisma.taskLog.create({
      data: {
        taskId,
        studentId,
        pointsAwarded: task.points,
      },
    }),
    prisma.student.update({
      where: { id: studentId },
      data: {
        totalPoints: student.totalPoints + task.points,
        balance: student.balance + task.points,
        streakDays: newStreak,
        lastActiveAt: new Date(),
      },
    }),
    prisma.pointsLog.create({
      data: {
        studentId,
        amount: task.points,
        type: PointsLogType.TASK_REWARD,
        description: `完成任务"${task.name}"`,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
