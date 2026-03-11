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

  const body = await request.json().catch(() => ({}));
  const rejectReason = body?.reason ? String(body.reason).trim() : null;

  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });

  await prisma.$transaction([
    prisma.exchange.update({
      where: { id: exchangeId },
      data: { status: "REJECTED", rejectReason },
    }),
    prisma.student.update({
      where: { id: studentId },
      data: {
        frozenPoints: student.frozenPoints - exchange.pointsCost,
      },
    }),
    prisma.pointsLog.create({
      data: {
        studentId,
        amount: exchange.pointsCost,
        type: PointsLogType.EXCHANGE_REFUND,
        description: `兑换"${exchange.reward.name}"被拒绝退回`,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
