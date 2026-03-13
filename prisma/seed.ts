import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";
import { MECHA_SEED_DATA } from "./seed-data/mechas";

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("跳过 Admin 种子：未设置 ADMIN_EMAIL / ADMIN_PASSWORD");
    return;
  }
  const emailStr = email.trim().toLowerCase();
  const existing = await prisma.admin.findUnique({ where: { email: emailStr } });
  const hash = await hashPassword(password);
  if (existing) {
    await prisma.admin.update({
      where: { id: existing.id },
      data: { passwordHash: hash },
    });
    console.log("已更新 Admin 密码:", emailStr);
  } else {
    await prisma.admin.create({
      data: { email: emailStr, passwordHash: hash },
    });
    console.log("已创建 Admin:", emailStr);
  }
}

async function seedMecha(config: (typeof MECHA_SEED_DATA)[number]) {
  const existing = await prisma.mecha.findUnique({
    where: { slug: config.slug },
    include: { levels: { orderBy: { level: "asc" } } },
  });

  if (existing?.levels && existing.levels.length > 0) {
    const levelsNeedUpdate = config.levels.some(
      (c, i) =>
        existing.levels[i]?.name !== c.name ||
        existing.levels[i]?.description !== c.description ||
        existing.levels[i]?.threshold !== c.threshold ||
        existing.levels[i]?.imageUrl !== c.imageUrl,
    );
    const mechaNeedUpdate = existing.description !== config.description || existing.intro !== config.intro || existing.sortOrder !== config.sortOrder;
    if (levelsNeedUpdate) {
      for (const l of config.levels) {
        await prisma.mechaLevel.updateMany({
          where: { mechaId: existing.id, level: l.level },
          data: { name: l.name, description: l.description, threshold: l.threshold, imageUrl: l.imageUrl },
        });
      }
      console.log(`已同步更新${config.name}等级配置`);
    }
    if (mechaNeedUpdate) {
      await prisma.mecha.update({
        where: { id: existing.id },
        data: { description: config.description, intro: config.intro, sortOrder: config.sortOrder },
      });
      console.log(`已同步更新${config.name}介绍`);
    }
    if (!levelsNeedUpdate && !mechaNeedUpdate) {
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
  await seedAdmin();

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

  for (const config of MECHA_SEED_DATA) {
    await seedMecha(config);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
