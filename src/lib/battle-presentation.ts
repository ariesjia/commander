import type { MechaSkillKind } from "@prisma/client";
import type {
  BattleFx,
  BeamVisual,
  DodgeMotion,
  ExplosionHue,
  ItemBurst,
  ServerBattleStep,
  SkillFxVariant,
  StrikeAccent,
} from "@/components/battle/battle-fx-types";
import { battlePresentationSettings } from "@/lib/battle-settings";
import {
  battleLineEnemyHit,
  battleLinePlayerHit,
  ENEMY_HIT_SITUATIONS,
  ENEMY_OPENING_SITUATIONS,
  LOSE_PRE_DODGE_TENSION,
  LOSE_SPARRING_EARLY_LINES,
  LOSE_SPARRING_LATE_LINES,
  PLAYER_ACTIONS,
  PLAYER_HIT_EXTRAS,
  PLAYER_HIT_EXTRAS_CRIT,
  randomEnemyAttackLabel,
  randomEnemyDodgeLine,
  randomFinishLoseLine,
  randomFinishWinLine,
  randomPick,
  randomPlayerDodgeLine,
  WIN_PRE_DODGE_TENSION,
  WIN_SPARRING_EARLY_LINES,
  WIN_SPARRING_LATE_LINES,
} from "@/lib/battle-narrative-shared";

export type UnlockedBattleSkill = {
  kind: MechaSkillKind;
  name: string;
  slug: string;
};

function intInRange(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function skillFxVariant(random: () => number): SkillFxVariant {
  return intInRange(random, 0, 2) as SkillFxVariant;
}

function randomDodgeMotion(random: () => number): DodgeMotion {
  return randomPick(["sidestep", "drop", "snap"] as const, random);
}

function randomStrikeAccent(random: () => number): StrikeAccent | undefined {
  if (random() > 0.38) return undefined;
  return randomPick(["spark", "ripple", "ember"] as const, random);
}

function randomExplosionHue(random: () => number): ExplosionHue {
  return randomPick(["thermal", "plasma"] as const, random);
}

function randomItemBurst(random: () => number): ItemBurst {
  return randomPick(["cyan", "magenta"] as const, random);
}

function randomBeamVisual(random: () => number): BeamVisual {
  return randomPick(
    ["slash", "slash", "rail", "bolt", "burst", "sweep", "rail"] as const,
    random,
  );
}

function randomBeamVisualHeavy(random: () => number): BeamVisual {
  return randomPick(
    ["slash", "slash", "burst", "sweep", "bolt", "rail", "slash"] as const,
    random,
  );
}

function strikeFx(
  random: () => number,
  attacker: "player" | "enemy",
  opts: {
    crit?: boolean;
    explosion?: boolean;
    accent?: StrikeAccent;
    hue?: ExplosionHue;
    beam?: BeamVisual;
    attackSkillVariant?: SkillFxVariant;
  } = {},
): BattleFx {
  const { beam: beamOpt, attackSkillVariant, ...rest } = opts;
  return {
    kind: "strike",
    attacker,
    ...rest,
    beam: beamOpt ?? randomBeamVisual(random),
    ...(attacker === "player" && attackSkillVariant !== undefined
      ? { attackSkillVariant }
      : {}),
  };
}

type PickedSkills = {
  attackLine?: UnlockedBattleSkill;
  heal?: UnlockedBattleSkill;
  buff?: UnlockedBattleSkill;
  support?: UnlockedBattleSkill;
  defense?: UnlockedBattleSkill;
  control?: UnlockedBattleSkill;
};

function pickSkillsForBattle(
  unlocked: readonly UnlockedBattleSkill[],
  random: () => number,
): PickedSkills {
  const max = battlePresentationSettings.maxPlayerSkillHighlights;
  const byKind = new Map<MechaSkillKind, UnlockedBattleSkill>();
  const shuffled = [...unlocked].sort(() => random() - 0.5);
  for (const s of shuffled) {
    if (!byKind.has(s.kind)) byKind.set(s.kind, s);
    if (byKind.size >= max) break;
  }
  const out: PickedSkills = {};
  for (const s of byKind.values()) {
    if (s.kind === "ATTACK") out.attackLine = s;
    else if (s.kind === "HEAL") out.heal = s;
    else if (s.kind === "BUFF") out.buff = s;
    else if (s.kind === "SUPPORT") out.support = s;
    else if (s.kind === "DEFENSE") out.defense = s;
    else if (s.kind === "CONTROL") out.control = s;
  }
  return out;
}

function playerHitAction(
  skills: PickedSkills,
  random: () => number,
  useAttackSkill: boolean,
): string {
  if (useAttackSkill && skills.attackLine) {
    return `${skills.attackLine.name}！`;
  }
  return randomPick(PLAYER_ACTIONS, random);
}

function enemyHitLine(
  atk: string,
  dmg: number,
  situation: string,
  controlFlavor: boolean,
  random: () => number,
): string {
  const base = battleLineEnemyHit(atk, dmg, situation);
  if (!controlFlavor) return base;
  return randomPick(
    [
      `${base}（干扰读数，本应更糟！）`,
      `${base}（牵制成功，伤害被压了一截！）`,
    ],
    random,
  );
}

function validateSteps(steps: ServerBattleStep[], outcome: "WIN" | "LOSE"): boolean {
  for (const s of steps) {
    if (s.p < 0 || s.p > 100 || s.e < 0 || s.e > 100) return false;
  }
  const last = steps[steps.length - 1];
  if (!last) return false;
  if (outcome === "WIN") return last.e === 0 && last.p === 64;
  return last.p === 0 && last.e === 40;
}

/** WIN 末 (64,0)，LOSE 末 (0,40)；与客户端无 steps 时直接展示的终点 HP 一致 */
export function buildBattleStepsFromOutcome(args: {
  outcome: "WIN" | "LOSE";
  enemySkills: readonly string[];
  inventoryNames: readonly string[];
  unlockedPlayerSkills: readonly UnlockedBattleSkill[];
  random?: () => number;
}): ServerBattleStep[] {
  const random = args.random ?? Math.random;
  const skills = args.enemySkills;
  const inv = args.inventoryNames.map((n) => n.trim()).filter(Boolean);
  const enemyAtk = () => randomEnemyAttackLabel(skills, random);

  for (let attempt = 0; attempt < 200; attempt++) {
    const picked = pickSkillsForBattle(args.unlockedPlayerSkills, random);
    const steps =
      args.outcome === "WIN"
        ? tryBuildWin({ random, enemyAtk, inv, picked })
        : tryBuildLose({ random, enemyAtk, inv, picked });
    if (steps && validateSteps(steps, args.outcome)) return steps;
  }

  throw new Error("buildBattleStepsFromOutcome: failed to sample valid steps");
}

function tryBuildWin(ctx: {
  random: () => number;
  enemyAtk: () => string;
  inv: string[];
  picked: PickedSkills;
}): ServerBattleStep[] | null {
  const { random, enemyAtk, inv, picked } = ctx;
  const w = battlePresentationSettings.win;

  const neutralCount = Math.floor(random() * (w.neutralPreDodgeMax + 1));
  const dOpen = intInRange(random, w.openingDamageToEnemy.min, w.openingDamageToEnemy.max);
  let dMid = intInRange(random, w.midDamageToEnemy.min, w.midDamageToEnemy.max);
  const mul =
    picked.buff || picked.support
      ? intInRange(
          random,
          Math.round(
            (picked.buff
              ? battlePresentationSettings.buffDamageMul.min
              : battlePresentationSettings.supportDamageMul.min) * 100,
          ),
          Math.round(
            (picked.buff
              ? battlePresentationSettings.buffDamageMul.max
              : battlePresentationSettings.supportDamageMul.max) * 100,
          ),
        ) / 100
      : 1;
  if (picked.buff || picked.support) {
    dMid = Math.min(48, Math.max(20, Math.round(dMid * mul)));
  }
  const dFin = 100 - dOpen - dMid;
  if (dFin < 24 || dFin > 50) return null;

  const healSkill = picked.heal;
  const healAmt = healSkill
    ? intInRange(random, battlePresentationSettings.healAmount.min, battlePresentationSettings.healAmount.max)
    : 0;

  let dE1 = intInRange(random, w.playerDamagePerHit.min, w.playerDamagePerHit.max);
  if (picked.defense) {
    const m =
      intInRange(
        random,
        Math.round(battlePresentationSettings.defenseMitigation.min * 100),
        Math.round(battlePresentationSettings.defenseMitigation.max * 100),
      ) / 100;
    dE1 = Math.max(10, Math.round(dE1 * m));
  }
  const p1 = 100 - dE1;
  const pHeal = healSkill ? Math.min(100, p1 + healAmt) : p1;
  const dE2 = pHeal - 64;
  if (dE2 < 12 || dE2 > 48) return null;

  const eAfterOpen = 100 - dOpen;
  const eAfterMid = eAfterOpen - dMid;
  if (eAfterMid !== dFin) return null;

  const firstAction = playerHitAction(picked, random, true);
  const firstLine = battleLinePlayerHit(
    firstAction,
    dOpen,
    randomPick(PLAYER_HIT_EXTRAS_CRIT, random),
  );

  const preDodge: ServerBattleStep[] = [];
  for (let i = 0; i < neutralCount; i++) {
    preDodge.push({
      p: 100,
      e: eAfterOpen,
      line: randomPick(WIN_PRE_DODGE_TENSION, random),
      fx: { kind: "none" },
    });
  }

  const steps: ServerBattleStep[] = [
    {
      p: 100,
      e: eAfterOpen,
      line: firstLine,
      fx: strikeFx(random, "player", {
        crit: true,
        explosion: true,
        hue: randomExplosionHue(random),
        beam: randomBeamVisualHeavy(random),
        ...(picked.attackLine ? { attackSkillVariant: skillFxVariant(random) } : {}),
      }),
    },
    ...preDodge,
    {
      p: 100,
      e: eAfterOpen,
      line: randomPlayerDodgeLine(enemyAtk(), random),
      fx: { kind: "dodge", dodger: "player", motion: randomDodgeMotion(random) },
    },
  ];

  steps.push({
    p: 100,
    e: eAfterOpen,
    line: randomPick(WIN_SPARRING_EARLY_LINES, random),
    fx: strikeFx(random, random() < 0.5 ? "player" : "enemy", {
      accent: randomStrikeAccent(random),
    }),
  });

  steps.push({
    p: p1,
    e: eAfterOpen,
    line: enemyHitLine(
      enemyAtk(),
      dE1,
      randomPick(ENEMY_HIT_SITUATIONS, random),
      Boolean(picked.control),
      random,
    ),
    fx: picked.control
      ? { kind: "control", variant: skillFxVariant(random) }
      : picked.defense
        ? { kind: "defense", variant: skillFxVariant(random) }
        : strikeFx(random, "enemy", { accent: randomStrikeAccent(random) }),
  });

  if (healSkill && healAmt > 0) {
    steps.push({
      p: pHeal,
      e: eAfterOpen,
      line: randomPick(
        [
          `【我方】${healSkill.name}启动，机体修复了${healAmt}点体力！`,
          `【我方】${healSkill.name}展开，护盾回充，恢复${healAmt}点体力！`,
          `【我方】${healSkill.name}生效，装甲读数回升${healAmt}点！`,
        ],
        random,
      ),
      fx: { kind: "heal", variant: skillFxVariant(random) },
    });
  }

  const midAction = playerHitAction(picked, random, !picked.attackLine);
  steps.push({
    p: pHeal,
    e: eAfterMid,
    line: battleLinePlayerHit(midAction, dMid, randomPick(PLAYER_HIT_EXTRAS, random)),
    fx: picked.buff
      ? { kind: "buff", style: "buff", variant: skillFxVariant(random) }
      : picked.support
        ? { kind: "buff", style: "support", variant: skillFxVariant(random) }
        : strikeFx(random, "player", { accent: randomStrikeAccent(random) }),
  });

  steps.push({
    p: pHeal,
    e: eAfterMid,
    line: randomPick(WIN_SPARRING_LATE_LINES, random),
    fx: strikeFx(random, random() < 0.5 ? "enemy" : "player", {
      accent: randomStrikeAccent(random),
    }),
  });

  steps.push({
    p: 64,
    e: eAfterMid,
    line: enemyHitLine(
      enemyAtk(),
      dE2,
      randomPick(ENEMY_HIT_SITUATIONS, random),
      false,
      random,
    ),
    fx: strikeFx(random, "enemy", { accent: randomStrikeAccent(random) }),
  });

  steps.push({
    p: 64,
    e: 0,
    line: randomFinishWinLine(random),
    fx: strikeFx(random, "player", {
      crit: true,
      explosion: true,
      hue: randomExplosionHue(random),
      beam: randomBeamVisualHeavy(random),
    }),
  });

  if (inv.length > 0) {
    const name = randomPick(inv, random);
    const itemStep: ServerBattleStep = {
      p: 100,
      e: eAfterOpen,
      line: `【我方】掷出「${name}」晃了一下对手传感器！`,
      fx: { kind: "item", burst: randomItemBurst(random) },
    };
    const insertAt = 1 + neutralCount + 1 + 1;
    steps.splice(insertAt, 0, itemStep);
  }

  return validateSteps(steps, "WIN") ? steps : null;
}

function tryBuildLose(ctx: {
  random: () => number;
  enemyAtk: () => string;
  inv: string[];
  picked: PickedSkills;
}): ServerBattleStep[] | null {
  const { random, enemyAtk, inv, picked } = ctx;
  const L = battlePresentationSettings.lose;

  const neutralCount = Math.floor(random() * (L.neutralPreDodgeMax + 1));

  let dOpen = intInRange(random, L.openingDamageToPlayer.min, L.openingDamageToPlayer.max);
  if (picked.defense) {
    const m =
      intInRange(
        random,
        Math.round(battlePresentationSettings.defenseMitigation.min * 100),
        Math.round(battlePresentationSettings.defenseMitigation.max * 100),
      ) / 100;
    dOpen = Math.max(12, Math.round(dOpen * m));
  }

  let dP1 = intInRange(random, L.playerCounterDamageToEnemy.min, L.playerCounterDamageToEnemy.max);
  if (picked.buff || picked.support) {
    const mul =
      intInRange(
        random,
        Math.round(
          (picked.buff
            ? battlePresentationSettings.buffDamageMul.min
            : battlePresentationSettings.supportDamageMul.min) * 100,
        ),
        Math.round(
          (picked.buff
            ? battlePresentationSettings.buffDamageMul.max
            : battlePresentationSettings.supportDamageMul.max) * 100,
        ),
      ) / 100;
    dP1 = Math.min(40, Math.max(24, Math.round(dP1 * mul)));
  }

  let dEmid = intInRange(random, L.enemyMidDamageToPlayer.min, L.enemyMidDamageToPlayer.max);
  if (picked.control) {
    const m =
      intInRange(
        random,
        Math.round(battlePresentationSettings.controlMitigation.min * 100),
        Math.round(battlePresentationSettings.controlMitigation.max * 100),
      ) / 100;
    dEmid = Math.max(16, Math.round(dEmid * m));
  }

  const p0 = 100 - dOpen;
  const pAfterCounter = p0;
  const e1 = 100 - dP1;
  const p1 = pAfterCounter - dEmid;

  const healSkill = picked.heal;
  const healAmt = healSkill
    ? intInRange(random, battlePresentationSettings.healAmount.min, battlePresentationSettings.healAmount.max)
    : 0;
  const pHeal = healSkill ? Math.min(100, p1 + healAmt) : p1;

  /** 敌终点 40：第二段我方对敌伤害由 e1 唯一确定 */
  const dP2 = e1 - 40;
  if (
    dP2 < L.playerSecondDamageToEnemy.min ||
    dP2 > L.playerSecondDamageToEnemy.max
  ) {
    return null;
  }
  const e2 = 40;

  const dFin = pHeal;
  if (dFin < 28 || dFin > 72) return null;

  const openingEnemy = enemyAtk();
  const firstLine = battleLineEnemyHit(
    openingEnemy,
    dOpen,
    randomPick(ENEMY_OPENING_SITUATIONS, random),
  );

  const preDodge: ServerBattleStep[] = [];
  for (let i = 0; i < neutralCount; i++) {
    preDodge.push({
      p: p0,
      e: 100,
      line: randomPick(LOSE_PRE_DODGE_TENSION, random),
      fx: { kind: "none" },
    });
  }

  const counterAction = playerHitAction(picked, random, true);
  const losingBlow = enemyAtk();

  const steps: ServerBattleStep[] = [
    {
      p: p0,
      e: 100,
      line: firstLine,
      fx: picked.defense
        ? { kind: "defense", variant: skillFxVariant(random) }
        : strikeFx(random, "enemy", {
            accent: randomStrikeAccent(random),
            beam: randomBeamVisual(random),
          }),
    },
    ...preDodge,
    {
      p: p0,
      e: 100,
      line: randomEnemyDodgeLine(counterAction, random),
      fx: { kind: "dodge", dodger: "enemy", motion: randomDodgeMotion(random) },
    },
  ];

  steps.push({
    p: p0,
    e: 100,
    line: randomPick(LOSE_SPARRING_EARLY_LINES, random),
    fx: strikeFx(random, random() < 0.5 ? "player" : "enemy", {
      accent: randomStrikeAccent(random),
    }),
  });

  steps.push({
    p: p0,
    e: e1,
    line: battleLinePlayerHit(counterAction, dP1, randomPick(PLAYER_HIT_EXTRAS, random)),
    fx: picked.buff
      ? {
          kind: "buff",
          style: "buff",
          variant: skillFxVariant(random),
          ...(picked.attackLine ? { flareAttackSkill: skillFxVariant(random) } : {}),
        }
      : picked.support
        ? {
            kind: "buff",
            style: "support",
            variant: skillFxVariant(random),
            ...(picked.attackLine ? { flareAttackSkill: skillFxVariant(random) } : {}),
          }
        : strikeFx(random, "player", {
            accent: randomStrikeAccent(random),
            ...(picked.attackLine ? { attackSkillVariant: skillFxVariant(random) } : {}),
          }),
  });

  steps.push({
    p: p1,
    e: e1,
    line: battleLineEnemyHit(enemyAtk(), dEmid, randomPick(ENEMY_HIT_SITUATIONS, random)),
    fx: picked.control
      ? { kind: "control", variant: skillFxVariant(random) }
      : strikeFx(random, "enemy", { accent: randomStrikeAccent(random) }),
  });

  if (healSkill && healAmt > 0) {
    steps.push({
      p: pHeal,
      e: e1,
      line: randomPick(
        [
          `【我方】${healSkill.name}紧急介入，拉回${healAmt}点体力！`,
          `【我方】${healSkill.name}生效，读数回升${healAmt}点！`,
        ],
        random,
      ),
      fx: { kind: "heal", variant: skillFxVariant(random) },
    });
  }

  steps.push({
    p: pHeal,
    e: e1,
    line: randomPick(LOSE_SPARRING_LATE_LINES, random),
    fx: strikeFx(random, random() < 0.5 ? "enemy" : "player", {
      accent: randomStrikeAccent(random),
    }),
  });

  steps.push({
    p: pHeal,
    e: e2,
    line: battleLinePlayerHit(
      playerHitAction(picked, random, !picked.attackLine),
      dP2,
      randomPick(PLAYER_HIT_EXTRAS, random),
    ),
    fx: strikeFx(random, "player", { accent: randomStrikeAccent(random) }),
  });

  steps.push({
    p: 0,
    e: e2,
    line: randomFinishLoseLine(losingBlow, random),
    fx: strikeFx(random, "enemy", {
      crit: true,
      explosion: true,
      hue: randomExplosionHue(random),
      beam: randomBeamVisualHeavy(random),
    }),
  });

  if (inv.length > 0) {
    const name = randomPick(inv, random);
    const itemStep: ServerBattleStep = {
      p: p0,
      e: 100,
      line: `【我方】把「${name}」甩进对方视野，干扰读数一瞬间！`,
      fx: { kind: "item", burst: randomItemBurst(random) },
    };
    const insertAt = 1 + neutralCount + 1 + 1;
    steps.splice(insertAt, 0, itemStep);
  }

  return validateSteps(steps, "LOSE") ? steps : null;
}
