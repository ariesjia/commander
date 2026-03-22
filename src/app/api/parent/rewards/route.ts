import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent } from "@/lib/api-auth";
import { parsePointsInput, pointsToNumber } from "@/lib/points-number";

export async function GET(request: Request) {
  const auth = await requireParent();
  if (!auth.ok) return auth.response;

  const rewards = await prisma.reward.findMany({
    where: { parentId: auth.parentId },
    orderBy: [{ points: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(
    rewards.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      imageUrl: r.imageUrl,
      points: pointsToNumber(r.points),
      isActive: r.isActive,
      createdAt: r.createdAt.toISOString(),
    }))
  );
}

export async function POST(request: Request) {
  const auth = await requireParent();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { name, description, imageUrl, points, isActive } = body;

    if (!name || points == null) {
      return NextResponse.json(
        { error: "请填写奖励名称和所需积分" },
        { status: 400 }
      );
    }

    const pts = Math.max(0, parsePointsInput(points) ?? 0);

    const reward = await prisma.reward.create({
      data: {
        parentId: auth.parentId,
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
        points: pts,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({
      id: reward.id,
      name: reward.name,
      description: reward.description,
      imageUrl: reward.imageUrl,
      points: pointsToNumber(reward.points),
      isActive: reward.isActive,
      createdAt: reward.createdAt.toISOString(),
    });
  } catch (e) {
    console.error("Create reward error:", e);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
