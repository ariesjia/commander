import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent, getStudentId } from "@/lib/api-auth";
import { getTodayStr } from "@/lib/utils";
import { chinaDateStrToDbDate } from "@/lib/battle-server";
import {
  buildDrivingGuideSessionForStudent,
  sessionHash,
} from "@/lib/driving-guide/session";
import {
  DRIVING_GUIDE_STEPS_PER_SESSION,
} from "@/lib/driving-guide/constants";
import {
  evaluateHandwritingVision,
  parseDataUrlToBuffer,
} from "@/lib/driving-guide/ocr";
import { randomSuccessLine, randomFailureLine } from "@/lib/driving-guide/copy";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
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

  const doneLog = await prisma.studentDrivingGuideLog.findUnique({
    where: {
      studentId_completedOn: { studentId, completedOn },
    },
  });
  if (doneLog) {
    return NextResponse.json(
      { error: "今日驾驶指南已完成", code: "ALREADY_COMPLETED" },
      { status: 409 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const sessionHashIn = typeof body.sessionHash === "string" ? body.sessionHash : "";
  const stepIndex = typeof body.stepIndex === "number" ? body.stepIndex : -1;
  const imageBase64 = typeof body.imageBase64 === "string" ? body.imageBase64 : "";

  if (!sessionHashIn || stepIndex < 0 || stepIndex >= DRIVING_GUIDE_STEPS_PER_SESSION) {
    return NextResponse.json({ error: "参数无效" }, { status: 400 });
  }
  if (!imageBase64.trim()) {
    return NextResponse.json({ error: "请提交手写图片" }, { status: 400 });
  }

  const spec = buildDrivingGuideSessionForStudent({
    studentId,
    dateKey,
    drivingGuideWordList: student.drivingGuideWordList,
  });
  const expectedHash = sessionHash(spec);
  if (sessionHashIn !== expectedHash) {
    return NextResponse.json(
      { error: "会话已过期，请刷新页面", code: "SESSION_STALE" },
      { status: 409 },
    );
  }

  const step = spec.steps[stepIndex];
  if (!step) {
    return NextResponse.json({ error: "步骤无效" }, { status: 400 });
  }

  let vision: { match: boolean; recognized: string };
  try {
    const buf = parseDataUrlToBuffer(imageBase64);
    vision = await evaluateHandwritingVision(buf, step.word);
  } catch (e) {
    console.error("driving-guide OCR", e);
    return NextResponse.json(
      {
        ok: false,
        hint: randomFailureLine(),
        code: "OCR_FAILED",
      },
      { status: 200 },
    );
  }

  const skipOcr = process.env.DRIVING_GUIDE_OCR_SKIP === "1";
  const ok = skipOcr ? true : vision.match;

  if (!ok) {
    return NextResponse.json({
      ok: false,
      hint: randomFailureLine(),
      rawOcr:
        process.env.NODE_ENV === "development"
          ? vision.recognized || undefined
          : undefined,
    });
  }

  const isLast = stepIndex === DRIVING_GUIDE_STEPS_PER_SESSION - 1;
  if (isLast) {
    try {
      await prisma.studentDrivingGuideLog.create({
        data: {
          studentId,
          completedOn,
          generatorId: spec.meta.generatorId,
          sessionHash: expectedHash,
        },
      });
    } catch (e) {
      return NextResponse.json(
        { error: "今日驾驶指南已完成", code: "ALREADY_COMPLETED" },
        { status: 409 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    encouragement: randomSuccessLine(),
    finishedSession: isLast,
  });
}
