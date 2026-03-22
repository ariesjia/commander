import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent, getStudentId } from "@/lib/api-auth";
import { pointsToNumber } from "@/lib/points-number";

/** 学生取消自己的待审核兑换申请 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireStudent();
    if (!auth.ok) return auth.response;

    const studentId = await getStudentId(auth.parentId);
    if (!studentId) {
      return NextResponse.json({ error: "未找到学生" }, { status: 404 });
    }

    const { id: exchangeId } = await params;

    const exchange = await prisma.exchange.findFirst({
      where: { id: exchangeId, studentId },
    });

    if (!exchange) {
      return NextResponse.json({ error: "兑换记录不存在" }, { status: 404 });
    }

    if (exchange.status !== "PENDING") {
      return NextResponse.json({ error: "该兑换已处理，无法取消" }, { status: 400 });
    }

    const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });
    const frozen = pointsToNumber(student.frozenPoints);
    const cost = pointsToNumber(exchange.pointsCost);

    await prisma.$transaction([
      prisma.exchange.update({
        where: { id: exchangeId },
        data: { status: "CANCELLED" },
      }),
      prisma.student.update({
        where: { id: studentId },
        data: {
          frozenPoints: Math.max(0, frozen - cost),
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Cancel exchange error:", e);
    return NextResponse.json({ error: "取消失败" }, { status: 500 });
  }
}
