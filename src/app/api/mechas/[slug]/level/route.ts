import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pointsToNumber } from "@/lib/points-number";
import { getCurrentMechaLevelFromPoints } from "@/lib/mecha-level";

/** 根据积分获取机甲当前等级信息 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const points = parseFloat(searchParams.get("points") ?? "0") || 0;

  const mecha = await prisma.mecha.findUnique({
    where: { slug, isActive: true },
    include: {
      levels: { orderBy: { level: "asc" } },
    },
  });

  if (!mecha) {
    return NextResponse.json({ error: "机甲不存在" }, { status: 404 });
  }

  const currentLevel = getCurrentMechaLevelFromPoints(mecha.levels, points);
  if (!currentLevel) {
    return NextResponse.json({ error: "机甲等级数据异常" }, { status: 500 });
  }

  return NextResponse.json({
    level: currentLevel.level,
    name: currentLevel.name,
    threshold: pointsToNumber(currentLevel.threshold),
    imageUrl: currentLevel.imageUrl,
    description: currentLevel.description,
  });
}
