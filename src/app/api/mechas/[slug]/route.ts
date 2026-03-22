import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pointsToNumber } from "@/lib/points-number";

export interface MechaLevelDto {
  level: number;
  name: string;
  threshold: number;
  imageUrl: string;
  description: string;
}

export interface MechaSkillDto {
  unlockLevel: number;
  kind: string;
  slug: string;
  name: string;
  description: string;
}

export interface MechaDetailDto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  intro: string | null;
  levels: MechaLevelDto[];
  skills: MechaSkillDto[];
}

/** 根据 slug 获取机甲完整配置（含等级信息） */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const mecha = await prisma.mecha.findUnique({
    where: { slug, isActive: true },
    include: {
      levels: { orderBy: { level: "asc" } },
      skills: { orderBy: { unlockLevel: "asc" } },
    },
  });

  if (!mecha) {
    return NextResponse.json({ error: "机甲不存在" }, { status: 404 });
  }

  const dto: MechaDetailDto = {
    id: mecha.id,
    slug: mecha.slug,
    name: mecha.name,
    description: mecha.description,
    intro: mecha.intro,
    levels: mecha.levels.map((l) => ({
      level: l.level,
      name: l.name,
      threshold: pointsToNumber(l.threshold),
      imageUrl: l.imageUrl,
      description: l.description ?? "",
    })),
    skills: mecha.skills.map((s) => ({
      unlockLevel: s.unlockLevel,
      kind: s.kind,
      slug: s.slug,
      name: s.name,
      description: s.description,
    })),
  };

  return NextResponse.json(dto);
}
