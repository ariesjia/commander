import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent, getStudentId } from "@/lib/api-auth";

export interface EvolutionMilestone {
  level: number;
  name: string;
  threshold: number;
  imageUrl: string;
  reachedAt: string | null; // ISO, null = 未达到
}

export interface MechaEvolutionDto {
  adoptedAt: string;
  mechaName: string;
  milestones: EvolutionMilestone[];
}

/** 获取机甲的进化历程：领养日期 + 各级别达成日期（使用 StudentMecha.id 查询） */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const { id: studentMechaId } = await params;

  const studentMecha = await prisma.studentMecha.findFirst({
    where: { id: studentMechaId, studentId },
  });

  if (!studentMecha) {
    return NextResponse.json({ error: "机甲不存在或未领养" }, { status: 404 });
  }

  const mecha = await prisma.mecha.findUnique({
    where: { slug: studentMecha.mechaSlug, isActive: true },
    include: { levels: { orderBy: { level: "asc" } } },
  });

  if (!mecha) {
    return NextResponse.json({ error: "机甲配置不存在" }, { status: 404 });
  }

  const levels = mecha.levels;
  const milestones: EvolutionMilestone[] = levels.map((l) => ({
    level: l.level,
    name: l.name,
    threshold: l.threshold,
    imageUrl: l.imageUrl,
    reachedAt: null,
  }));

  // 领养时即为 L0
  if (levels[0]) {
    milestones[0]!.reachedAt = studentMecha.adoptedAt.toISOString();
  }

  // 从 TaskLog 推算各级别达成时间
  const taskLogs = await prisma.taskLog.findMany({
    where: { studentMechaId: studentMecha.id },
    orderBy: { completedAt: "asc" },
  });

  let cumulative = 0;
  for (const log of taskLogs) {
    cumulative += log.pointsAwarded;
    if (cumulative < 0) cumulative = 0;

    for (let i = 1; i < levels.length; i++) {
      const th = levels[i]!.threshold;
      if (cumulative >= th && !milestones[i]!.reachedAt) {
        milestones[i]!.reachedAt = log.completedAt.toISOString();
      }
    }
  }

  const dto: MechaEvolutionDto = {
    adoptedAt: studentMecha.adoptedAt.toISOString(),
    mechaName: mecha.name,
    milestones,
  };

  return NextResponse.json(dto);
}
