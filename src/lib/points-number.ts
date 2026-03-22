import type { Prisma } from "@prisma/client";

/** Prisma Decimal 与 JSON 数字统一为 number，便于运算与序列化 */
export function pointsToNumber(v: Prisma.Decimal | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  return v.toNumber();
}

/** 请求体中的积分/小数：支持字符串与逗号小数点 */
export function parsePointsInput(v: unknown): number | undefined {
  if (v == null) return undefined;
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  const s = String(v).trim().replace(",", ".");
  if (s === "") return undefined;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : undefined;
}
