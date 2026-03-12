import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await requireParent();
  if (!auth.ok) return auth.response;

  const parent = await prisma.parent.findUniqueOrThrow({
    where: { id: auth.parentId },
    select: { showPinyin: true },
  });

  return NextResponse.json({ showPinyin: parent.showPinyin });
}

async function updateSettings(request: Request) {
  const auth = await requireParent();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const showPinyin = body.showPinyin;

  if (typeof showPinyin !== "boolean") {
    return NextResponse.json({ error: "showPinyin 需为布尔值" }, { status: 400 });
  }

  await prisma.parent.update({
    where: { id: auth.parentId },
    data: { showPinyin },
  });

  return NextResponse.json({ showPinyin });
}

export async function PATCH(request: Request) {
  return updateSettings(request);
}

export async function PUT(request: Request) {
  return updateSettings(request);
}
