import type { MechaDetail, MechaLevel } from "@/lib/mecha-adoption";

/**
 * 机甲库「朗读故事」用纯文本：机甲名、当前等级、等级描述、完整故事（intro），不含机甲简介 description
 */
export function buildMechaReadAloudText(mecha: MechaDetail, levelInfo: MechaLevel): string {
  const segments: string[] = [];

  segments.push(mecha.name.trim());
  segments.push(`当前等级是${levelInfo.name.trim()}`);

  const levelDesc = levelInfo.description?.trim();
  if (levelDesc) segments.push(levelDesc);

  const intro = mecha.intro?.trim();
  if (intro) segments.push(intro);

  if (segments.length === 0) return "";
  return `${segments.join("。")}。`;
}
