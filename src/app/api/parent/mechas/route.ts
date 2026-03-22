import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent, getStudentId } from "@/lib/api-auth";
import { pointsToNumber } from "@/lib/points-number";

/** 家长端：获取系统中所有机甲，及孩子对每款机甲的拥有数量和积分 */
export async function GET() {
  const auth = await requireParent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const [mechas, studentMechas] = await Promise.all([
    prisma.mecha.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { levels: { orderBy: { level: "asc" } } },
    }),
    prisma.studentMecha.findMany({
      where: { studentId },
    }),
  ]);

  const ownedBySlug: Record<string, { count: number; points: number }> = {};
  for (const sm of studentMechas) {
    if (!ownedBySlug[sm.mechaSlug]) {
      ownedBySlug[sm.mechaSlug] = { count: 0, points: 0 };
    }
    ownedBySlug[sm.mechaSlug]!.count += 1;
    ownedBySlug[sm.mechaSlug]!.points = pointsToNumber(sm.points);
  }

  return NextResponse.json(
    mechas.map((m) => ({
      id: m.id,
      slug: m.slug,
      name: m.name,
      description: m.description,
      intro: m.intro,
      levels: m.levels.map((l) => ({
        level: l.level,
        name: l.name,
        threshold: pointsToNumber(l.threshold),
        imageUrl: l.imageUrl,
        description: l.description ?? "",
      })),
      ownedCount: ownedBySlug[m.slug]?.count ?? 0,
      points: ownedBySlug[m.slug]?.points ?? 0,
    }))
  );
}
