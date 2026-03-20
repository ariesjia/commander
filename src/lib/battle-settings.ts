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
  winProbability: 0.4,
  /** 胜利后按权重抽一档；未来可插入 weight:0 表示「谢谢参与」 */
  winPointRewards: [
    { weight: 0.7, amount: 1 },
    { weight: 0.2, amount: 2 },
    { weight: 0.1, amount: 3 },
  ] as const,
};

/** 首期仅实现 points；未来可增加 item 等分支 */
export type BattleRewardGrant =
  | { kind: "points"; amount: number }
  | { kind: "item"; itemSlug: string; quantity: number };
