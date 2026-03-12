import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** 根据积分获取机甲当前等级信息 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const points = parseInt(searchParams.get("points") ?? "0", 10);

  const mecha = await prisma.mecha.findUnique({
    where: { slug, isActive: true },
    include: {
      levels: { orderBy: { level: "asc" } },
    },
  });

  if (!mecha) {
    return NextResponse.json({ error: "机甲不存在" }, { status: 404 });
  }

  const levels = mecha.levels;
  let currentLevel = levels[0]!;
  for (const l of levels) {
    if (points >= l.threshold) currentLevel = l;
    else break;
  }

  return NextResponse.json({
    level: currentLevel.level,
    name: currentLevel.name,
    threshold: currentLevel.threshold,
    imageUrl: currentLevel.imageUrl,
    description: currentLevel.description,
  });
}
