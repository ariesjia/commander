import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent, getStudentId } from "@/lib/api-auth";
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

  const { id: pointsLogId } = await params;

  const pointsLog = await prisma.pointsLog.findFirst({
    where: { id: pointsLogId, studentId },
    include: { taskLog: true },
  });

  if (!pointsLog) {
    return NextResponse.json({ error: "积分记录不存在" }, { status: 404 });
  }

  if (pointsLog.type !== PointsLogType.TASK_REWARD && pointsLog.type !== PointsLogType.TASK_PENALTY) {
    return NextResponse.json({ error: "该记录不支持撤销" }, { status: 400 });
  }

  let taskLog = pointsLog.taskLog;
  if (!taskLog) {
    // Legacy fallback: match by description, amount, createdAt
    const createdAt = pointsLog.createdAt;
    taskLog = await prisma.taskLog.findFirst({
      where: {
        studentId,
        pointsAwarded: pointsLog.amount,
        completedAt: {
          gte: new Date(createdAt.getTime() - 3000),
          lte: new Date(createdAt.getTime() + 3000),
        },
      },
      orderBy: { completedAt: "desc" },
    });
  }

  if (!taskLog) {
    return NextResponse.json({ error: "未找到关联的任务记录，无法撤销" }, { status: 400 });
  }

  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });
  const reverseAmount = -pointsLog.amount;

  if (taskLog.pointsAwarded > 0 && student.balance < taskLog.pointsAwarded) {
    return NextResponse.json({ error: "积分不足，无法撤销（可能已用于兑换）" }, { status: 400 });
  }

  // 旧记录无 studentMechaId，回退到当前 primary 机甲
  const studentMechaIdToUndo = taskLog.studentMechaId ?? student.primaryMechaId;

  const undoType =
    pointsLog.type === PointsLogType.TASK_REWARD ? PointsLogType.TASK_REWARD_UNDO : PointsLogType.TASK_PENALTY_UNDO;
  const undoDescription =
    pointsLog.type === PointsLogType.TASK_REWARD
      ? `撤销加分：${pointsLog.description}`
      : `撤销扣分：${pointsLog.description}`;

  await prisma.$transaction(async (tx) => {
    await tx.taskLog.delete({ where: { id: taskLog!.id } });
    await tx.student.update({
      where: { id: studentId },
      data: {
        // 学生积分最低为 0，撤销时不会出现负分
        totalPoints: Math.max(0, student.totalPoints - taskLog!.pointsAwarded),
        balance: Math.max(0, student.balance - taskLog!.pointsAwarded),
      },
    });
    if (studentMechaIdToUndo) {
      const sm = await tx.studentMecha.findUnique({
        where: { id: studentMechaIdToUndo, studentId },
      });
      if (sm) {
        await tx.studentMecha.update({
          where: { id: sm.id },
          data: { points: Math.max(0, sm.points - taskLog!.pointsAwarded) },
        });
      }
    }
    await tx.pointsLog.delete({ where: { id: pointsLogId } });
    await tx.pointsLog.create({
      data: {
        studentId,
        amount: reverseAmount,
        type: undoType,
        description: undoDescription,
      },
    });
  });

  return NextResponse.json({ success: true });
}
