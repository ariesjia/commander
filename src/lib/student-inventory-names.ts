import type { Prisma } from "@prisma/client";

/** 与前端 fetchInventoryNamesForBattle 一致：数量>0 的道具名（去重） */
export async function getActiveStudentItemDisplayNames(
  tx: Prisma.TransactionClient,
  studentId: string,
): Promise<string[]> {
  const rows = await tx.studentItem.findMany({
    where: { studentId, quantity: { gt: 0 } },
    include: { item: { select: { name: true } } },
  });
  const names = rows
    .map((r) => r.item.name.trim())
    .filter(Boolean);
  return [...new Set(names)];
}
