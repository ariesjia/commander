import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent, getStudentId } from "@/lib/api-auth";
import { pointsToNumber } from "@/lib/points-number";

export async function GET(_request: Request) {
  try {
    const auth = await requireParent();
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
      const amt = pointsToNumber(l.amount);
      runningBalance += amt;
      return {
        id: l.id,
        amount: amt,
        type: l.type,
        description: l.description,
        balance: runningBalance,
        createdAt: l.createdAt.toISOString(),
      };
    });

    return NextResponse.json(withBalance.reverse());
  } catch (e) {
    console.error("Points log error:", e);
    return NextResponse.json({ error: "获取积分记录失败" }, { status: 500 });
  }
}
