import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent, getStudentId } from "@/lib/api-auth";
import { pointsToNumber } from "@/lib/points-number";

export async function GET(request: Request) {
  const auth = await requireParent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const [pending, all] = await Promise.all([
    prisma.exchange.findMany({
      where: { studentId, status: "PENDING" },
      include: { reward: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.exchange.findMany({
      where: { studentId },
      include: { reward: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const format = (e: (typeof pending)[0]) => ({
    id: e.id,
    rewardId: e.rewardId,
    rewardName: e.reward.name,
    pointsCost: pointsToNumber(e.pointsCost),
    status: e.status,
    rejectReason: e.rejectReason,
    createdAt: e.createdAt.toISOString(),
    confirmedAt: e.confirmedAt?.toISOString(),
  });

  return NextResponse.json({
    pending: pending.map(format),
    all: all.map(format),
  });
}
