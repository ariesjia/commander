/**
 * 修正 StudentMecha.points：根据 TaskLog 重新计算并更新
 * 用法：npx tsx prisma/fix-mecha-points.ts [--force]
 *
 * 逻辑：
 * - TaskLog 累加 > 当前积分：以 TaskLog 为准（可能之前少加了）
 * - TaskLog 累加 < 当前积分：不降级，保留当前积分（Task 被删除时 TaskLog 会 CASCADE 删除，导致记录缺失）
 * - --force：强制以 TaskLog 为准，即使会降级
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const force = process.argv.includes("--force");

async function main() {
  const studentMechas = await prisma.studentMecha.findMany({
    include: { student: { select: { id: true } } },
  });

  let fixed = 0;
  for (const sm of studentMechas) {
    const studentMechaCount = await prisma.studentMecha.count({
      where: { studentId: sm.studentId },
    });

    const taskLogs = await prisma.taskLog.findMany({
      where: {
        studentId: sm.studentId,
        OR: [
          { studentMechaId: sm.id },
          ...(studentMechaCount === 1 ? [{ studentMechaId: null }] : []),
        ],
      },
      orderBy: { completedAt: "asc" },
    });

    let cumulative = 0;
    for (const log of taskLogs) {
      cumulative += log.pointsAwarded;
      if (cumulative < 0) cumulative = 0;
    }

    if (cumulative !== sm.points) {
      const shouldUpdate = force || cumulative > sm.points;
      if (!shouldUpdate) {
        console.log(
          `跳过 ${sm.mechaSlug} (${sm.id}): 当前 ${sm.points}，TaskLog 累加 ${cumulative}（可能因任务删除导致 TaskLog 缺失，保留较高值）`
        );
        continue;
      }

      await prisma.studentMecha.update({
        where: { id: sm.id },
        data: { points: cumulative },
      });
      console.log(
        `修正 ${sm.mechaSlug} (${sm.id}): ${sm.points} → ${cumulative} (${taskLogs.length} 条 TaskLog)`
      );
      fixed++;
    }
  }

  console.log(`\n完成：共修正 ${fixed} 台机甲`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
