import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent, getStudentId } from "@/lib/api-auth";
import { PointsLogType, BattleOutcome, Prisma } from "@prisma/client";
import {
  pickRandomEnemy,
  rollBattleOutcome,
  pickNarrative,
  rollWinBattleRewards,
} from "@/lib/battle";
import { battleSettings, type BattleRewardGrant } from "@/lib/battle-settings";
import {
  chinaDateStrToDbDate,
  getBattleStatusForStudent,
  isPrismaUniqueViolation,
  resolveWinBattleRewardRoll,
} from "@/lib/battle-server";
import { getTodayStr } from "@/lib/utils";

export async function GET() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const status = await getBattleStatusForStudent(studentId);
  return NextResponse.json(status);
}

function publicEnemy(e: {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  skills: string[];
}) {
  return {
    id: e.id,
    slug: e.slug,
    name: e.name,
    description: e.description,
    imageUrl: e.imageUrl,
    skills: e.skills,
  };
}

export async function POST() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const todayStr = getTodayStr();
  const status = await getBattleStatusForStudent(studentId, todayStr);

  if (status.foughtToday) {
    return NextResponse.json(
      { error: "今日已进行过战斗", code: "ALREADY_FOUGHT_TODAY" },
      { status: 409 },
    );
  }
  if (!status.canFight && status.reasonCode === "THRESHOLD_NOT_MET") {
    return NextResponse.json(
      {
        error: status.message,
        code: "THRESHOLD_NOT_MET",
        taskPointsToday: status.taskPointsToday,
        minPointsRequired: status.minPointsRequired,
      },
      { status: 403 },
    );
  }

  const enemy = pickRandomEnemy();
  const outcome = rollBattleOutcome(battleSettings.winProbability);
  const narrative = pickNarrative(enemy, outcome);

  const winRewardRoll = outcome === "WIN" ? rollWinBattleRewards() : null;

  const foughtOn = chinaDateStrToDbDate(todayStr);
  const prismaOutcome = outcome === "WIN" ? BattleOutcome.WIN : BattleOutcome.LOSE;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const student = await tx.student.findUniqueOrThrow({
        where: { id: studentId },
        include: { primaryMecha: true },
      });
      const primarySm = student.primaryMecha;

      let rewards: BattleRewardGrant[] = [];
      if (winRewardRoll) {
        rewards = await resolveWinBattleRewardRoll(tx, studentId, winRewardRoll);
      }

      const pointsTotal = rewards
        .filter((r): r is Extract<BattleRewardGrant, { kind: "points" }> => r.kind === "points")
        .reduce((s, r) => s + r.amount, 0);

      let mechaId: string | null = null;
      if (primarySm) {
        const mechaRow = await tx.mecha.findUnique({
          where: { slug: primarySm.mechaSlug },
          select: { id: true },
        });
        mechaId = mechaRow?.id ?? null;
      }

      const battleLog = await tx.studentBattleLog.create({
        data: {
          studentId,
          mechaId,
          foughtOn,
          outcome: prismaOutcome,
          enemyId: enemy.id,
          narrative,
          rewardsJson: rewards as Prisma.InputJsonValue,
        },
      });

      let pointsLogId: string | null = null;

      if (outcome === "WIN" && pointsTotal > 0) {
        const description = `每日战斗胜利奖励（对手：${enemy.name}）`;
        const pointsLog = await tx.pointsLog.create({
          data: {
            studentId,
            amount: pointsTotal,
            type: PointsLogType.BATTLE_REWARD,
            description,
          },
        });
        pointsLogId = pointsLog.id;

        await tx.student.update({
          where: { id: studentId },
          data: {
            totalPoints: Math.max(0, student.totalPoints + pointsTotal),
            balance: Math.max(0, student.balance + pointsTotal),
          },
        });

        if (primarySm) {
          await tx.studentMecha.update({
            where: { id: primarySm.id },
            data: { points: Math.max(0, primarySm.points + pointsTotal) },
          });
        }

        await tx.studentBattleLog.update({
          where: { id: battleLog.id },
          data: { pointsLogId },
        });
      }

      return { battleLogId: battleLog.id, pointsLogId, pointsTotal, rewards };
    });

    return NextResponse.json({
      outcome,
      narrative,
      enemy: publicEnemy(enemy),
      rewards: result.rewards,
      pointsAwarded: result.pointsTotal,
    });
  } catch (e) {
    if (isPrismaUniqueViolation(e)) {
      return NextResponse.json(
        { error: "今日已进行过战斗", code: "ALREADY_FOUGHT_TODAY" },
        { status: 409 },
      );
    }
    console.error("Battle POST error:", e);
    return NextResponse.json({ error: "战斗处理失败" }, { status: 500 });
  }
}
