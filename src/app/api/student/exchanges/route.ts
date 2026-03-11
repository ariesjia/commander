import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent, getStudentId } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const exchanges = await prisma.exchange.findMany({
    where: { studentId },
    include: { reward: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    exchanges.map((e) => ({
      id: e.id,
      rewardId: e.rewardId,
      rewardName: e.reward.name,
      pointsCost: e.pointsCost,
      status: e.status,
      rejectReason: e.rejectReason,
      createdAt: e.createdAt.toISOString(),
      confirmedAt: e.confirmedAt?.toISOString(),
    }))
  );
}

export async function POST(request: Request) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const body = await request.json();
  const rewardId = body?.rewardId;

  if (!rewardId) {
    return NextResponse.json({ error: "请选择要兑换的奖励" }, { status: 400 });
  }

  const reward = await prisma.reward.findFirst({
    where: { id: rewardId, parentId: auth.parentId, isActive: true },
  });

  if (!reward) {
    return NextResponse.json({ error: "奖励不存在或已下架" }, { status: 404 });
  }

  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });
  const availableBalance = student.balance - student.frozenPoints;

  if (availableBalance < reward.points) {
    return NextResponse.json(
      { error: `积分不足，还差 ${reward.points - availableBalance} 积分` },
      { status: 400 }
    );
  }

  const exchange = await prisma.exchange.create({
    data: {
      rewardId: reward.id,
      studentId,
      pointsCost: reward.points,
      status: "PENDING",
    },
  });

  await prisma.student.update({
    where: { id: studentId },
    data: { frozenPoints: student.frozenPoints + reward.points },
  });

  return NextResponse.json({
    id: exchange.id,
    rewardId: exchange.rewardId,
    rewardName: reward.name,
    pointsCost: exchange.pointsCost,
    status: exchange.status,
    createdAt: exchange.createdAt.toISOString(),
  });
}
