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
  // studentMechaId 可能为空（历史数据或领养前确认的任务），若学生仅有一台机甲则视为归属该机甲
  const studentMechaCount = await prisma.studentMecha.count({ where: { studentId } });
  const taskLogs = await prisma.taskLog.findMany({
    where: {
      studentId,
      OR: [
        { studentMechaId: studentMecha.id },
        ...(studentMechaCount === 1 ? [{ studentMechaId: null }] : []),
      ],
    },
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

  // 兜底：StudentMecha.points 为权威来源，TaskLog 推算可能因时序等原因未命中
  const mechaPoints = studentMecha.points;
  const lastLogAt = taskLogs.length > 0 ? taskLogs[taskLogs.length - 1]!.completedAt : null;
  const fallbackDate = lastLogAt ?? studentMecha.adoptedAt;
  for (let i = 1; i < levels.length; i++) {
    const th = levels[i]!.threshold;
    if (mechaPoints >= th && !milestones[i]!.reachedAt) {
      milestones[i]!.reachedAt = fallbackDate.toISOString();
    }
  }

  const dto: MechaEvolutionDto = {
    adoptedAt: studentMecha.adoptedAt.toISOString(),
    mechaName: mecha.name,
    milestones,
  };

  // ?debug=1 时返回调试信息（开发排查用）
  const url = new URL(_req.url);
  if (url.searchParams.get("debug") === "1") {
    return NextResponse.json({
      ...dto,
      _debug: {
        studentMechaId: studentMecha.id,
        mechaPoints: studentMecha.points,
        taskLogCount: taskLogs.length,
        cumulativeFromLogs: cumulative,
        taskLogIds: taskLogs.map((l) => ({ id: l.id, pointsAwarded: l.pointsAwarded, completedAt: l.completedAt.toISOString() })),
      },
    });
  }

  return NextResponse.json(dto);
}
