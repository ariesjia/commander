import type { PrismaClient } from "@prisma/client";
import { PointsLogType } from "@prisma/client";
import { addCalendarDaysChina } from "@/lib/utils";
import { pointsToNumber } from "@/lib/points-number";

/** 影响 Student.totalPoints 的流水类型（不含兑换） */
export const TOTAL_POINTS_IMPACT_LOG_TYPES: PointsLogType[] = [
  PointsLogType.TASK_REWARD,
  PointsLogType.TASK_REWARD_UNDO,
  PointsLogType.TASK_PENALTY,
  PointsLogType.TASK_PENALTY_UNDO,
  PointsLogType.BATTLE_REWARD,
];

/** 中国时区自然日 YYYY-MM-DD 对应的 [start, end) UTC 区间 */
export function getChinaDayBoundsUtc(dateStr: string): { start: Date; end: Date } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const start = new Date(
    `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00+08:00`,
  );
  const nextStr = addCalendarDaysChina(dateStr, 1);
  const [ny, nm, nd] = nextStr.split("-").map(Number);
  const end = new Date(
    `${ny}-${String(nm).padStart(2, "0")}-${String(nd).padStart(2, "0")}T00:00:00+08:00`,
  );
  return { start, end };
}

/**
 * 指定学生在某上海自然日内，对累计分有影响的积分流水净变化（DB 单位：1 分基准）
 */
export async function getStudentTotalPointsDailyNetDb(
  prisma: PrismaClient,
  studentId: string,
  chinaDateStr: string,
): Promise<number> {
  const { start, end } = getChinaDayBoundsUtc(chinaDateStr);
  const agg = await prisma.pointsLog.aggregate({
    where: {
      studentId,
      type: { in: TOTAL_POINTS_IMPACT_LOG_TYPES },
      createdAt: { gte: start, lt: end },
    },
    _sum: { amount: true },
  });
  return pointsToNumber(agg._sum.amount);
}

export async function countStudentTotalPointsLogsInChinaDay(
  prisma: PrismaClient,
  studentId: string,
  chinaDateStr: string,
): Promise<number> {
  const { start, end } = getChinaDayBoundsUtc(chinaDateStr);
  return prisma.pointsLog.count({
    where: {
      studentId,
      type: { in: TOTAL_POINTS_IMPACT_LOG_TYPES },
      createdAt: { gte: start, lt: end },
    },
  });
}

export async function getStudentTodayYesterdayTotalPointsNetDb(
  prisma: PrismaClient,
  studentId: string,
  todayChinaStr: string,
): Promise<{ todayNet: number; yesterdayNet: number }> {
  const yesterdayChinaStr = addCalendarDaysChina(todayChinaStr, -1);
  const [
    todayNet,
    yesterdayNet,
  ] = await Promise.all([
    getStudentTotalPointsDailyNetDb(prisma, studentId, todayChinaStr),
    getStudentTotalPointsDailyNetDb(prisma, studentId, yesterdayChinaStr),
  ]);
  return { todayNet, yesterdayNet };
}
