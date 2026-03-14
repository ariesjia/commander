import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent, getStudentId } from "@/lib/api-auth";
import { PointsLogType } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireParent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const { id: exchangeId } = await params;

  const exchange = await prisma.exchange.findFirst({
    where: { id: exchangeId, studentId },
    include: { reward: true },
  });

  if (!exchange) {
    return NextResponse.json({ error: "兑换记录不存在" }, { status: 404 });
  }

  if (exchange.status !== "PENDING") {
    return NextResponse.json({ error: "该兑换已处理" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Student" WHERE id = ${studentId} FOR UPDATE`;
      const student = await tx.student.findUniqueOrThrow({ where: { id: studentId } });

      if (student.balance < exchange.pointsCost) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      // frozenPoints 可能因历史数据不一致而不足，以 balance 为准
      const newFrozenPoints = Math.max(0, student.frozenPoints - exchange.pointsCost);

      await tx.exchange.update({
        where: { id: exchangeId },
        data: { status: "CONFIRMED", confirmedAt: new Date() },
      });
      await tx.student.update({
        where: { id: studentId },
        data: {
          balance: student.balance - exchange.pointsCost,
          frozenPoints: newFrozenPoints,
        },
      });
      await tx.pointsLog.create({
        data: {
          studentId,
          amount: -exchange.pointsCost,
          type: PointsLogType.EXCHANGE_COST,
          description: `兑换"${exchange.reward.name}"`,
        },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json({ error: "积分不足" }, { status: 400 });
    }
    throw e;
  }

  return NextResponse.json({ success: true });
}
