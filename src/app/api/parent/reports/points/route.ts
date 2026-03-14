import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent, getStudentId } from "@/lib/api-auth";
import { PointsLogType } from "@prisma/client";

/** 根据 date (YYYY-MM-DD) 和 period 计算区间 [start, end)，end 为次日 00:00 */
function getDateRange(period: "week" | "month", dateStr: string): { start: Date; end: Date } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));

  if (period === "week") {
    const dayOfWeek = date.getUTCDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() + diff);
    const start = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate(), 0, 0, 0));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    return { start, end };
  }

  // month
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  return { start, end };
}

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

    const { start, end } = getDateRange(period, dateStr);

    const [logsInPeriod, logsBeforeStart] = await Promise.all([
      prisma.pointsLog.findMany({
        where: {
          studentId,
          createdAt: { gte: start, lt: end },
        },
      }),
      prisma.pointsLog.findMany({
        where: {
          studentId,
          createdAt: { lt: start },
        },
      }),
    ]);

    const startBalance = logsBeforeStart.reduce((sum, l) => sum + l.amount, 0);
    const endBalance = startBalance + logsInPeriod.reduce((sum, l) => sum + l.amount, 0);

    const taskTypes: PointsLogType[] = [
      PointsLogType.TASK_REWARD,
      PointsLogType.TASK_REWARD_UNDO,
      PointsLogType.TASK_PENALTY,
      PointsLogType.TASK_PENALTY_UNDO,
    ];
    const taskEarned = logsInPeriod
      .filter((l) => taskTypes.includes(l.type))
      .reduce((sum, l) => sum + l.amount, 0);
    const exchangeCost = Math.abs(
      logsInPeriod
        .filter((l) => l.type === PointsLogType.EXCHANGE_COST)
        .reduce((sum, l) => sum + l.amount, 0),
    );
    const exchangeRefund = logsInPeriod
      .filter((l) => l.type === PointsLogType.EXCHANGE_REFUND)
      .reduce((sum, l) => sum + l.amount, 0);

    return NextResponse.json({
      period,
      dateStr,
      start: start.toISOString(),
      end: end.toISOString(),
      taskEarned,
      exchangeCost,
      exchangeRefund,
      startBalance,
      endBalance,
    });
  } catch (e) {
    console.error("Points report error:", e);
    return NextResponse.json({ error: "获取积分报告失败" }, { status: 500 });
  }
}
