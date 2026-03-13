import { PrismaClient } from "@prisma/client";
import { MECHA_CONFIGS } from "../src/config/mechas";

const prisma = new PrismaClient();

async function seedMecha(config: (typeof MECHA_CONFIGS)[number]) {
  const existing = await prisma.mecha.findUnique({
    where: { slug: config.slug },
    include: { levels: { orderBy: { level: "asc" } } },
  });

  if (existing?.levels && existing.levels.length > 0) {
    const needsUpdate = config.levels.some(
      (c, i) =>
        existing.levels[i]?.name !== c.name ||
        existing.levels[i]?.description !== c.description ||
        existing.levels[i]?.threshold !== c.threshold ||
        existing.levels[i]?.imageUrl !== c.imageUrl,
    );
    if (needsUpdate) {
      for (const l of config.levels) {
        await prisma.mechaLevel.updateMany({
          where: { mechaId: existing.id, level: l.level },
          data: { name: l.name, description: l.description, threshold: l.threshold, imageUrl: l.imageUrl },
        });
      }
      console.log(`已同步更新${config.name}配置`);
    } else {
      console.log(`${config.name}已存在且配置完整，跳过`);
    }
    return;
  }

  if (existing) {
    await prisma.mechaLevel.deleteMany({ where: { mechaId: existing.id } });
    await prisma.mecha.delete({ where: { id: existing.id } });
    console.log(`已删除旧${config.name}配置，准备重建`);
  }

  const mecha = await prisma.mecha.create({
    data: {
      slug: config.slug,
      name: config.name,
      description: config.description,
      intro: config.intro,
      isActive: true,
      sortOrder: config.sortOrder,
      levels: {
        create: config.levels.map((l) => ({
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
  // 回填 primaryMechaId：从 studentMechas 取第一个
  const studentsToBackfill = await prisma.student.findMany({
    where: { primaryMechaId: null, studentMechas: { some: {} } },
    include: { studentMechas: { orderBy: { adoptedAt: "asc" } } },
  });
  for (const s of studentsToBackfill) {
    const first = s.studentMechas[0];
    if (first) {
      await prisma.student.update({
        where: { id: s.id },
        data: { primaryMechaId: first.id },
      });
      console.log(`已回填 primaryMechaId: ${s.id} -> ${first.mechaSlug}`);
    }
  }

  for (const config of MECHA_CONFIGS) {
    await seedMecha(config);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
