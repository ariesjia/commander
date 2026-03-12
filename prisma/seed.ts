import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const XUANJIA_LEVELS = [
  { level: 0, name: "初识", threshold: 0, imageUrl: "/mecha/xuanjia/level-0.png", description: "玄甲初现，散落的零件开始感应到你的意志，虚影轮廓若隐若现。" },
  { level: 1, name: "觉醒", threshold: 20, imageUrl: "/mecha/xuanjia/level-1.png", description: "能量核心被激活，底盘与脚部结构成型，机甲有了立足之地。" },
  { level: 2, name: "成型", threshold: 50, imageUrl: "/mecha/xuanjia/level-2.png", description: "腿部组装完成，玄甲终于站了起来，迈出第一步。" },
  { level: 3, name: "强化", threshold: 100, imageUrl: "/mecha/xuanjia/level-3.png", description: "躯干核心区域组装完毕，能量核心亮起，玄甲获得真正的力量。" },
  { level: 4, name: "进阶", threshold: 200, imageUrl: "/mecha/xuanjia/level-4.png", description: "左臂安装完成，玄甲可以执行更复杂的动作。" },
  { level: 5, name: "突破", threshold: 350, imageUrl: "/mecha/xuanjia/level-5.png", description: "右臂与武器系统上线，玄甲具备战斗能力。" },
  { level: 6, name: "升华", threshold: 500, imageUrl: "/mecha/xuanjia/level-6.png", description: "头部安装完成，双眼亮起，玄甲拥有了完整的感知。" },
  { level: 7, name: "完整体", threshold: 800, imageUrl: "/mecha/xuanjia/level-7.png", description: "涂装完成，玄甲以完整体亮相，与你心意相通。" },
];

const STAR_SHIELD_LEVELS = [
  { level: 0, name: "初识", threshold: 0, imageUrl: "/mecha/star-shield/level-0.png", description: "星盾初现，星光护盾若隐若现，守护之力开始凝聚。" },
  { level: 1, name: "觉醒", threshold: 20, imageUrl: "/mecha/star-shield/level-1.png", description: "在历练中觉醒，星光护盾逐渐凝实。" },
  { level: 2, name: "成型", threshold: 50, imageUrl: "/mecha/star-shield/level-2.png", description: "星光护盾成型，守护之力初显。" },
  { level: 3, name: "强化", threshold: 100, imageUrl: "/mecha/star-shield/level-3.png", description: "解锁更强形态，护盾愈发坚固。" },
  { level: 4, name: "光之铠甲", threshold: 200, imageUrl: "/mecha/star-shield/level-4.png", description: "光之铠甲显现，星辰之力涌动。" },
  { level: 5, name: "星辰之力", threshold: 350, imageUrl: "/mecha/star-shield/level-5.png", description: "星辰力量觉醒，守护之力大幅提升。" },
  { level: 6, name: "升华", threshold: 500, imageUrl: "/mecha/star-shield/level-6.png", description: "经历蜕变升华，星光护盾臻于完美。" },
  { level: 7, name: "完整体", threshold: 800, imageUrl: "/mecha/star-shield/level-7.png", description: "完整体亮相，守护之力达到巅峰，与你心意相通。" },
];

async function seedMecha(
  slug: string,
  name: string,
  description: string,
  intro: string,
  sortOrder: number,
  levels: typeof XUANJIA_LEVELS,
) {
  const existing = await prisma.mecha.findUnique({
    where: { slug },
    include: { levels: true },
  });

  if (existing?.levels && existing.levels.length > 0) {
    console.log(`${name}已存在且配置完整，跳过`);
    return;
  }

  if (existing) {
    await prisma.mechaLevel.deleteMany({ where: { mechaId: existing.id } });
    await prisma.mecha.delete({ where: { id: existing.id } });
    console.log(`已删除旧${name}配置，准备重建`);
  }

  const mecha = await prisma.mecha.create({
    data: {
      slug,
      name,
      description,
      intro,
      isActive: true,
      sortOrder,
      levels: {
        create: levels.map((l) => ({
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

async function main() {
  await seedMecha(
    "xuanjia",
    "玄甲",
    "玄甲是一台陪伴你成长的机甲",
    "玄甲，拥有极致战力与钢铁身躯。它能在历练中不断进化，解锁更强形态、重装装甲与核心力量，每一次蜕变都让战力飙升。",
    0,
    XUANJIA_LEVELS,
  );

  await seedMecha(
    "star-shield",
    "星盾",
    "星盾，身披星光护盾",
    "星盾，身披星光护盾。它在历练中不断觉醒，解锁更强形态、光之铠甲与星辰力量，每一次蜕变都让守护之力更强。",
    1,
    STAR_SHIELD_LEVELS,
  );

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
