import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent, getStudentId } from "@/lib/api-auth";
import { getCurrentStage } from "@/lib/mecha-config";
import { addCalendarDaysChina, getTodayStr } from "@/lib/utils";
import { pointsToNumber } from "@/lib/points-number";
import {
  countStudentTotalPointsLogsInChinaDay,
  getStudentTodayYesterdayTotalPointsNetDb,
} from "@/lib/student-points-daily-net";

export async function GET() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
    include: {
      parent: { select: { baseScore: true } },
      studentMechas: true,
      primaryMecha: true,
    },
  });

  let primaryMecha = student.primaryMecha ?? null;
  if (!primaryMecha && student.studentMechas.length > 0) {
    const first = student.studentMechas.sort((a, b) => a.adoptedAt.getTime() - b.adoptedAt.getTime())[0]!;
    await prisma.student.update({
      where: { id: studentId },
      data: { primaryMechaId: first.id },
    });
    primaryMecha = first;
  }

  const primarySlug = primaryMecha?.mechaSlug ?? null;
  const primaryMechaPoints = pointsToNumber(primaryMecha?.points);

  const todayStr = getTodayStr();
  const yesterdayChinaStr = addCalendarDaysChina(todayStr, -1);
  const [{ todayNet, yesterdayNet }, yesterdayLogCount] = await Promise.all([
    getStudentTodayYesterdayTotalPointsNetDb(prisma, studentId, todayStr),
    countStudentTotalPointsLogsInChinaDay(prisma, studentId, yesterdayChinaStr),
  ]);

  const baseScore = (student.parent.baseScore ?? 1) as 0.1 | 1 | 10;
  const balanceDb = pointsToNumber(student.balance);
  /** 与学生 profile 一致：阶段由主机甲机甲分推导 */
  const mechaStage = getCurrentStage(primaryMechaPoints);

  return NextResponse.json({
    nickname: student.nickname,
    balance: balanceDb,
    baseScore,
    todayNet,
    yesterdayNet,
    deltaVsYesterday: todayNet - yesterdayNet,
    yesterdayLogCount,
    primarySlug,
    primaryMechaPoints,
    mechaStage,
    todayChina: todayStr,
  });
}
