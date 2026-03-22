import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";
import { pointsToNumber } from "../src/lib/points-number";
import { MECHA_SEED_DATA } from "./seed-data/mechas";
import { ITEM_SEED_DATA } from "./seed-data/items";

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

function skillSeedMatchesRow(
  seed: (typeof MECHA_SEED_DATA)[number]["skills"][number],
  row: { unlockLevel: number; kind: string; slug: string; name: string; description: string },
) {
  return (
    row.kind === seed.kind &&
    row.slug === seed.slug &&
    row.name === seed.name &&
    row.description === seed.description
  );
}

async function syncMechaSkills(
  mechaId: string,
  skills: (typeof MECHA_SEED_DATA)[number]["skills"],
) {
  const existing = await prisma.mechaSkill.findMany({ where: { mechaId } });
  const byLevel = new Map(existing.map((s) => [s.unlockLevel, s]));

  for (const seed of skills) {
    const row = byLevel.get(seed.unlockLevel);
    if (!row) {
      await prisma.mechaSkill.create({
        data: {
          mechaId,
          unlockLevel: seed.unlockLevel,
          kind: seed.kind,
          slug: seed.slug,
          name: seed.name,
          description: seed.description,
        },
      });
      continue;
    }
    if (!skillSeedMatchesRow(seed, row)) {
      await prisma.mechaSkill.update({
        where: { id: row.id },
        data: {
          kind: seed.kind,
          slug: seed.slug,
          name: seed.name,
          description: seed.description,
        },
      });
    }
  }

  const allowed = new Set<number>(skills.map((s) => s.unlockLevel));
  for (const row of existing) {
    if (!allowed.has(row.unlockLevel)) {
      await prisma.mechaSkill.delete({ where: { id: row.id } });
    }
  }
}

async function seedMecha(config: (typeof MECHA_SEED_DATA)[number]) {
  const existing = await prisma.mecha.findUnique({
    where: { slug: config.slug },
    include: {
      levels: { orderBy: { level: "asc" } },
      skills: { orderBy: { unlockLevel: "asc" } },
    },
  });

  if (existing?.levels && existing.levels.length > 0) {
    const levelsNeedUpdate = config.levels.some((c, i) => {
      const row = existing.levels[i];
      const th = row ? pointsToNumber(row.threshold) : null;
      return (
        row?.name !== c.name ||
        row?.description !== c.description ||
        th !== c.threshold ||
        row?.imageUrl !== c.imageUrl
      );
    });
    const mechaNeedUpdate =
      existing.description !== config.description ||
      existing.intro !== config.intro ||
      existing.sortOrder !== config.sortOrder;

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

    const skillsNeedSync =
      existing.skills.length !== config.skills.length ||
      config.skills.some((seed) => {
        const row = existing.skills.find((s) => s.unlockLevel === seed.unlockLevel);
        return !row || !skillSeedMatchesRow(seed, row);
      });
    if (skillsNeedSync) {
      await syncMechaSkills(existing.id, config.skills);
      console.log(`已同步更新${config.name}技能配置`);
    }

    if (!levelsNeedUpdate && !mechaNeedUpdate && !skillsNeedSync) {
      console.log(`${config.name}已存在且配置完整，跳过`);
    }
    return;
  }

  if (existing) {
    await prisma.mechaLevel.deleteMany({ where: { mechaId: existing.id } });
    await prisma.mechaSkill.deleteMany({ where: { mechaId: existing.id } });
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
      skills: {
        create: config.skills.map((s) => ({
          unlockLevel: s.unlockLevel,
          kind: s.kind,
          slug: s.slug,
          name: s.name,
          description: s.description,
        })),
      },
    },
  });

  console.log("已创建机甲:", mecha.name);
}

async function seedCatalogItems() {
  for (const row of ITEM_SEED_DATA) {
    await prisma.item.upsert({
      where: { slug: row.slug },
      create: {
        slug: row.slug,
        name: row.name,
        description: row.description,
        imageUrl: row.imageUrl,
        kind: row.kind,
        sortOrder: row.sortOrder,
        isActive: true,
      },
      update: {
        name: row.name,
        description: row.description,
        imageUrl: row.imageUrl,
        kind: row.kind,
        sortOrder: row.sortOrder,
      },
    });
  }
  console.log(`已同步道具图鉴 ${ITEM_SEED_DATA.length} 条`);
}

/** 仅当 SEED_STUDENT_ITEMS=1（或 true）时为首个学生写入前 5 条道具各 1～2 件；默认不写 */
async function seedDemoStudentItems() {
  const raw = process.env.SEED_STUDENT_ITEMS;
  const enabled = raw === "1" || raw === "true";
  if (!enabled) {
    console.log("跳过 StudentItem 演示种子：未设置 SEED_STUDENT_ITEMS=1");
    return;
  }
  const firstStudent = await prisma.student.findFirst({ orderBy: { createdAt: "asc" } });
  if (!firstStudent) {
    console.log("跳过 StudentItem 演示种子：无学生");
    return;
  }
  const items = await prisma.item.findMany({
    orderBy: { sortOrder: "asc" },
    take: 5,
  });
  const quantities = [1, 2, 1, 2, 1];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const quantity = quantities[i] ?? 1;
    await prisma.studentItem.upsert({
      where: { studentId_itemId: { studentId: firstStudent.id, itemId: item.id } },
      create: { studentId: firstStudent.id, itemId: item.id, quantity },
      update: { quantity },
    });
  }
  console.log(`已为首个学生写入 ${items.length} 条演示道具库存`);
}

async function main() {
  await seedAdmin();
  await seedCatalogItems();
  await seedDemoStudentItems();

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
