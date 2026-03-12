import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const XUANJIA_LEVELS = [
  { level: 0, name: "初识", threshold: 0, imageUrl: "/mecha/xuanjia/level-0.png", description: "玄甲初现，散落的零件开始感应到你的意志，虚影轮廓若隐若现。" },
  { level: 1, name: "觉醒", threshold: 20, imageUrl: "/mecha/xuanjia/level-1.png", description: "能量核心被激活，底盘与脚部结构成型，机甲有了立足之地。" },
  { level: 2, name: "成型", threshold: 50, imageUrl: "/mecha/xuanjia/level-2.png", description: "腿部组装完成，玄甲终于站了起来，迈出第一步。" },
  { level: 3, name: "强化", threshold: 100, imageUrl: "/mecha/xuanjia/level-3.png", description: "躯干核心区域组装完毕，能量核心亮起，玄甲获得真正的力量。" },
  { level: 4, name: "进阶", threshold: 150, imageUrl: "/mecha/xuanjia/level-4.png", description: "左臂安装完成，玄甲可以执行更复杂的动作。" },
  { level: 5, name: "突破", threshold: 200, imageUrl: "/mecha/xuanjia/level-5.png", description: "右臂与武器系统上线，玄甲具备战斗能力。" },
  { level: 6, name: "升华", threshold: 270, imageUrl: "/mecha/xuanjia/level-6.png", description: "头部安装完成，双眼亮起，玄甲拥有了完整的感知。" },
  { level: 7, name: "完整体", threshold: 350, imageUrl: "/mecha/xuanjia/level-7.png", description: "涂装完成，玄甲以完整体亮相，与你心意相通。" },
];

async function main() {
  const existing = await prisma.mecha.findUnique({
    where: { slug: "xuanjia" },
    include: { levels: true },
  });

  if (existing?.levels && existing.levels.length > 0) {
    console.log("玄甲已存在且配置完整，跳过机甲 seed");
  } else {

  if (existing) {
    await prisma.mechaLevel.deleteMany({ where: { mechaId: existing.id } });
    await prisma.mecha.delete({ where: { id: existing.id } });
    console.log("已删除旧玄甲配置，准备重建");
  }

  const mecha = await prisma.mecha.create({
    data: {
      slug: "xuanjia",
      name: "玄甲",
      description: "玄甲是一台陪伴你成长的机甲",
      intro: "玄甲是一台陪伴你成长的机甲，通过完成任务积累积分，它会从散落零件一步步进化成完整体。每一点努力都会让玄甲变得更强大。",
      isActive: true,
      sortOrder: 0,
      levels: {
        create: XUANJIA_LEVELS.map((l) => ({
          level: l.level,
          name: l.name,
          threshold: l.threshold,
          imageUrl: l.imageUrl,
          description: l.description,
        })),
      },
    },
  });

    console.log("已创建机甲:", mecha.name);
  }

  // 回填：已有 adoptedMechaIds 但无 StudentMecha 的学生，用 totalPoints 初始化
  const studentsToBackfill = await prisma.student.findMany({
    where: { adoptedMechaIds: { isEmpty: false } },
    include: { studentMechas: true },
  });
  for (const s of studentsToBackfill) {
    const ids = s.adoptedMechaIds ?? [];
    for (const slug of ids) {
      const has = s.studentMechas.some((sm) => sm.mechaSlug === slug);
      if (!has) {
        await prisma.studentMecha.create({
          data: {
            studentId: s.id,
            mechaSlug: slug,
            points: s.totalPoints,
          },
        });
        console.log(`已回填学生 ${s.id} 的机甲 ${slug}，积分 ${s.totalPoints}`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
