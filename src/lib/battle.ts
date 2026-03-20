import { BATTLE_ENEMIES, type BattleEnemyConfig } from "@/lib/battle-enemies";
import {
  battleSettings,
  type BattleRewardGrant,
} from "@/lib/battle-settings";

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

/** 仅胜利后调用；按权重表随机一档积分（首期无 item） */
export function rollWinPointRewards(
  random: () => number = Math.random,
): BattleRewardGrant[] {
  const table = battleSettings.winPointRewards;
  const r = random();
  let acc = 0;
  for (const row of table) {
    acc += row.weight;
    if (r < acc) {
      return [{ kind: "points", amount: row.amount }];
    }
  }
  const last = table[table.length - 1]!;
  return [{ kind: "points", amount: last.amount }];
}
