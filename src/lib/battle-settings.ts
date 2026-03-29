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
  winProbability: 0.75,
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

/** 战斗演出 HP/技能插入（不影响胜负与奖励） */
export const battlePresentationSettings = {
  /** 每场最多条玩家技能专化演出（按 kind 去重优先） */
  maxPlayerSkillHighlights: 3,
  healAmount: { min: 6, max: 16 },
  /** 胜利：敌总 HP 100，分三段打掉；第三段为终结 */
  win: {
    openingDamageToEnemy: { min: 22, max: 34 },
    midDamageToEnemy: { min: 26, max: 44 },
    /** 无治疗时两记敌攻对我总和固定 36（100→64） */
    playerDamagePerHit: { min: 14, max: 22 },
    neutralPreDodgeMax: 2,
  },
  /** 失败：我总 100→0；敌总 100→40 */
  lose: {
    openingDamageToPlayer: { min: 18, max: 26 },
    playerCounterDamageToEnemy: { min: 28, max: 36 },
    enemyMidDamageToPlayer: { min: 22, max: 30 },
    playerSecondDamageToEnemy: { min: 22, max: 32 },
    neutralPreDodgeMax: 2,
  },
  defenseMitigation: { min: 0.78, max: 0.9 },
  controlMitigation: { min: 0.82, max: 0.94 },
  buffDamageMul: { min: 1.06, max: 1.16 },
  supportDamageMul: { min: 1.04, max: 1.12 },
} as const;
