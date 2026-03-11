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

  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });

  if (student.frozenPoints < exchange.pointsCost) {
    return NextResponse.json({ error: "冻结积分不足" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.exchange.update({
      where: { id: exchangeId },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    }),
    prisma.student.update({
      where: { id: studentId },
      data: {
        balance: student.balance - exchange.pointsCost,
        frozenPoints: student.frozenPoints - exchange.pointsCost,
      },
    }),
    prisma.pointsLog.create({
      data: {
        studentId,
        amount: -exchange.pointsCost,
        type: PointsLogType.EXCHANGE_COST,
        description: `兑换"${exchange.reward.name}"`,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
