/**
 * 战斗演出动效类型（与 HP/胜负无关，仅前端表现）。
 * 新增效果：先扩展本文件，再在 CSS 与 useBattlePresentationFx 中实现。
 */

export type StrikeAccent = "spark" | "ripple" | "ember";
/** 攻击光束主视觉（与 rail 横条差异明显） */
export type BeamVisual = "rail" | "slash" | "bolt" | "burst" | "sweep";
export type DodgeMotion = "sidestep" | "drop" | "snap";
/** 大爆炸全屏叠层色调 */
export type ExplosionHue = "thermal" | "plasma";
export type ItemBurst = "cyan" | "magenta";

/** 技能类演出随机变体（服务端每步 0～2 抽样） */
export type SkillFxVariant = 0 | 1 | 2;

export function normalizeSkillFxVariant(v: unknown): SkillFxVariant {
  if (v === 1 || v === 2) return v;
  return 0;
}

export type BattleFx =
  | { kind: "none" }
  | {
      kind: "strike";
      attacker: "player" | "enemy";
      crit?: boolean;
      explosion?: boolean;
      /** 主弹道外观；未指定时由生成器随机 */
      beam?: BeamVisual;
      /** 受击侧额外装饰（火花/扩散环/余烬），不改变伤害语义 */
      accent?: StrikeAccent;
      /** 与 explosion 同开时全屏渐变色调 */
      hue?: ExplosionHue;
      /** 台词为 ATTACK 技能名时叠加我方侧技能光效变体 */
      attackSkillVariant?: SkillFxVariant;
    }
  | { kind: "dodge"; dodger: "player" | "enemy"; motion?: DodgeMotion }
  | { kind: "explosion"; hue?: ExplosionHue }
  | { kind: "item"; burst?: ItemBurst }
  /** 我方治疗/回充：柔和绿青脉冲，非攻击光束 */
  | { kind: "heal"; variant?: SkillFxVariant }
  /** 牵制干扰：敌方侧读数紊乱（与普攻命中视觉区分） */
  | { kind: "control"; variant?: SkillFxVariant }
  /** 防御减伤：我方侧护盾/装甲硬化（接敌命中时） */
  | { kind: "defense"; variant?: SkillFxVariant }
  /** 增益/支援：我方侧火控或输出增强（命中前摇）；`style: support` 略偏侦测协调色调 */
  | {
      kind: "buff";
      style?: "buff" | "support";
      variant?: SkillFxVariant;
      /** 台词同时展示 ATTACK 技能名时叠加技能爆闪 */
      flareAttackSkill?: SkillFxVariant;
    };

export type ServerBattleStep = {
  p: number;
  e: number;
  line: string;
  fx: BattleFx;
};

/** 与 dodge motion 对应的 CSS 类名（sidestep 为默认） */
export function dodgeMotionClass(motion: DodgeMotion | undefined): string {
  if (motion === "drop") return "animate-battle-dodge-drop";
  if (motion === "snap") return "animate-battle-dodge-snap";
  return "animate-battle-dodge";
}
