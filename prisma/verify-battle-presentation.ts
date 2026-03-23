/**
 * 固定种子下断言 WIN/LOSE 终点 HP 与边界；运行：npx tsx prisma/verify-battle-presentation.ts
 */
import type { MechaSkillKind } from "@prisma/client";
import { buildBattleStepsFromOutcome } from "../src/lib/battle-presentation";

let seed = 0xdeadbeef;
function rng() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 2 ** 32;
}

const unlocked = [
  { kind: "ATTACK" as MechaSkillKind, name: "测试斩", slug: "t1" },
  { kind: "HEAL" as MechaSkillKind, name: "修复场", slug: "t2" },
  { kind: "BUFF" as MechaSkillKind, name: "过载", slug: "t3" },
  { kind: "DEFENSE" as MechaSkillKind, name: "硬化", slug: "t4" },
  { kind: "CONTROL" as MechaSkillKind, name: "干扰", slug: "t5" },
  { kind: "SUPPORT" as MechaSkillKind, name: "协调", slug: "t6" },
];

for (let i = 0; i < 300; i++) {
  const win = buildBattleStepsFromOutcome({
    outcome: "WIN",
    enemySkills: ["电热鞭"],
    inventoryNames: i % 7 === 0 ? ["干扰箔"] : [],
    unlockedPlayerSkills: unlocked,
    random: rng,
  });
  const lose = buildBattleStepsFromOutcome({
    outcome: "LOSE",
    enemySkills: ["冲撞"],
    inventoryNames: [],
    unlockedPlayerSkills: unlocked,
    random: rng,
  });
  const wLast = win[win.length - 1];
  const lLast = lose[lose.length - 1];
  if (!wLast || wLast.e !== 0 || wLast.p !== 64) throw new Error(`WIN end bad: ${JSON.stringify(wLast)}`);
  if (!lLast || lLast.p !== 0 || lLast.e !== 40) throw new Error(`LOSE end bad: ${JSON.stringify(lLast)}`);
  for (const s of win) {
    if (s.p < 0 || s.p > 100 || s.e < 0 || s.e > 100) throw new Error("WIN bounds");
  }
  for (const s of lose) {
    if (s.p < 0 || s.p > 100 || s.e < 0 || s.e > 100) throw new Error("LOSE bounds");
  }
}

console.log("verify-battle-presentation: ok");
