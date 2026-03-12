import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** 获取所有可用的机甲列表（用于随机抽取） */
export async function GET() {
  const mechas = await prisma.mecha.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      intro: true,
    },
  });

  return NextResponse.json(mechas);
}
