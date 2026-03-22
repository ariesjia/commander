import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent } from "@/lib/api-auth";
import { parsePointsInput, pointsToNumber } from "@/lib/points-number";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireParent();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const reward = await prisma.reward.findFirst({
    where: { id, parentId: auth.parentId },
  });

  if (!reward) {
    return NextResponse.json({ error: "奖励不存在" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { name, description, imageUrl, points, isActive } = body;

    const data: { name?: string; description?: string | null; imageUrl?: string | null; points?: number; isActive?: boolean } = {};
    if (name !== undefined) data.name = String(name).trim();
    if (description !== undefined) data.description = description ? String(description).trim() : null;
    if (imageUrl !== undefined) data.imageUrl = imageUrl ? String(imageUrl).trim() : null;
    if (points !== undefined) data.points = Math.max(0, parsePointsInput(points) ?? 0);
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.reward.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      imageUrl: updated.imageUrl,
      points: pointsToNumber(updated.points),
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (e) {
    console.error("Update reward error:", e);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireParent();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const reward = await prisma.reward.findFirst({
    where: { id, parentId: auth.parentId },
  });

  if (!reward) {
    return NextResponse.json({ error: "奖励不存在" }, { status: 404 });
  }

  await prisma.reward.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
