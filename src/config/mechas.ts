/** 机甲等级配置 */
export interface MechaLevelConfig {
  level: number;
  name: string;
  threshold: number;
  imageUrl: string;
  description: string;
}

/** 机甲配置 */
export interface MechaConfig {
  slug: string;
  name: string;
  description: string;
  intro: string;
  sortOrder: number;
  levels: MechaLevelConfig[];
}

/** 所有机甲配置（新增机甲只需在此添加） */
export const MECHA_CONFIGS: MechaConfig[] = [
  {
    slug: "xuanjia",
    name: "玄甲",
    description: "玄甲是一台陪伴你成长的机甲",
    intro: "玄甲，拥有极致战力与钢铁身躯。它能在历练中不断进化，解锁更强形态、重装装甲与核心力量，每一次蜕变都让战力飙升。",
    sortOrder: 0,
    levels: [
      { level: 0, name: "初识", threshold: 0, imageUrl: "/mecha/xuanjia/level-0.png", description: "灰蓝机甲沉稳伫立，蓝光初现，虚影轮廓若隐若现。" },
      { level: 1, name: "觉醒", threshold: 20, imageUrl: "/mecha/xuanjia/level-1.png", description: "重甲护体，胸核蓝光闪耀，立足之地已然稳固。" },
      { level: 2, name: "成型", threshold: 50, imageUrl: "/mecha/xuanjia/level-2.png", description: "重炮轰鸣，铁拳蓄势，稳健站姿尽显战力。" },
      { level: 3, name: "强化", threshold: 100, imageUrl: "/mecha/xuanjia/level-3.png", description: "盾炮兼备，攻守一体，核心力量涌动全身。" },
      { level: 4, name: "装甲进阶", threshold: 200, imageUrl: "/mecha/xuanjia/level-4.png", description: "双爪锋芒毕露，蓝光涌动，装甲双臂威势初成。" },
      { level: 5, name: "战力突破", threshold: 350, imageUrl: "/mecha/xuanjia/level-5.png", description: "双管炮齐鸣，重火力与近战兼备，战力全开。" },
      { level: 6, name: "玄甲开眼", threshold: 500, imageUrl: "/mecha/xuanjia/level-6.png", description: "巨炮威仪，翼甲展翅，双眼亮起，全面感知。" },
      { level: 7, name: "完整体", threshold: 800, imageUrl: "/mecha/xuanjia/level-7.png", description: "重装齐备，双肩巨炮与翼甲尽显，与你心意相通。" },
    ],
  },
  {
    slug: "star-shield",
    name: "星盾",
    description: "星盾，身披星光护盾",
    intro: "星盾，身披星光护盾。它在历练中不断觉醒，解锁更强形态、光之铠甲与星辰力量，每一次蜕变都让守护之力更强。",
    sortOrder: 1,
    levels: [
      { level: 0, name: "初识", threshold: 0, imageUrl: "/mecha/star-shield/level-0.png", description: "星光护盾若隐若现，守护之力开始凝聚。" },
      { level: 1, name: "觉醒", threshold: 20, imageUrl: "/mecha/star-shield/level-1.png", description: "星光护盾逐渐凝实，守护之姿初成。" },
      { level: 2, name: "成型", threshold: 50, imageUrl: "/mecha/star-shield/level-2.png", description: "护盾成型，星辰之力初显。" },
      { level: 3, name: "强化", threshold: 100, imageUrl: "/mecha/star-shield/level-3.png", description: "护盾愈发坚固，星辰光芒涌动。" },
      { level: 4, name: "光之铠甲", threshold: 200, imageUrl: "/mecha/star-shield/level-4.png", description: "光之铠甲显现，星辰之力环绕周身。" },
      { level: 5, name: "星辰之力", threshold: 350, imageUrl: "/mecha/star-shield/level-5.png", description: "星辰力量觉醒，守护之威尽显。" },
      { level: 6, name: "星辉护盾", threshold: 500, imageUrl: "/mecha/star-shield/level-6.png", description: "星辉护盾臻于完美，守护之力即将巅峰。" },
      { level: 7, name: "完整体", threshold: 800, imageUrl: "/mecha/star-shield/level-7.png", description: "守护之力达到巅峰，与你心意相通。" },
    ],
  },
  {
    slug: "razor",
    name: "利刃",
    description: "利刃，以极速与锐刃为锋",
    intro: "利刃，以极速与锐刃为锋。它在历练中不断觉醒，解锁更强形态、破甲武装与雷霆锋芒，每一次蜕变都让斩击之力更强。",
    sortOrder: 2,
    levels: [
      { level: 0, name: "初识", threshold: 0, imageUrl: "/mecha/razor/level-0.png", description: "锋芒若隐若现，极速之力开始凝聚。" },
      { level: 1, name: "觉醒", threshold: 20, imageUrl: "/mecha/razor/level-1.png", description: "锐刃锋芒逐渐凝实，斩击之姿初成。" },
      { level: 2, name: "成型", threshold: 50, imageUrl: "/mecha/razor/level-2.png", description: "利刃成型，斩击之力初显。" },
      { level: 3, name: "强化", threshold: 100, imageUrl: "/mecha/razor/level-3.png", description: "锋芒愈发锐利，极速涌动周身。" },
      { level: 4, name: "破甲武装", threshold: 200, imageUrl: "/mecha/razor/level-4.png", description: "破甲武装显现，极速之力环绕。" },
      { level: 5, name: "雷霆锋芒", threshold: 350, imageUrl: "/mecha/razor/level-5.png", description: "雷霆锋芒觉醒，斩击之威尽显。" },
      { level: 6, name: "锋芒毕露", threshold: 500, imageUrl: "/mecha/razor/level-6.png", description: "锋芒毕露，斩击之力臻于完美。" },
      { level: 7, name: "完整体", threshold: 800, imageUrl: "/mecha/razor/level-7.png", description: "斩击之力达到巅峰，与你心意相通。" },
    ],
  },
  {
    slug: "swift",
    name: "风驰",
    description: "风驰，以破空极速为能",
    intro: "风驰，以破空极速为能。它在历练中不断觉醒，解锁更强形态、风雷双翼与瞬影突袭，每一次蜕变都让迅捷之力更强。",
    sortOrder: 3,
    levels: [
      { level: 0, name: "初识", threshold: 0, imageUrl: "/mecha/swift/level-0.png", description: "破空极速若隐若现，迅捷之力开始凝聚。" },
      { level: 1, name: "觉醒", threshold: 20, imageUrl: "/mecha/swift/level-1.png", description: "极速之力逐渐凝实，疾风之姿初成。" },
      { level: 2, name: "成型", threshold: 50, imageUrl: "/mecha/swift/level-2.png", description: "风驰成型，迅捷之力初显。" },
      { level: 3, name: "强化", threshold: 100, imageUrl: "/mecha/swift/level-3.png", description: "速度愈发凌厉，破空之力涌动。" },
      { level: 4, name: "风雷双翼", threshold: 200, imageUrl: "/mecha/swift/level-4.png", description: "风雷双翼显现，破空之力环绕周身。" },
      { level: 5, name: "瞬影突袭", threshold: 350, imageUrl: "/mecha/swift/level-5.png", description: "瞬影突袭觉醒，迅捷之威尽显。" },
      { level: 6, name: "疾风巅峰", threshold: 500, imageUrl: "/mecha/swift/level-6.png", description: "疾风巅峰，迅捷之力臻于完美。" },
      { level: 7, name: "完整体", threshold: 800, imageUrl: "/mecha/swift/level-7.png", description: "迅捷之力达到巅峰，与你心意相通。" },
    ],
  },
  {
    slug: "thunder",
    name: "雷啸",
    description: "雷啸，携雷霆万钧之势",
    intro: "雷啸，携雷霆万钧之势。它在历练中不断觉醒，解锁更强形态、雷电武装与爆轰之力，每一次蜕变都让轰击之力更强。",
    sortOrder: 4,
    levels: [
      { level: 0, name: "初识", threshold: 0, imageUrl: "/mecha/thunder/level-0.png", description: "紫金持杖，雷电能量若隐若现，轰击之力开始凝聚。" },
      { level: 1, name: "觉醒", threshold: 20, imageUrl: "/mecha/thunder/level-1.png", description: "紫电环绕，金角闪耀，雷能初绽。" },
      { level: 2, name: "成型", threshold: 50, imageUrl: "/mecha/thunder/level-2.png", description: "双锤雷光闪耀，肩炮蓄势，轰击之姿初成。" },
      { level: 3, name: "强化", threshold: 100, imageUrl: "/mecha/thunder/level-3.png", description: "巨炮肩载，雷能涌动，雷霆之威尽显。" },
      { level: 4, name: "轰雷进阶", threshold: 200, imageUrl: "/mecha/thunder/level-4.png", description: "锤盾齐备，雷纹遍身，雷电武装初成。" },
      { level: 5, name: "万钧突破", threshold: 350, imageUrl: "/mecha/thunder/level-5.png", description: "雷盾护体，雷霆自肩爆发，爆轰之力全开。" },
      { level: 6, name: "雷啸启威", threshold: 500, imageUrl: "/mecha/thunder/level-6.png", description: "雷翼展翅，战斧轰鸣，轰击之力臻于完美。" },
      { level: 7, name: "完整体", threshold: 800, imageUrl: "/mecha/thunder/level-7.png", description: "锤盾齐鸣，雷霆万钧，与你心意相通。" },
    ],
  },
  {
    slug: "magnet",
    name: "磁暴",
    description: "磁暴，控磁场牵引之力",
    intro: "磁暴，控磁场牵引之力。它在历练中不断觉醒，解锁更强形态、磁暴装甲与引力核心，每一次蜕变都让磁力之力更强。",
    sortOrder: 5,
    levels: [
      { level: 0, name: "初识", threshold: 0, imageUrl: "/mecha/magnet/level-0.png", description: "橙金铁灰初现，磁力若隐若现，牵引之力开始凝聚。" },
      { level: 1, name: "觉醒", threshold: 20, imageUrl: "/mecha/magnet/level-1.png", description: "磁能逐渐觉醒，双极之力初绽。" },
      { level: 2, name: "成型", threshold: 50, imageUrl: "/mecha/magnet/level-2.png", description: "磁暴成型，牵引之姿初成。" },
      { level: 3, name: "强化", threshold: 100, imageUrl: "/mecha/magnet/level-3.png", description: "磁力愈发凝实，干扰与控场之力涌动。" },
      { level: 4, name: "磁能进阶", threshold: 200, imageUrl: "/mecha/magnet/level-4.png", description: "双极磁能臂甲显现，磁暴装甲初成。" },
      { level: 5, name: "引力突破", threshold: 350, imageUrl: "/mecha/magnet/level-5.png", description: "引力核心觉醒，范围控制之威尽显。" },
      { level: 6, name: "磁暴启核", threshold: 500, imageUrl: "/mecha/magnet/level-6.png", description: "磁暴启核，磁力之力臻于完美。" },
      { level: 7, name: "完整体", threshold: 800, imageUrl: "/mecha/magnet/level-7.png", description: "磁力之力达到巅峰，与你心意相通。" },
    ],
  },
];
