import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent, getStudentId } from "@/lib/api-auth";

/** 随机抽取一只机甲并领养 */
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

  // 获取所有可抽取的机甲（必须有等级配置）
  const allMechas = await prisma.mecha.findMany({
    where: { isActive: true },
    include: { levels: { orderBy: { level: "asc" } } },
  });

  const adoptedIds = student.adoptedMechaIds ?? [];
  const pool = allMechas.filter(
    (m) => m.levels.length > 0 && !adoptedIds.includes(m.slug),
  );
  if (pool.length === 0) {
    return NextResponse.json(
      adoptedIds.length > 0
        ? { error: "已拥有所有可领取的机甲" }
        : { error: allMechas.length > 0 ? "机甲配置不完整，请运行 npm run db:seed" : "暂无可领取的机甲" },
      { status: 400 }
    );
  }

  if (adoptedIds.length > 0) {
    return NextResponse.json({ error: "已有机甲，无需重复领取" }, { status: 400 });
  }

  // 随机抽取一只（从未拥有的机甲中抽取，避免重复）
  const drawn = pool[Math.floor(Math.random() * pool.length)]!;
  const mechaId = drawn.slug;

  await prisma.$transaction([
    prisma.student.update({
      where: { id: studentId },
      data: { adoptedMechaIds: [...(student.adoptedMechaIds ?? []), mechaId] },
    }),
    prisma.studentMecha.upsert({
      where: {
        studentId_mechaSlug: { studentId, mechaSlug: mechaId },
      },
      create: {
        studentId,
        mechaSlug: mechaId,
        points: 0,
      },
      update: {}, // 已存在则不重复领养
    }),
  ]);

  // 根据当前机甲积分计算等级展示（领养时 points=0）
  const levels = drawn.levels;
  const mechaPoints = 0; // 新领养，积分为 0
  let levelInfo = levels[0]!;
  for (const l of levels) {
    if (mechaPoints >= l.threshold) levelInfo = l;
    else break;
  }

  return NextResponse.json({
    ok: true,
    mechaId,
    name: drawn.name,
    imageUrl: levelInfo.imageUrl,
    levelName: levelInfo.name,
  });
}
