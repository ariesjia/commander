import { MechaStage } from "@/types";

export const MECHA_STAGES: MechaStage[] = [
  { stage: 0, name: "未启动", threshold: 0, description: "散落零件 + 虚影轮廓" },
  { stage: 1, name: "底盘/脚部", threshold: 20, description: "脚部结构成型" },
  { stage: 2, name: "腿部", threshold: 50, description: "腿部完成，机甲站起来" },
  { stage: 3, name: "躯干", threshold: 100, description: "核心区域组装，能量核心亮起" },
  { stage: 4, name: "左臂", threshold: 150, description: "左臂安装" },
  { stage: 5, name: "右臂+武器", threshold: 200, description: "右臂安装，武器上线" },
  { stage: 6, name: "头部", threshold: 270, description: "头部安装，双眼亮起" },
  { stage: 7, name: "涂装完成", threshold: 350, description: "上色完成，完整体亮相" },
];

export const EVOLUTION_LEVELS = [
  { level: 1, name: "侦察型", threshold: 350, description: "组装完成" },
  { level: 2, name: "战斗型", threshold: 700, description: "体型增大，武器升级" },
  { level: 3, name: "重装型", threshold: 1500, description: "厚重装甲" },
  { level: 4, name: "飞行型", threshold: 3000, description: "飞行部件，可变形" },
  { level: 5, name: "终极型", threshold: 6000, description: "最终形态" },
];

/** 连续打卡展示档位（由少到多）。用「驾驶员」等级，小学生好懂，也和机甲设定一致。 */
export const STREAK_EFFECTS = [
  { days: 3, name: "新手驾驶员", description: "先养成每天做完任务的习惯" },
  { days: 7, name: "熟练驾驶员", description: "一周都在坚持，越做越顺" },
  { days: 30, name: "王牌驾驶员", description: "一个月都在坚持，特别厉害" },
];

export type StreakTier = (typeof STREAK_EFFECTS)[number];

/** 当前解锁档、下一档与进度条百分比（用于学生任务页连续打卡大卡）。 */
export function getStreakDisplay(streakDays: number): {
  currentTier: StreakTier | null;
  nextTier: StreakTier | null;
  progressToNext: number;
} {
  let currentTier: StreakTier | null = null;
  for (const e of STREAK_EFFECTS) {
    if (streakDays >= e.days) currentTier = e;
  }
  const currentIdx = currentTier ? STREAK_EFFECTS.indexOf(currentTier) : -1;
  const nextTier: StreakTier | null =
    currentIdx >= 0
      ? currentIdx < STREAK_EFFECTS.length - 1
        ? STREAK_EFFECTS[currentIdx + 1]
        : null
      : STREAK_EFFECTS[0] ?? null;
  const prevDays = currentTier?.days ?? 0;
  let progressToNext = 100;
  if (nextTier) {
    const span = nextTier.days - prevDays;
    progressToNext = span > 0 ? Math.min(100, Math.round(((streakDays - prevDays) / span) * 100)) : 100;
  }
  return { currentTier, nextTier, progressToNext };
}

export function getCurrentStage(totalPoints: number): number {
  let stage = 0;
  for (const s of MECHA_STAGES) {
    if (totalPoints >= s.threshold) stage = s.stage;
    else break;
  }
  return stage;
}

export function getEvolutionLevel(totalPoints: number): number {
  let level = 0;
  for (const e of EVOLUTION_LEVELS) {
    if (totalPoints >= e.threshold) level = e.level;
    else break;
  }
  return level;
}

export function getNextStageProgress(totalPoints: number): {
  current: MechaStage;
  next: MechaStage | null;
  progress: number;
} {
  const currentIdx = getCurrentStage(totalPoints);
  const current = MECHA_STAGES[currentIdx];
  const next = currentIdx < 7 ? MECHA_STAGES[currentIdx + 1] : null;

  if (!next) return { current, next: null, progress: 100 };

  const range = next.threshold - current.threshold;
  const earned = totalPoints - current.threshold;
  const progress = Math.min(100, Math.round((earned / range) * 100));

  return { current, next, progress };
}
