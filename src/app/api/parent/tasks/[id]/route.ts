import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent } from "@/lib/api-auth";
import { TaskType } from "@prisma/client";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireParent();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const task = await prisma.task.findFirst({
    where: { id, parentId: auth.parentId },
  });

  if (!task) {
    return NextResponse.json({ error: "任务不存在" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { name, description, type, points, isActive } = body;

    const data: { name?: string; description?: string | null; type?: TaskType; points?: number; isActive?: boolean } = {};
    if (name !== undefined) data.name = String(name).trim();
    if (description !== undefined) data.description = description ? String(description).trim() : null;
    if (type !== undefined) data.type = type === "WEEKLY" ? ("WEEKLY" as TaskType) : ("DAILY" as TaskType);
    if (points !== undefined) data.points = Math.max(0, parseInt(String(points), 10) || 0);
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.task.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      type: updated.type,
      points: updated.points,
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (e) {
    console.error("Update task error:", e);
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

  const task = await prisma.task.findFirst({
    where: { id, parentId: auth.parentId },
  });

  if (!task) {
    return NextResponse.json({ error: "任务不存在" }, { status: 404 });
  }

  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
