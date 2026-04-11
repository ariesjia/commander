import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent, getStudentId } from "@/lib/api-auth";
import { getTodayStr } from "@/lib/utils";
import { generateGrade1Session, sessionHash } from "@/lib/maintenance-math";
import { DEFAULT_MAINTENANCE_GENERATOR_CONFIG } from "@/config/maintenance-math";
import { chinaDateStrToDbDate } from "@/lib/battle-server";

export async function GET() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
    include: { parent: { select: { maintenanceMathEnabled: true } } },
  });

  if (!student.parent.maintenanceMathEnabled) {
    return NextResponse.json(
      { error: "家长已关闭机甲维修", code: "MAINTENANCE_DISABLED" },
      { status: 403 },
    );
  }

  const dateKey = getTodayStr();
  const completedOn = chinaDateStrToDbDate(dateKey);

  const existing = await prisma.studentMaintenanceMathLog.findUnique({
    where: {
      studentId_completedOn: { studentId, completedOn },
    },
    include: {
      bonusItem: { select: { slug: true, name: true, imageUrl: true } },
    },
  });

  if (existing) {
    return NextResponse.json({
      status: "completed" as const,
      dateKey,
      completedAt: existing.completedAt.toISOString(),
      bonusReward: existing.bonusItem
        ? {
            slug: existing.bonusItem.slug,
            name: existing.bonusItem.name,
            imageUrl: existing.bonusItem.imageUrl,
          }
        : null,
    });
  }

  const spec = generateGrade1Session({
    studentId,
    dateKey,
    config: { ...DEFAULT_MAINTENANCE_GENERATOR_CONFIG },
  });

  const publicQuestions = spec.questions.map((q) =>
    q.kind === "binary"
      ? { kind: "binary" as const, id: q.id, a: q.a, op: q.op, b: q.b }
      : { kind: "chain" as const, id: q.id, nums: q.nums, ops: q.ops },
  );

  return NextResponse.json({
    status: "active" as const,
    dateKey,
    questions: publicQuestions,
    meta: spec.meta,
    sessionHash: sessionHash(spec),
  });
}
