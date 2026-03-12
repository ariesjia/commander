import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent, getStudentId } from "@/lib/api-auth";
import { MECHA_XUANJIA, MECHA_SECOND, ADOPTION_ORDER, getXuanjiaLevelInfo, MECHA_SECOND_INFO } from "@/lib/mecha-adoption";
import { getXuanjiaLevel } from "@/lib/mecha-adoption";

export async function POST() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const ids = student.adoptedMechaIds ?? [];
  const nextIndex = ids.length;

  if (nextIndex >= ADOPTION_ORDER.length) {
    return NextResponse.json({ error: "已领养全部机甲" }, { status: 400 });
  }

  const mechaId = ADOPTION_ORDER[nextIndex];

  // 第二只需玄甲满级
  if (mechaId === MECHA_SECOND) {
    const xuanjiaLevel = getXuanjiaLevel(student.totalPoints);
    if (xuanjiaLevel < 7) {
      return NextResponse.json({ error: "玄甲需满级才能领取第二只机甲" }, { status: 400 });
    }
  }

  await prisma.student.update({
    where: { id: studentId },
    data: { adoptedMechaIds: [...ids, mechaId] },
  });

  // 返回机甲信息供前端展示
  const mechaInfo =
    mechaId === MECHA_XUANJIA
      ? (() => {
          const level = getXuanjiaLevelInfo(student.totalPoints);
          return { name: "玄甲", imageUrl: level.imageUrl, levelName: level.name };
        })()
      : { name: MECHA_SECOND_INFO.name, imageUrl: MECHA_SECOND_INFO.imageUrl, levelName: null };

  return NextResponse.json({ ok: true, mechaId, ...mechaInfo });
}
