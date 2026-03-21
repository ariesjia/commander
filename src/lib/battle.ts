import { BATTLE_ENEMIES, type BattleEnemyConfig } from "@/lib/battle-enemies";
import { battleSettings } from "@/lib/battle-settings";

/** 胜利奖励随机结果（item_random 需在事务内解析为具体 slug） */
export type BattleRewardRoll =
  | { kind: "points"; amount: number }
  | { kind: "item_random" };

/** 与 parent/tasks confirm 一致：上海当日 [start, end) */
export function getChinaDayBounds(dateStr: string): { start: Date; end: Date } {
  const start = new Date(`${dateStr}T00:00:00+08:00`);
  const end = new Date(start.getTime() + 86400000);
  return { start, end };
}

export function pickRandomEnemy(random: () => number = Math.random): BattleEnemyConfig {
  const i = Math.floor(random() * BATTLE_ENEMIES.length);
  return BATTLE_ENEMIES[i]!;
}

export function rollBattleOutcome(
  winProbability: number,
  random: () => number = Math.random,
): "WIN" | "LOSE" {
  return random() < winProbability ? "WIN" : "LOSE";
}

export function pickNarrative(
  enemy: BattleEnemyConfig,
  outcome: "WIN" | "LOSE",
  random: () => number = Math.random,
): string {
  const pool =
    outcome === "WIN" ? enemy.winNarratives : enemy.loseNarratives;
  if (pool.length === 0) return outcome === "WIN" ? "你取得了胜利。" : "这次交锋你落了下风。";
  return pool[Math.floor(random() * pool.length)]!;
}

/** 仅胜利后调用；按权重表随机一档（积分或「随机道具」） */
export function rollWinBattleRewards(random: () => number = Math.random): BattleRewardRoll {
  const table = battleSettings.winBattleRewards;
  const r = random();
  let acc = 0;
  for (const row of table) {
    acc += row.weight;
    if (r < acc) {
      if (row.kind === "points") {
        return { kind: "points", amount: row.amount };
      }
      return { kind: "item_random" };
    }
  }
  const last = table[table.length - 1]!;
  if (last.kind === "points") {
    return { kind: "points", amount: last.amount };
  }
  return { kind: "item_random" };
}
