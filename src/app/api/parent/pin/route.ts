import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent } from "@/lib/api-auth";
import { hashPin } from "@/lib/auth";

export async function PUT(request: Request) {
  const auth = await requireParent();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const pin = String(body?.pin ?? "").trim();

  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "PIN 码必须是 4 位数字" }, { status: 400 });
  }

  const pinHash = await hashPin(pin);

  await prisma.parent.update({
    where: { id: auth.parentId },
    data: { pinHash },
  });

  return NextResponse.json({ success: true });
}
