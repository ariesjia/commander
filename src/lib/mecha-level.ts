import type { Prisma } from "@prisma/client";
import { pointsToNumber } from "@/lib/points-number";

/** 与 GET /api/mechas/[slug]/level 及前端 getLevelFromMecha 一致：按 threshold 升序取最高可达等级 */
export function getCurrentMechaLevelFromPoints<T extends { threshold: Prisma.Decimal | number }>(
  levels: readonly T[],
  points: number,
): T | null {
  if (!levels.length) return null;
  let current = levels[0]!;
  for (const l of levels) {
    if (points >= pointsToNumber(l.threshold)) current = l;
    else break;
  }
  return current;
}
