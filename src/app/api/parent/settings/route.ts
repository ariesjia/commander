import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent } from "@/lib/api-auth";

const VALID_BASE_SCORES = [0.1, 1, 10] as const;

export async function GET(request: Request) {
  const auth = await requireParent();
  if (!auth.ok) return auth.response;

  const parent = await prisma.parent.findUniqueOrThrow({
    where: { id: auth.parentId },
    select: { showPinyin: true, baseScore: true, maintenanceMathEnabled: true },
  });

  return NextResponse.json({
    showPinyin: parent.showPinyin,
    baseScore: parent.baseScore as 0.1 | 1 | 10,
    maintenanceMathEnabled: parent.maintenanceMathEnabled,
  });
}

async function updateSettings(request: Request) {
  const auth = await requireParent();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const showPinyin = body.showPinyin;
  const baseScore = body.baseScore;
  const maintenanceMathEnabled = body.maintenanceMathEnabled;

  const data: {
    showPinyin?: boolean;
    baseScore?: number;
    maintenanceMathEnabled?: boolean;
  } = {};

  if (typeof showPinyin === "boolean") {
    data.showPinyin = showPinyin;
  }

  if (typeof maintenanceMathEnabled === "boolean") {
    data.maintenanceMathEnabled = maintenanceMathEnabled;
  }

  if (baseScore !== undefined) {
    const num = Number(baseScore);
    if (!VALID_BASE_SCORES.includes(num as (typeof VALID_BASE_SCORES)[number])) {
      return NextResponse.json({ error: "baseScore 需为 0.1、1 或 10" }, { status: 400 });
    }
    data.baseScore = num;
  }

  if (Object.keys(data).length === 0) {
    const parent = await prisma.parent.findUniqueOrThrow({
      where: { id: auth.parentId },
      select: { showPinyin: true, baseScore: true, maintenanceMathEnabled: true },
    });
    return NextResponse.json({
      showPinyin: parent.showPinyin,
      baseScore: parent.baseScore,
      maintenanceMathEnabled: parent.maintenanceMathEnabled,
    });
  }

  const updated = await prisma.parent.update({
    where: { id: auth.parentId },
    data,
    select: { showPinyin: true, baseScore: true, maintenanceMathEnabled: true },
  });

  return NextResponse.json({
    showPinyin: updated.showPinyin,
    baseScore: updated.baseScore as 0.1 | 1 | 10,
    maintenanceMathEnabled: updated.maintenanceMathEnabled,
  });
}

export async function PATCH(request: Request) {
  return updateSettings(request);
}

export async function PUT(request: Request) {
  return updateSettings(request);
}
