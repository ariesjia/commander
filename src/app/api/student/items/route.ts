import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent, getStudentId } from "@/lib/api-auth";
import type { StudentItemsResponse } from "@/types/items";

export async function GET() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const rows = await prisma.studentItem.findMany({
    where: { studentId, quantity: { gt: 0 } },
    include: { item: true },
    orderBy: [{ item: { sortOrder: "asc" } }, { item: { name: "asc" } }],
  });

  const body: StudentItemsResponse = {
    items: rows.map((r) => ({
      quantity: r.quantity,
      item: {
        slug: r.item.slug,
        name: r.item.name,
        description: r.item.description,
        imageUrl: r.item.imageUrl,
        kind: r.item.kind,
      },
    })),
  };

  return NextResponse.json(body);
}
