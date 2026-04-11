import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent, getStudentId } from "@/lib/api-auth";
import { getTodayStr } from "@/lib/utils";
import { generateGrade1Session, expectedAnswer, sessionHash } from "@/lib/maintenance-math";
import {
  DEFAULT_MAINTENANCE_GENERATOR_CONFIG,
  MAINTENANCE_BONUS_ITEM_PROBABILITY,
} from "@/config/maintenance-math";
import { chinaDateStrToDbDate } from "@/lib/battle-server";

/** 单次维修合理上限（毫秒），防止异常值 */
const MAX_MAINTENANCE_DURATION_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
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
  });

  if (existing) {
    return NextResponse.json({ error: "今日维修已完成", code: "ALREADY_COMPLETED" }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const answers = body.answers as unknown;
  const durationMsRaw = (body as { durationMs?: unknown }).durationMs;

  if (typeof durationMsRaw !== "number" || !Number.isFinite(durationMsRaw)) {
    return NextResponse.json({ error: "durationMs 需为数字（毫秒）", code: "INVALID_BODY" }, { status: 400 });
  }
  const durationMs = Math.max(0, Math.min(Math.round(durationMsRaw), MAX_MAINTENANCE_DURATION_MS));

  if (!Array.isArray(answers) || answers.some((x) => typeof x !== "number" || !Number.isFinite(x))) {
    return NextResponse.json({ error: "answers 需为数字数组", code: "INVALID_BODY" }, { status: 400 });
  }

  const spec = generateGrade1Session({
    studentId,
    dateKey,
    config: { ...DEFAULT_MAINTENANCE_GENERATOR_CONFIG },
  });

  if (answers.length !== spec.questions.length) {
    return NextResponse.json(
      { error: "答案数量与题目不一致", code: "ANSWER_COUNT_MISMATCH" },
      { status: 400 },
    );
  }

  for (let i = 0; i < spec.questions.length; i++) {
    const q = spec.questions[i]!;
    const got = answers[i]!;
    const exp = expectedAnswer(q);
    if (got !== exp) {
      return NextResponse.json(
        { error: "还有读数不对，请再试一次", code: "WRONG_ANSWERS" },
        { status: 400 },
      );
    }
  }

  const hash = sessionHash(spec);

  const { created, bonusReward } = await prisma.$transaction(async (tx) => {
    let bonusItemId: string | null = null;
    let bonusReward: { slug: string; name: string; imageUrl: string } | null = null;

    if (Math.random() < MAINTENANCE_BONUS_ITEM_PROBABILITY) {
      const items = await tx.item.findMany({
        where: { isActive: true },
        select: { id: true, slug: true, name: true, imageUrl: true },
      });
      if (items.length > 0) {
        const pick = items[Math.floor(Math.random() * items.length)]!;
        bonusItemId = pick.id;
        bonusReward = { slug: pick.slug, name: pick.name, imageUrl: pick.imageUrl };
        await tx.studentItem.upsert({
          where: { studentId_itemId: { studentId, itemId: pick.id } },
          create: { studentId, itemId: pick.id, quantity: 1 },
          update: { quantity: { increment: 1 } },
        });
      }
    }

    const created = await tx.studentMaintenanceMathLog.create({
      data: {
        studentId,
        completedOn,
        correctCount: spec.questions.length,
        totalCount: spec.questions.length,
        durationMs,
        generatorId: spec.meta.generatorId,
        sessionHash: hash,
        bonusItemId,
      },
    });

    return { created, bonusReward };
  });

  return NextResponse.json({
    ok: true,
    dateKey,
    message: "今日维修完成",
    completedAt: created.completedAt.toISOString(),
    bonusReward,
  });
}
