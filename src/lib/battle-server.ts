import { prisma } from "@/lib/db";
import { BattleOutcome, PointsLogType, Prisma } from "@prisma/client";
import { battleSettings, type BattleRewardGrant } from "@/lib/battle-settings";
import { getChinaDayBounds, type BattleRewardRoll } from "@/lib/battle";
import { getTodayStr } from "@/lib/utils";
import { pointsToNumber } from "@/lib/points-number";
import { BATTLE_ENEMIES } from "@/lib/battle-enemies";

export type BattleReasonCode = "THRESHOLD_NOT_MET" | "ALREADY_FOUGHT_TODAY" | null;

/** 今日已战时可拉取此结构，供前端重放演出（与 POST 响应字段对齐） */
export type TodayBattleReplayPayload = {
  outcome: "WIN" | "LOSE";
  narrative: string;
  enemy: {
    id: string;
    slug: string;
    name: string;
    description: string;
    imageUrl: string;
    skills: string[];
  };
  pointsAwarded: number;
  rewards: {
    kind: string;
    amount?: number;
    itemSlug?: string;
    quantity?: number;
    name?: string;
    imageUrl?: string;
  }[];
};

/**
 * 将胜利随机结果落库为具体奖励（积分直接返回；随机道具在事务内抽 Item 并 upsert StudentItem）
 */
export async function resolveWinBattleRewardRoll(
  tx: Prisma.TransactionClient,
  studentId: string,
  roll: BattleRewardRoll,
  random: () => number = Math.random,
): Promise<BattleRewardGrant[]> {
  if (roll.kind === "points") {
    return [{ kind: "points", amount: roll.amount }];
  }
  const items = await tx.item.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, name: true, imageUrl: true },
  });
  if (items.length === 0) {
    return [{ kind: "points", amount: 1 }];
  }
  const pick = items[Math.floor(random() * items.length)]!;
  await tx.studentItem.upsert({
    where: { studentId_itemId: { studentId, itemId: pick.id } },
    create: { studentId, itemId: pick.id, quantity: 1 },
    update: { quantity: { increment: 1 } },
  });
  return [
    {
      kind: "item",
      itemSlug: pick.slug,
      quantity: 1,
      name: pick.name,
      imageUrl: pick.imageUrl,
    },
  ];
}

export type BattleStatusPayload = {
  timezone: string;
  date: string;
  taskPointsToday: number;
  minPointsRequired: number;
  canFight: boolean;
  foughtToday: boolean;
  reasonCode: BattleReasonCode;
  message: string;
  /** 有今日战斗记录且能解析对手时为非 null，用于重放 */
  todayReplay: TodayBattleReplayPayload | null;
};

function parseBattleRewardsJson(
  json: Prisma.JsonValue | null,
): {
  kind: string;
  amount?: number;
  itemSlug?: string;
  quantity?: number;
  name?: string;
  imageUrl?: string;
}[] {
  if (json == null || !Array.isArray(json)) return [];
  const out: {
    kind: string;
    amount?: number;
    itemSlug?: string;
    quantity?: number;
    name?: string;
    imageUrl?: string;
  }[] = [];
  for (const item of json) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const kind = typeof o.kind === "string" ? o.kind : "";
    if (kind === "points" && typeof o.amount === "number") {
      out.push({ kind: "points", amount: o.amount });
    } else if (kind === "item" && typeof o.itemSlug === "string") {
      out.push({
        kind: "item",
        itemSlug: o.itemSlug,
        quantity: typeof o.quantity === "number" ? o.quantity : undefined,
        name: typeof o.name === "string" ? o.name : undefined,
        imageUrl: typeof o.imageUrl === "string" ? o.imageUrl : undefined,
      });
    }
  }
  return out;
}

function buildTodayBattleReplay(log: {
  outcome: BattleOutcome;
  narrative: string;
  enemyId: string;
  rewardsJson: Prisma.JsonValue | null;
}): TodayBattleReplayPayload | null {
  const enemyConfig =
    BATTLE_ENEMIES.find((e) => e.id === log.enemyId) ?? BATTLE_ENEMIES[0];
  if (!enemyConfig) return null;
  const rewards = parseBattleRewardsJson(log.rewardsJson);
  const pointsAwarded = rewards
    .filter((r): r is { kind: "points"; amount: number } => r.kind === "points" && typeof r.amount === "number")
    .reduce((s, r) => s + r.amount, 0);
  return {
    outcome: log.outcome === BattleOutcome.WIN ? "WIN" : "LOSE",
    narrative: log.narrative,
    enemy: {
      id: enemyConfig.id,
      slug: enemyConfig.slug,
      name: enemyConfig.name,
      description: enemyConfig.description,
      imageUrl: enemyConfig.imageUrl,
      skills: [...enemyConfig.skills],
    },
    pointsAwarded,
    rewards,
  };
}

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
      message: `战胜敌人可以获得积分，道具等奖励，每日新增积分需达到 ${battleSettings.minPointsEarnedToday} 分后才可战斗。`,
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

  const taskPointsToday =
    agg._sum.amount == null ? 0 : pointsToNumber(agg._sum.amount);
  const minPointsRequired = battleSettings.minPointsEarnedToday;
  const thresholdMet = taskPointsToday >= minPointsRequired;
  const foughtToday = Boolean(fought);
  const { canFight, reasonCode, message } = statusMessage(foughtToday, thresholdMet);
  const todayReplay = fought ? buildTodayBattleReplay(fought) : null;

  return {
    timezone: battleSettings.timezone,
    date: todayStr,
    taskPointsToday,
    minPointsRequired,
    canFight,
    foughtToday,
    reasonCode,
    message,
    todayReplay,
  };
}

export function isPrismaUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}
