import { prisma } from "@/lib/db";
import { pointsToNumber } from "@/lib/points-number";
import { getCurrentMechaLevelFromPoints } from "@/lib/mecha-level";

export type MechaSkillContextRow = {
  unlockLevel: number;
  kind: string;
  name: string;
  description: string;
  unlocked: boolean;
};

/** 供 system prompt 与界面使用的机甲对话上下文 */
export type MechaChatContext = {
  studentNickname: string;
  streakDays: number;
  mechaSlug: string;
  mechaName: string;
  mechaDescription: string | null;
  mechaIntro: string | null;
  points: number;
  currentLevel: number;
  currentLevelName: string;
  currentLevelImageUrl: string;
  skills: MechaSkillContextRow[];
};

/**
 * 加载当前主机甲事实；无主机甲或未领养时返回 null。
 */
export async function loadMechaChatContext(
  studentId: string,
): Promise<MechaChatContext | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      primaryMecha: true,
    },
  });

  if (!student?.primaryMechaId || !student.primaryMecha) {
    return null;
  }

  const sm = student.primaryMecha;
  const mechaSlug = sm.mechaSlug;
  const points = pointsToNumber(sm.points);

  const mecha = await prisma.mecha.findUnique({
    where: { slug: mechaSlug, isActive: true },
    include: {
      levels: { orderBy: { level: "asc" } },
      skills: { orderBy: { unlockLevel: "asc" } },
    },
  });

  if (!mecha) {
    return null;
  }

  const levelRow = getCurrentMechaLevelFromPoints(mecha.levels, points);
  if (!levelRow) {
    return null;
  }

  const currentLevelNum = levelRow.level;

  const skills: MechaSkillContextRow[] = mecha.skills.map((s) => ({
    unlockLevel: s.unlockLevel,
    kind: s.kind,
    name: s.name,
    description: s.description,
    unlocked: currentLevelNum >= s.unlockLevel,
  }));

  return {
    studentNickname: student.nickname,
    streakDays: student.streakDays,
    mechaSlug,
    mechaName: mecha.name,
    mechaDescription: mecha.description,
    mechaIntro: mecha.intro,
    points,
    currentLevel: currentLevelNum,
    currentLevelName: levelRow.name,
    currentLevelImageUrl: levelRow.imageUrl,
    skills,
  };
}
