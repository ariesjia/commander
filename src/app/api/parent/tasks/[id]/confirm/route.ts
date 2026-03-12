import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent, getStudentId } from "@/lib/api-auth";
import { getTodayStr, getWeekStartStr, toChinaDateStr } from "@/lib/utils";
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

  let bodyPoints: number | undefined;
  let penaltyAmount: number | undefined;
  let isPenalty = false;
  try {
    const body = await request.json().catch(() => ({}));
    bodyPoints = body.pointsAwarded != null ? parseInt(String(body.pointsAwarded), 10) : undefined;
    penaltyAmount = body.penaltyAmount != null ? parseInt(String(body.penaltyAmount), 10) : undefined;
    isPenalty = body.isPenalty === true;
  } catch {
    // ignore
  }

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

  // RULE can be confirmed multiple times per day; DAILY once/day, WEEKLY once/week
  // DAILY 使用中国时区当天范围，确保每日任务每天可确认一次
  const existingLog =
    task.type !== "RULE" &&
    (await prisma.taskLog.findFirst({
      where: {
        taskId,
        studentId,
        ...(task.type === "WEEKLY"
          ? { completedAt: { gte: new Date(weekStr + "T00:00:00+08:00") } }
          : {
              completedAt: {
                gte: new Date(todayStr + "T00:00:00+08:00"),
                lt: new Date(new Date(todayStr + "T00:00:00+08:00").getTime() + 86400000),
              },
            }),
      },
    }));

  if (existingLog) {
    return NextResponse.json(
      { error: task.type === "DAILY" ? "今日已确认过该任务" : "本周已确认过该任务" },
      { status: 400 }
    );
  }

  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });

  const lastActive = student.lastActiveAt;
  const lastActiveDate = lastActive ? toChinaDateStr(lastActive) : null;
  const yesterdayStr = toChinaDateStr(new Date(Date.now() - 86400000));
  const isConsecutive =
    lastActiveDate === todayStr || lastActiveDate === yesterdayStr;
  const newStreak =
    isConsecutive
      ? lastActiveDate === todayStr
        ? student.streakDays
        : student.streakDays + 1
      : 1;

  const studentMechas = await prisma.studentMecha.findMany({ where: { studentId } });

  let pointsToApply: number;
  let logType: PointsLogType;
  let description: string;

  if (isPenalty && task.type === "RULE" && task.penaltyPoints > 0) {
    const deduct = penaltyAmount != null
      ? Math.max(1, Math.min(penaltyAmount, task.penaltyPoints))
      : task.penaltyPoints;
    pointsToApply = -deduct;
    logType = PointsLogType.TASK_PENALTY;
    description = `违反规则"${task.name}"`;
  } else {
    const requested = bodyPoints ?? task.maxPoints;
    pointsToApply = Math.max(0, Math.min(requested, task.maxPoints));
    logType = PointsLogType.TASK_REWARD;
    description = `完成任务"${task.name}"`;
  }

  await prisma.$transaction(async (tx) => {
    const taskLog = await tx.taskLog.create({
      data: {
        taskId,
        studentId,
        pointsAwarded: pointsToApply,
      },
    });
    await tx.student.update({
      where: { id: studentId },
      data: {
        // 学生积分最低为 0，惩罚规则下不会出现负分
        totalPoints: Math.max(0, student.totalPoints + pointsToApply),
        balance: Math.max(0, student.balance + pointsToApply),
        streakDays: pointsToApply >= 0 ? newStreak : student.streakDays,
        lastActiveAt: new Date(),
      },
    });
    await tx.pointsLog.create({
      data: {
        studentId,
        amount: pointsToApply,
        type: logType,
        description,
        taskLogId: taskLog.id,
      },
    });
    for (const sm of studentMechas) {
      // 机甲积分最低为 0，惩罚规则下不会出现负分
      await tx.studentMecha.update({
        where: { id: sm.id },
        data: { points: Math.max(0, sm.points + pointsToApply) },
      });
    }
  });

  return NextResponse.json({ success: true });
}
