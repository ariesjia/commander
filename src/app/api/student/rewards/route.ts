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

  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });
  const availableBalance = student.balance - student.frozenPoints;

  const rewards = await prisma.reward.findMany({
    where: { parentId: auth.parentId, isActive: true },
    orderBy: [{ points: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(
    rewards.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      imageUrl: r.imageUrl,
      points: r.points,
      isActive: r.isActive,
      createdAt: r.createdAt.toISOString(),
      canRedeem: availableBalance >= r.points,
      pointsNeeded: Math.max(0, r.points - availableBalance),
    }))
  );
}
