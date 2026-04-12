import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent, getStudentId } from "@/lib/api-auth";
import { getTodayStr } from "@/lib/utils";
import { chinaDateStrToDbDate } from "@/lib/battle-server";
import {
  generateDrivingGuideSession,
  sessionHash,
  specToPublicSteps,
} from "@/lib/driving-guide/session";

export async function GET() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
    include: { parent: { select: { drivingGuideEnabled: true } } },
  });

  if (!student.parent.drivingGuideEnabled) {
    return NextResponse.json(
      { error: "家长已关闭驾驶指南", code: "DRIVING_GUIDE_DISABLED" },
      { status: 403 },
    );
  }

  const dateKey = getTodayStr();
  const completedOn = chinaDateStrToDbDate(dateKey);

  const existing = await prisma.studentDrivingGuideLog.findUnique({
    where: {
      studentId_completedOn: { studentId, completedOn },
    },
  });

  if (existing) {
    return NextResponse.json({
      status: "completed" as const,
      dateKey,
      completedAt: existing.completedAt.toISOString(),
    });
  }

  const spec = generateDrivingGuideSession({ studentId, dateKey });
  const hash = sessionHash(spec);

  return NextResponse.json({
    status: "active" as const,
    dateKey,
    sessionHash: hash,
    steps: specToPublicSteps(spec),
    meta: spec.meta,
  });
}
