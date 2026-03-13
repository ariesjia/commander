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

/** 机甲种子数据（新增机甲只需在此添加，然后执行 pnpm db:seed） */
export const MECHA_SEED_DATA: MechaConfig[] = [
  {
    slug: "xuanjia",
    name: "玄甲",
    description: "正面强攻型人形机甲，擅长突破防线与近距离压制",
    intro: "玄甲，正面强攻型人形机甲，擅长突破防线与近距离压制，凭借压倒性力量撕开对手阵型。负责先锋冲锋、阵地突破、近距离歼灭。它在历练中不断进化，解锁更强形态、重装装甲与核心力量，每一次蜕变都让战力飙升。",
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
    description: "全能防御型人形机甲，擅长构筑绝对屏障与群体庇护",
    intro: "星盾，全能防御型人形机甲，擅长构筑绝对屏障与群体庇护，能稳定承受高强度攻击，为团队创造安全输出环境。负责承伤掩护、区域防御、危机救援。它在历练中不断觉醒，解锁更强形态、光之铠甲与星辰力量，每一次蜕变都让守护之力更强。",
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
    description: "极速突袭型人形机甲，擅长瞬间切入与精准打击",
    intro: "利刃，极速突袭型人形机甲，擅长瞬间切入与精准打击，以超高效率瓦解敌方关键目标。负责快速突袭、弱点击破、敌后干扰。它在历练中不断觉醒，解锁更强形态、破甲武装与雷霆锋芒，每一次蜕变都让斩击之力更强。",
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
    description: "机动侦查型人形机甲，擅长高速移动与战场侦察",
    intro: "风驰，机动侦查型人形机甲，擅长高速移动与战场侦察，灵活穿梭复杂地形获取情报。负责前沿探查、迂回牵制、快速支援。它在历练中不断觉醒，解锁更强形态、风雷双翼与瞬影突袭，每一次蜕变都让迅捷之力更强。",
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
    description: "范围爆发型人形机甲，擅长大范围雷电攻击与群体控制",
    intro: "雷啸，范围爆发型人形机甲，擅长大范围雷电攻击与群体控制，以强力输出覆盖整片战场。负责群体伤害、场面压制、区域控场。它在历练中不断觉醒，解锁更强形态、雷电武装与爆轰之力，每一次蜕变都让轰击之力更强。",
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
    description: "磁场控制型人形机甲，擅长引力牵引与能量干扰",
    intro: "磁暴，磁场控制型人形机甲，擅长引力牵引与能量干扰，可改变战场态势限制敌人行动。负责装备干扰、引力束缚、阵型打乱。它在历练中不断觉醒，解锁更强形态、磁暴装甲与引力核心，每一次蜕变都让磁力之力更强。",
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
  {
    slug: "aether",
    name: "空境",
    description: "空中全域载具机甲，擅长高空穿梭与快速部署",
    intro: "空境，空中全域载具机甲，擅长高空穿梭与快速部署，可跨越地形实现全员机动转移。负责空中运输、全域支援、高空侦查。它在历练中不断觉醒，解锁更强形态、天境引擎与跃迁之力，每一次蜕变都让穿梭之力更强。",
    sortOrder: 6,
    levels: [
      { level: 0, name: "初识", threshold: 0, imageUrl: "/mecha/aether/level-0.png", description: "雾白浅紫初现，浮空之能若隐若现，穿梭之力开始凝聚。" },
      { level: 1, name: "觉醒", threshold: 20, imageUrl: "/mecha/aether/level-1.png", description: "天境跃迁引擎初绽，浮空之姿初成。" },
      { level: 2, name: "成型", threshold: 50, imageUrl: "/mecha/aether/level-2.png", description: "空境成型，全域载具之能初显。" },
      { level: 3, name: "强化", threshold: 100, imageUrl: "/mecha/aether/level-3.png", description: "跃迁之力愈发凝实，空中堡垒之姿渐显。" },
      { level: 4, name: "天境进阶", threshold: 200, imageUrl: "/mecha/aether/level-4.png", description: "天境引擎进阶，多形态切换初成。" },
      { level: 5, name: "跃迁突破", threshold: 350, imageUrl: "/mecha/aether/level-5.png", description: "跃迁核心觉醒，团队运输之威尽显。" },
      { level: 6, name: "破穹降临", threshold: 500, imageUrl: "/mecha/aether/level-6.png", description: "破穹降临，穿梭之力臻于完美。" },
      { level: 7, name: "完整体", threshold: 800, imageUrl: "/mecha/aether/level-7.png", description: "穿梭之力达到巅峰，与你心意相通。" },
    ],
  },
  {
    slug: "tidal",
    name: "沧龙",
    description: "深海两栖载具机甲，擅长隐秘潜行与远距离火力压制",
    intro: "沧龙，深海两栖载具机甲，擅长隐秘潜行与远距离火力压制，能在各种地形稳定作战，默默为团队扫清前路。负责深海突袭、团队运载、远程重炮、封锁水域。它在历练中不断觉醒，解锁更强形态、沧龙幽洋舰甲与潜航之力，每一次蜕变都让深海之力更强。",
    sortOrder: 7,
    levels: [
      { level: 0, name: "初识", threshold: 0, imageUrl: "/mecha/tidal/level-0.png", description: "深海蓝钛灰初现，两栖之能若隐若现，潜航之力开始凝聚。" },
      { level: 1, name: "觉醒", threshold: 20, imageUrl: "/mecha/tidal/level-1.png", description: "沧龙幽洋舰甲初绽，潜行之姿初成。" },
      { level: 2, name: "成型", threshold: 50, imageUrl: "/mecha/tidal/level-2.png", description: "沧龙成型，两栖载具之能初显。" },
      { level: 3, name: "强化", threshold: 100, imageUrl: "/mecha/tidal/level-3.png", description: "潜航之力愈发凝实，重型炮击之姿渐显。" },
      { level: 4, name: "沧涛进阶", threshold: 200, imageUrl: "/mecha/tidal/level-4.png", description: "沧涛进阶，幽洋舰甲初成。" },
      { level: 5, name: "潜航突破", threshold: 350, imageUrl: "/mecha/tidal/level-5.png", description: "潜航突破，深海突袭之威尽显。" },
      { level: 6, name: "怒洋出世", threshold: 500, imageUrl: "/mecha/tidal/level-6.png", description: "怒洋出世，深海之力臻于完美。" },
      { level: 7, name: "完整体", threshold: 800, imageUrl: "/mecha/tidal/level-7.png", description: "深海之力达到巅峰，与你心意相通。" },
    ],
  },
  {
    slug: "titan-fort",
    name: "镇岳",
    description: "陆地堡垒载具机甲，擅长阵地驻守与强力防御",
    intro: "镇岳，陆地堡垒载具机甲，擅长阵地驻守与强力防御，车身坚固无比，能抵御高强度攻击，为团队构筑安全防线；可稳定驻守战场、掩护队友推进，是陆地上最可靠的移动防御堡垒。它在历练中不断觉醒，解锁更强形态、超重型防御装甲与壁垒之力，每一次蜕变都让防御之力更强。",
    sortOrder: 8,
    levels: [
      { level: 0, name: "初识", threshold: 0, imageUrl: "/mecha/titan-fort/level-0.png", description: "深铁灰暗金初现，堡垒之能若隐若现，防御之力开始凝聚。" },
      { level: 1, name: "觉醒", threshold: 20, imageUrl: "/mecha/titan-fort/level-1.png", description: "超重型防御装甲初绽，驻守之姿初成。" },
      { level: 2, name: "成型", threshold: 50, imageUrl: "/mecha/titan-fort/level-2.png", description: "镇岳成型，陆地堡垒之能初显。" },
      { level: 3, name: "强化", threshold: 100, imageUrl: "/mecha/titan-fort/level-3.png", description: "防御之力愈发凝实，阵地压制之姿渐显。" },
      { level: 4, name: "镇岳进阶", threshold: 200, imageUrl: "/mecha/titan-fort/level-4.png", description: "镇岳进阶，全域防御屏障初成。" },
      { level: 5, name: "壁垒突破", threshold: 350, imageUrl: "/mecha/titan-fort/level-5.png", description: "壁垒突破，堡垒驻守之威尽显。" },
      { level: 6, name: "万夫莫开", threshold: 500, imageUrl: "/mecha/titan-fort/level-6.png", description: "万夫莫开，防御之力臻于完美。" },
      { level: 7, name: "完整体", threshold: 800, imageUrl: "/mecha/titan-fort/level-7.png", description: "防御之力达到巅峰，与你心意相通。" },
    ],
  },
];
