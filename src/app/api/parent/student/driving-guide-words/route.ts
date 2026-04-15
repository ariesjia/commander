import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireParent, getStudentId } from "@/lib/api-auth";
import {
  normalizeAndValidateWordListForSave,
  parseStoredDrivingGuideWordList,
  resolveDrivingGuideWordPool,
} from "@/lib/driving-guide/word-pool";

export async function GET() {
  const auth = await requireParent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { drivingGuideWordList: true },
  });

  const raw = student?.drivingGuideWordList ?? null;
  const { source } = resolveDrivingGuideWordPool(raw);
  const usingDefault = source === "default";
  const words = parseStoredDrivingGuideWordList(raw);

  return NextResponse.json({ words, usingDefault });
}

export async function PUT(request: Request) {
  const auth = await requireParent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const result = normalizeAndValidateWordListForSave(body);

  if (!result.ok) {
    return NextResponse.json({ error: result.errors[0], errors: result.errors }, { status: 400 });
  }

  const updated = await prisma.student.update({
    where: { id: studentId },
    data: {
      drivingGuideWordList:
        result.value === null ? Prisma.DbNull : (result.value as Prisma.InputJsonValue),
    },
    select: { drivingGuideWordList: true },
  });

  const raw = updated.drivingGuideWordList;
  const { source } = resolveDrivingGuideWordPool(raw);
  return NextResponse.json({
    words: parseStoredDrivingGuideWordList(raw),
    usingDefault: source === "default",
  });
}
