import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent, getStudentId } from "@/lib/api-auth";
import { getTodayStr, getWeekStartStr } from "@/lib/utils";
import { PointsLogType } from "@prisma/client";

export async function POST(
  _request: Request,
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

  const todayStr = getTodayStr();
  const weekStr = getWeekStartStr();

  const taskLog = await prisma.taskLog.findFirst({
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
    orderBy: { completedAt: "desc" },
  });

  if (!taskLog) {
    return NextResponse.json({ error: "未找到可撤销的完成记录" }, { status: 400 });
  }

  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });

  if (student.balance < taskLog.pointsAwarded) {
    return NextResponse.json({ error: "积分不足，无法撤销（可能已用于兑换）" }, { status: 400 });
  }

  const taskRewardDesc = `完成任务"${task.name}"`;
  const completedAt = taskLog.completedAt.getTime();
  const pointsLog = await prisma.pointsLog.findFirst({
    where: {
      studentId,
      type: PointsLogType.TASK_REWARD,
      amount: taskLog.pointsAwarded,
      description: taskRewardDesc,
      createdAt: {
        gte: new Date(completedAt - 3000),
        lte: new Date(completedAt + 3000),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  await prisma.$transaction(async (tx) => {
    await tx.taskLog.delete({ where: { id: taskLog.id } });
    await tx.student.update({
      where: { id: studentId },
      data: {
        totalPoints: Math.max(0, student.totalPoints - taskLog.pointsAwarded),
        balance: Math.max(0, student.balance - taskLog.pointsAwarded),
      },
    });
    if (pointsLog) {
      await tx.pointsLog.delete({ where: { id: pointsLog.id } });
    }
  });

  return NextResponse.json({ success: true });
}
