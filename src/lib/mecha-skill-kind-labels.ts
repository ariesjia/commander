import type { MechaSkillKind } from "@prisma/client";

/** 与 docs/stories/0004-mecha-skills.md §4.2.1 一致 */
export const MECHA_SKILL_KIND_LABELS: Record<MechaSkillKind, string> = {
  ATTACK: "攻击",
  DEFENSE: "防御",
  BUFF: "增益",
  HEAL: "治疗",
  CONTROL: "控制",
  SUPPORT: "支援",
};

export function mechaSkillKindLabel(kind: string): string {
  return MECHA_SKILL_KIND_LABELS[kind as MechaSkillKind] ?? kind;
}
