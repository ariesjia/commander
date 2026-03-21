/**
 * 每日战斗可调参数（与任务确认自然日一致：Asia/Shanghai）
 * 见 docs/stories/0002-student-battle-system.md
 */

import type { PointsLogType } from "@prisma/client";

export const battleSettings = {
  /** 与 getTodayStr / 任务确认一致 */
  timezone: "Asia/Shanghai" as const,
  minPointsEarnedToday: 5,
  /** 计入「当日任务积分门槛」：默认仅家长确认任务后的奖励 */
  eligiblePointsLogTypesForThreshold: ["TASK_REWARD"] as const satisfies readonly PointsLogType[],
  winProbability: 0.6,
  /**
   * 胜利后按权重抽一档（权重之和应为 1）。
   * - points：固定积分
   * - item_random：从当前启用的 Item 中均匀随机一件，数量 +1
   */
  winBattleRewards: [
    { weight: 0.3, kind: "points" as const, amount: 1 },
    { weight: 0.15, kind: "points" as const, amount: 2 },
    { weight: 0.05, kind: "points" as const, amount: 3 },
    { weight: 0.5, kind: "item_random" as const },
  ] as const,
};

export type BattleRewardGrant =
  | { kind: "points"; amount: number }
  /** name / imageUrl 供前端展示；历史数据可能仅有 itemSlug */
  | { kind: "item"; itemSlug: string; quantity: number; name?: string; imageUrl?: string };
