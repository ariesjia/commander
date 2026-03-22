/**
 * 战斗演出动效类型（与 HP/胜负无关，仅前端表现）。
 * 新增效果：先扩展本文件，再在 CSS 与 useBattlePresentationFx 中实现。
 */

export type StrikeAccent = "spark" | "ripple" | "ember";
export type DodgeMotion = "sidestep" | "drop" | "snap";
/** 大爆炸全屏叠层色调 */
export type ExplosionHue = "thermal" | "plasma";
export type ItemBurst = "cyan" | "magenta";

export type BattleFx =
  | { kind: "none" }
  | {
      kind: "strike";
      attacker: "player" | "enemy";
      crit?: boolean;
      explosion?: boolean;
      /** 受击侧额外装饰（火花/扩散环/余烬），不改变伤害语义 */
      accent?: StrikeAccent;
      /** 与 explosion 同开时全屏渐变色调 */
      hue?: ExplosionHue;
    }
  | { kind: "dodge"; dodger: "player" | "enemy"; motion?: DodgeMotion }
  | { kind: "explosion"; hue?: ExplosionHue }
  | { kind: "item"; burst?: ItemBurst };

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
