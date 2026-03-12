import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireParent, getStudentId } from "@/lib/api-auth";
import { getTodayStr, getWeekStartStr } from "@/lib/utils";
import { TaskType } from "@prisma/client";

const TASK_TYPE_MAP: Record<string, TaskType> = {
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  RULE: "RULE",
};

export async function GET(request: Request) {
  const auth = await requireParent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const tasks = await prisma.task.findMany({
    where: { parentId: auth.parentId },
    orderBy: { createdAt: "desc" },
  });

  const taskLogs = await prisma.taskLog.findMany({
    where: { studentId },
  });

  const todayStr = getTodayStr();
  const weekStr = getWeekStartStr();

  const tasksWithStatus = tasks.map((t) => {
    // RULE can be confirmed multiple times per day - always show pending for next confirmation
    const log =
      t.type === "RULE"
        ? null
        : taskLogs.find(
            (l) =>
              l.taskId === t.id &&
              (t.type === "WEEKLY"
                ? l.completedAt >= new Date(weekStr)
                : l.completedAt.toISOString().startsWith(todayStr))
          );
    return {
      id: t.id,
      name: t.name,
      description: t.description,
      type: t.type,
      maxPoints: t.maxPoints,
      penaltyPoints: t.penaltyPoints ?? 0,
      isActive: t.isActive,
      createdAt: t.createdAt.toISOString(),
      status: log ? "completed" : "pending",
      completedAt: log?.completedAt.toISOString(),
    };
  });

  return NextResponse.json(tasksWithStatus);
}

export async function POST(request: Request) {
  const auth = await requireParent();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { name, description, type, maxPoints, penaltyPoints, isActive } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "请填写任务名称和类型" },
        { status: 400 }
      );
    }

    const taskType = TASK_TYPE_MAP[type] ?? "DAILY";
    const pts = Math.max(0, parseInt(String(maxPoints ?? 0), 10) || 0);
    const penalty = Math.max(0, parseInt(String(penaltyPoints ?? 0), 10) || 0);

    if (taskType === "RULE" && penalty > 0) {
      // 惩罚规则：maxPoints 可为 0
    } else if (pts <= 0) {
      return NextResponse.json(
        { error: "最大得分需大于 0" },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        parentId: auth.parentId,
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        type: taskType,
        maxPoints: pts,
        penaltyPoints: penalty,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({
      id: task.id,
      name: task.name,
      description: task.description,
      type: task.type,
      maxPoints: task.maxPoints,
      penaltyPoints: task.penaltyPoints,
      isActive: task.isActive,
      createdAt: task.createdAt.toISOString(),
    });
  } catch (e) {
    console.error("Create task error:", e);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
