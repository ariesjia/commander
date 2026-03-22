import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent, getStudentId } from "@/lib/api-auth";
import { pointsToNumber } from "@/lib/points-number";

export async function GET(request: Request) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });
  const availableBalance = pointsToNumber(student.balance) - pointsToNumber(student.frozenPoints);

  const rewards = await prisma.reward.findMany({
    where: { parentId: auth.parentId, isActive: true },
    orderBy: [{ points: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(
    rewards.map((r) => {
      const pts = pointsToNumber(r.points);
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        imageUrl: r.imageUrl,
        points: pts,
        isActive: r.isActive,
        createdAt: r.createdAt.toISOString(),
        canRedeem: availableBalance >= pts,
        pointsNeeded: Math.max(0, pts - availableBalance),
      };
    })
  );
}
