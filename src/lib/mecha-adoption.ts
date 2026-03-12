/**
 * 机甲领养配置
 * 玄甲：8 个升级级别，根据积分解锁
 * 第二只机甲：玄甲满级后可领取
 */

export const MECHA_XUANJIA = "xuanjia";
export const MECHA_SECOND = "mecha2"; // 第二只机甲，待配置

/** 机甲领取顺序：第一只固定玄甲，第二只需玄甲满级 */
export const ADOPTION_ORDER = [MECHA_XUANJIA, MECHA_SECOND] as const;

export function canAdoptSecond(adoptedMechaIds: string[], xuanjiaLevel: number): boolean {
  return (
    adoptedMechaIds.includes(MECHA_XUANJIA) &&
    !adoptedMechaIds.includes(MECHA_SECOND) &&
    xuanjiaLevel >= 7
  );
}

/** 第二只机甲展示信息（待配置图片） */
export const MECHA_SECOND_INFO = {
  name: "机甲二号",
  imageUrl: "/mecha/mecha2/level-0.png",
  description: "玄甲满级后解锁的第二台机甲，更多惊喜等你发现。",
};

export interface MechaLevel {
  level: number;
  name: string;
  threshold: number;
  /** 该级别对应的图片路径 */
  imageUrl: string;
  /** 级别描述 */
  description: string;
}

export const XUANJIA_LEVELS: MechaLevel[] = [
  { level: 0, name: "初识", threshold: 0, imageUrl: "/mecha/xuanjia/level-0.png", description: "玄甲初现，散落的零件开始感应到你的意志，虚影轮廓若隐若现。" },
  { level: 1, name: "觉醒", threshold: 20, imageUrl: "/mecha/xuanjia/level-1.png", description: "能量核心被激活，底盘与脚部结构成型，机甲有了立足之地。" },
  { level: 2, name: "成型", threshold: 50, imageUrl: "/mecha/xuanjia/level-2.png", description: "腿部组装完成，玄甲终于站了起来，迈出第一步。" },
  { level: 3, name: "强化", threshold: 100, imageUrl: "/mecha/xuanjia/level-3.png", description: "躯干核心区域组装完毕，能量核心亮起，玄甲获得真正的力量。" },
  { level: 4, name: "进阶", threshold: 150, imageUrl: "/mecha/xuanjia/level-4.png", description: "左臂安装完成，玄甲可以执行更复杂的动作。" },
  { level: 5, name: "突破", threshold: 200, imageUrl: "/mecha/xuanjia/level-5.png", description: "右臂与武器系统上线，玄甲具备战斗能力。" },
  { level: 6, name: "升华", threshold: 270, imageUrl: "/mecha/xuanjia/level-6.png", description: "头部安装完成，双眼亮起，玄甲拥有了完整的感知。" },
  { level: 7, name: "完整体", threshold: 350, imageUrl: "/mecha/xuanjia/level-7.png", description: "涂装完成，玄甲以完整体亮相，与你心意相通。" },
];

/** 玄甲整体介绍 */
export const XUANJIA_INTRO = "玄甲是一台陪伴你成长的机甲，通过完成任务积累积分，它会从散落零件一步步进化成完整体。每一点努力都会让玄甲变得更强大。";

export function getXuanjiaLevel(totalPoints: number): number {
  let level = 0;
  for (const l of XUANJIA_LEVELS) {
    if (totalPoints >= l.threshold) level = l.level;
    else break;
  }
  return level;
}

export function getXuanjiaLevelInfo(totalPoints: number): MechaLevel {
  const level = getXuanjiaLevel(totalPoints);
  return XUANJIA_LEVELS[level] ?? XUANJIA_LEVELS[0];
}

export function getNextXuanjiaProgress(totalPoints: number): {
  current: MechaLevel;
  next: MechaLevel | null;
  progress: number;
} {
  const currentIdx = getXuanjiaLevel(totalPoints);
  const current = XUANJIA_LEVELS[currentIdx];
  const next = currentIdx < 7 ? XUANJIA_LEVELS[currentIdx + 1] : null;

  if (!next) return { current, next: null, progress: 100 };

  const range = next.threshold - current.threshold;
  const earned = totalPoints - current.threshold;
  const progress = Math.min(100, Math.round((earned / range) * 100));

  return { current, next, progress };
}
