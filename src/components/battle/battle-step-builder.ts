import type {
  BattleFx,
  BeamVisual,
  DodgeMotion,
  ExplosionHue,
  ItemBurst,
  ServerBattleStep,
  StrikeAccent,
} from "@/components/battle/battle-fx-types";
import {
  battleLineEnemyHit,
  battleLinePlayerHit,
  ENEMY_HIT_SITUATIONS,
  ENEMY_OPENING_SITUATIONS,
  LOSE_PRE_DODGE_TENSION,
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
} from "@/components/battle/battle-narrative";

function randomDodgeMotion(): DodgeMotion {
  return randomPick(["sidestep", "drop", "snap"] as const);
}

/** 非终结普攻约 38% 带受击侧装饰 */
function randomStrikeAccent(): StrikeAccent | undefined {
  if (Math.random() > 0.38) return undefined;
  return randomPick(["spark", "ripple", "ember"] as const);
}

function randomExplosionHue(): ExplosionHue {
  return randomPick(["thermal", "plasma"] as const);
}

function randomItemBurst(): ItemBurst {
  return randomPick(["cyan", "magenta"] as const);
}

function randomBeamVisual(): BeamVisual {
  return randomPick(["rail", "slash", "bolt", "burst", "sweep"] as const);
}

/** 终结技 / 暴击：偏重大范围冲击 */
function randomBeamVisualHeavy(): BeamVisual {
  return randomPick(["burst", "slash", "sweep", "bolt", "rail"] as const);
}

function strikeFx(
  attacker: "player" | "enemy",
  opts: {
    crit?: boolean;
    explosion?: boolean;
    accent?: StrikeAccent;
    hue?: ExplosionHue;
    beam?: BeamVisual;
  } = {},
): BattleFx {
  return {
    kind: "strike",
    attacker,
    ...opts,
    beam: opts.beam ?? randomBeamVisual(),
  };
}

/** 生成服务端演出战报步骤：保持与原硬编码相同的 HP 时间线；闪避前随机 0～2 条中立句以错开闪避位置 */
export function buildServerBattleSteps(args: {
  outcome: "WIN" | "LOSE";
  enemySkills: readonly string[];
  inventoryNames: readonly string[];
}): ServerBattleStep[] {
  const skills = args.enemySkills;
  const inv = args.inventoryNames.map((n) => n.trim()).filter(Boolean);

  const enemyAtk = () => randomEnemyAttackLabel(skills);

  if (args.outcome === "WIN") {
    const firstAction = randomPick(PLAYER_ACTIONS);
    const firstLine = battleLinePlayerHit(
      firstAction,
      28,
      randomPick(PLAYER_HIT_EXTRAS_CRIT),
    );
    const neutralCount = Math.floor(Math.random() * 3);

    const preDodge: ServerBattleStep[] = [];
    for (let i = 0; i < neutralCount; i++) {
      preDodge.push({
        p: 100,
        e: 72,
        line: randomPick(WIN_PRE_DODGE_TENSION),
        fx: { kind: "none" },
      });
    }

    const dodgeStep: ServerBattleStep = {
      p: 100,
      e: 72,
      line: randomPlayerDodgeLine(randomEnemyAttackLabel(skills)),
      fx: { kind: "dodge", dodger: "player", motion: randomDodgeMotion() },
    };

    const afterDodge: ServerBattleStep[] = [
      {
        p: 82,
        e: 72,
        line: battleLineEnemyHit(enemyAtk(), 18, randomPick(ENEMY_HIT_SITUATIONS)),
        fx: strikeFx("enemy", { accent: randomStrikeAccent() }),
      },
      {
        p: 82,
        e: 38,
        line: battleLinePlayerHit(randomPick(PLAYER_ACTIONS), 34, randomPick(PLAYER_HIT_EXTRAS)),
        fx: strikeFx("player", { accent: randomStrikeAccent() }),
      },
      {
        p: 64,
        e: 38,
        line: battleLineEnemyHit(enemyAtk(), 18, randomPick(ENEMY_HIT_SITUATIONS)),
        fx: strikeFx("enemy", { accent: randomStrikeAccent() }),
      },
      {
        p: 64,
        e: 0,
        line: randomFinishWinLine(),
        fx: strikeFx("player", {
          crit: true,
          explosion: true,
          hue: randomExplosionHue(),
          beam: randomBeamVisualHeavy(),
        }),
      },
    ];

    let steps: ServerBattleStep[] = [
      {
        p: 100,
        e: 72,
        line: firstLine,
        fx: strikeFx("player", {
          crit: true,
          explosion: true,
          hue: randomExplosionHue(),
          beam: randomBeamVisualHeavy(),
        }),
      },
      ...preDodge,
      dodgeStep,
      ...afterDodge,
    ];

    if (inv.length > 0 && Math.random() < 0.3) {
      const name = randomPick(inv);
      const itemStep: ServerBattleStep = {
        p: 100,
        e: 72,
        line: `【我方】掷出「${name}」晃了一下对手传感器！`,
        fx: { kind: "item", burst: randomItemBurst() },
      };
      const insertAt = 1 + neutralCount + 1;
      steps = [...steps.slice(0, insertAt), itemStep, ...steps.slice(insertAt)];
    }

    return steps;
  }

  const openingEnemy = enemyAtk();
  const firstLine = battleLineEnemyHit(openingEnemy, 22, randomPick(ENEMY_OPENING_SITUATIONS));
  const neutralCount = Math.floor(Math.random() * 3);

  const preDodge: ServerBattleStep[] = [];
  for (let i = 0; i < neutralCount; i++) {
    preDodge.push({
      p: 78,
      e: 100,
      line: randomPick(LOSE_PRE_DODGE_TENSION),
      fx: { kind: "none" },
    });
  }

  const counterAction = randomPick(PLAYER_ACTIONS);
  const dodgeStep: ServerBattleStep = {
    p: 78,
    e: 100,
    line: randomEnemyDodgeLine(counterAction),
    fx: { kind: "dodge", dodger: "enemy", motion: randomDodgeMotion() },
  };

  const losingBlow = enemyAtk();
  const afterDodge: ServerBattleStep[] = [
    {
      p: 78,
      e: 68,
      line: battleLinePlayerHit(counterAction, 32, randomPick(PLAYER_HIT_EXTRAS)),
      fx: strikeFx("player", { accent: randomStrikeAccent() }),
    },
    {
      p: 52,
      e: 68,
      line: battleLineEnemyHit(enemyAtk(), 26, randomPick(ENEMY_HIT_SITUATIONS)),
      fx: strikeFx("enemy", { accent: randomStrikeAccent() }),
    },
    {
      p: 52,
      e: 40,
      line: battleLinePlayerHit(randomPick(PLAYER_ACTIONS), 28, randomPick(PLAYER_HIT_EXTRAS)),
      fx: strikeFx("player", { accent: randomStrikeAccent() }),
    },
    {
      p: 0,
      e: 40,
      line: randomFinishLoseLine(losingBlow),
      fx: strikeFx("enemy", {
        crit: true,
        explosion: true,
        hue: randomExplosionHue(),
        beam: randomBeamVisualHeavy(),
      }),
    },
  ];

  let steps: ServerBattleStep[] = [
    {
      p: 78,
      e: 100,
      line: firstLine,
      fx: strikeFx("enemy", {
        accent: randomStrikeAccent(),
        beam: randomBeamVisual(),
      }),
    },
    ...preDodge,
    dodgeStep,
    ...afterDodge,
  ];

  if (inv.length > 0 && Math.random() < 0.3) {
    const name = randomPick(inv);
    const itemStep: ServerBattleStep = {
      p: 78,
      e: 100,
      line: `【我方】把「${name}」甩进对方视野，干扰读数一瞬间！`,
      fx: { kind: "item", burst: randomItemBurst() },
    };
    const insertAt = 1 + neutralCount + 1;
    steps = [...steps.slice(0, insertAt), itemStep, ...steps.slice(insertAt)];
  }

  return steps;
}
