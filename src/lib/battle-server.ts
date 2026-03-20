import { prisma } from "@/lib/db";
import { PointsLogType, Prisma } from "@prisma/client";
import { battleSettings } from "@/lib/battle-settings";
import { getChinaDayBounds } from "@/lib/battle";
import { getTodayStr } from "@/lib/utils";

export type BattleReasonCode = "THRESHOLD_NOT_MET" | "ALREADY_FOUGHT_TODAY" | null;

export type BattleStatusPayload = {
  timezone: string;
  date: string;
  taskPointsToday: number;
  minPointsRequired: number;
  canFight: boolean;
  foughtToday: boolean;
  reasonCode: BattleReasonCode;
  message: string;
};

function statusMessage(
  foughtToday: boolean,
  thresholdMet: boolean,
): { canFight: boolean; reasonCode: BattleReasonCode; message: string } {
  if (foughtToday) {
    return {
      canFight: false,
      reasonCode: "ALREADY_FOUGHT_TODAY",
      message: "今日已进行过战斗，明天再来吧。",
    };
  }
  if (!thresholdMet) {
    return {
      canFight: false,
      reasonCode: "THRESHOLD_NOT_MET",
      message: `今日完成任务获得的积分需达到 ${battleSettings.minPointsEarnedToday} 分后才可战斗。`,
    };
  }
  return {
    canFight: true,
    reasonCode: null,
    message: "可以开始今日战斗。",
  };
}

/** 上海日历日对应的 PG DATE（仅日期部分） */
export function chinaDateStrToDbDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export async function getBattleStatusForStudent(
  studentId: string,
  todayStr: string = getTodayStr(),
): Promise<BattleStatusPayload> {
  const { start, end } = getChinaDayBounds(todayStr);
  const types = battleSettings.eligiblePointsLogTypesForThreshold as unknown as PointsLogType[];

  const [agg, fought] = await Promise.all([
    prisma.pointsLog.aggregate({
      where: {
        studentId,
        type: { in: types },
        amount: { gt: 0 },
        createdAt: { gte: start, lt: end },
      },
      _sum: { amount: true },
    }),
    prisma.studentBattleLog.findFirst({
      where: {
        studentId,
        foughtOn: chinaDateStrToDbDate(todayStr),
      },
    }),
  ]);

  const taskPointsToday = agg._sum.amount ?? 0;
  const minPointsRequired = battleSettings.minPointsEarnedToday;
  const thresholdMet = taskPointsToday >= minPointsRequired;
  const foughtToday = Boolean(fought);
  const { canFight, reasonCode, message } = statusMessage(foughtToday, thresholdMet);

  return {
    timezone: battleSettings.timezone,
    date: todayStr,
    taskPointsToday,
    minPointsRequired,
    canFight,
    foughtToday,
    reasonCode,
    message,
  };
}

export function isPrismaUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}
