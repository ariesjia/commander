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

  const logs = await prisma.pointsLog.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
  });

  const reversed = [...logs].reverse();
  let runningBalance = 0;
  const withBalance = reversed.map((l) => {
    runningBalance += l.amount;
    return {
      id: l.id,
      amount: l.amount,
      type: l.type,
      description: l.description,
      balance: runningBalance,
      createdAt: l.createdAt.toISOString(),
    };
  });

  return NextResponse.json(withBalance.reverse());
}
