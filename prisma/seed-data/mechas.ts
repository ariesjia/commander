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
      { level: 0, name: "量产型", threshold: 0, imageUrl: "/mecha/xuanjia/level-0.png", description: "基础突破与近距离压制能力，可执行先锋任务。" },
      { level: 1, name: "改良型", threshold: 20, imageUrl: "/mecha/xuanjia/level-1.png", description: "突破防线能力增强，立足阵地更加稳固。" },
      { level: 2, name: "特装型", threshold: 50, imageUrl: "/mecha/xuanjia/level-2.png", description: "重火力配置完成，可承担阵地突破重任。" },
      { level: 3, name: "强化型", threshold: 80, imageUrl: "/mecha/xuanjia/level-3.png", description: "攻守一体，核心力量成型，近距离歼灭能力显著提升。" },
      { level: 4, name: "装甲型", threshold: 120, imageUrl: "/mecha/xuanjia/level-4.png", description: "重装装甲加身，近战压制与撕开阵型的能力大幅增强。" },
      { level: 5, name: "火力型", threshold: 160, imageUrl: "/mecha/xuanjia/level-5.png", description: "重火力与近战兼备，凭借压倒性力量撕开对手阵型。" },
      { level: 6, name: "翼甲型", threshold: 200, imageUrl: "/mecha/xuanjia/level-6.png", description: "全域感知与机动兼顾，先锋冲锋战力全开。" },
      { level: 7, name: "完整体", threshold: 250, imageUrl: "/mecha/xuanjia/level-7.png", description: "与你心意相通，每一次蜕变都让战力飙升。" },
    ],
  },
  {
    slug: "star-shield",
    name: "星盾",
    description: "全能防御型人形机甲，擅长构筑绝对屏障与群体庇护",
    intro: "星盾，全能防御型人形机甲，擅长构筑绝对屏障与群体庇护，能稳定承受高强度攻击，为团队创造安全输出环境。负责承伤掩护、区域防御、危机救援。它在历练中不断觉醒，解锁更强形态、光之铠甲与星辰力量，每一次蜕变都让守护之力更强。",
    sortOrder: 1,
    levels: [
      { level: 0, name: "量产型", threshold: 0, imageUrl: "/mecha/star-shield/level-0.png", description: "基础屏障与庇护能力，可承担承伤掩护任务。" },
      { level: 1, name: "改良型", threshold: 20, imageUrl: "/mecha/star-shield/level-1.png", description: "守护之力凝实，能为团队创造更安全的输出环境。" },
      { level: 2, name: "特装型", threshold: 50, imageUrl: "/mecha/star-shield/level-2.png", description: "区域防御能力初显，可稳定承受一定强度攻击。" },
      { level: 3, name: "强化型", threshold: 80, imageUrl: "/mecha/star-shield/level-3.png", description: "绝对屏障构筑能力增强，危机救援反应更快。" },
      { level: 4, name: "光铠型", threshold: 120, imageUrl: "/mecha/star-shield/level-4.png", description: "光之铠甲加身，群体庇护范围与强度大幅提升。" },
      { level: 5, name: "星辰型", threshold: 160, imageUrl: "/mecha/star-shield/level-5.png", description: "星辰力量觉醒，全能防御之威尽显。" },
      { level: 6, name: "星辉型", threshold: 200, imageUrl: "/mecha/star-shield/level-6.png", description: "守护之力臻于完美，构筑绝对屏障与群体庇护。" },
      { level: 7, name: "完整体", threshold: 250, imageUrl: "/mecha/star-shield/level-7.png", description: "与你心意相通，每一次蜕变都让守护之力更强。" },
    ],
  },
  {
    slug: "razor",
    name: "利刃",
    description: "极速突袭型人形机甲，擅长瞬间切入与精准打击",
    intro: "利刃，极速突袭型人形机甲，擅长瞬间切入与精准打击，以超高效率瓦解敌方关键目标。负责快速突袭、弱点击破、敌后干扰。它在历练中不断觉醒，解锁更强形态、破甲武装与雷霆锋芒，每一次蜕变都让斩击之力更强。",
    sortOrder: 2,
    levels: [
      { level: 0, name: "量产型", threshold: 0, imageUrl: "/mecha/razor/level-0.png", description: "基础极速与精准打击能力，可执行快速突袭任务。" },
      { level: 1, name: "改良型", threshold: 20, imageUrl: "/mecha/razor/level-1.png", description: "瞬间切入能力增强，弱点击破效率提升。" },
      { level: 2, name: "特装型", threshold: 50, imageUrl: "/mecha/razor/level-2.png", description: "斩击之力初显，以超高效率瓦解关键目标。" },
      { level: 3, name: "强化型", threshold: 80, imageUrl: "/mecha/razor/level-3.png", description: "极速突袭能力成型，敌后干扰反应更快。" },
      { level: 4, name: "破甲型", threshold: 120, imageUrl: "/mecha/razor/level-4.png", description: "破甲武装加身，精准打击穿透力大幅增强。" },
      { level: 5, name: "雷霆型", threshold: 160, imageUrl: "/mecha/razor/level-5.png", description: "雷霆锋芒觉醒，斩击之威尽显。" },
      { level: 6, name: "锋芒型", threshold: 200, imageUrl: "/mecha/razor/level-6.png", description: "斩击之力臻于完美，瞬间切入与精准打击达到巅峰。" },
      { level: 7, name: "完整体", threshold: 250, imageUrl: "/mecha/razor/level-7.png", description: "与你心意相通，每一次蜕变都让斩击之力更强。" },
    ],
  },
  {
    slug: "swift",
    name: "风驰",
    description: "机动侦查型人形机甲，擅长高速移动与战场侦察",
    intro: "风驰，机动侦查型人形机甲，擅长高速移动与战场侦察，灵活穿梭复杂地形获取情报。负责前沿探查、迂回牵制、快速支援。它在历练中不断觉醒，解锁更强形态、风雷双翼与瞬影突袭，每一次蜕变都让迅捷之力更强。",
    sortOrder: 3,
    levels: [
      { level: 0, name: "量产型", threshold: 0, imageUrl: "/mecha/swift/level-0.png", description: "基础高速移动与侦察能力，可执行前沿探查任务。" },
      { level: 1, name: "改良型", threshold: 20, imageUrl: "/mecha/swift/level-1.png", description: "灵活穿梭复杂地形能力增强，情报获取效率提升。" },
      { level: 2, name: "特装型", threshold: 50, imageUrl: "/mecha/swift/level-2.png", description: "机动侦查能力初显，迂回牵制反应更快。" },
      { level: 3, name: "强化型", threshold: 80, imageUrl: "/mecha/swift/level-3.png", description: "战场侦察与快速支援能力成型。" },
      { level: 4, name: "翼装型", threshold: 120, imageUrl: "/mecha/swift/level-4.png", description: "风雷双翼加身，高速移动与跨越地形能力大幅增强。" },
      { level: 5, name: "突袭型", threshold: 160, imageUrl: "/mecha/swift/level-5.png", description: "瞬影突袭觉醒，迅捷之威尽显。" },
      { level: 6, name: "疾风型", threshold: 200, imageUrl: "/mecha/swift/level-6.png", description: "迅捷之力臻于完美，灵活穿梭与快速支援达到巅峰。" },
      { level: 7, name: "完整体", threshold: 250, imageUrl: "/mecha/swift/level-7.png", description: "与你心意相通，每一次蜕变都让迅捷之力更强。" },
    ],
  },
  {
    slug: "thunder",
    name: "雷啸",
    description: "范围爆发型人形机甲，擅长大范围雷电攻击与群体控制",
    intro: "雷啸，范围爆发型人形机甲，擅长大范围雷电攻击与群体控制，以强力输出覆盖整片战场。负责群体伤害、场面压制、区域控场。它在历练中不断觉醒，解锁更强形态、雷电武装与爆轰之力，每一次蜕变都让轰击之力更强。",
    sortOrder: 4,
    levels: [
      { level: 0, name: "量产型", threshold: 0, imageUrl: "/mecha/thunder/level-0.png", description: "基础雷电攻击能力，可执行群体伤害任务。" },
      { level: 1, name: "改良型", threshold: 20, imageUrl: "/mecha/thunder/level-1.png", description: "大范围雷电攻击能力增强，雷能初绽。" },
      { level: 2, name: "特装型", threshold: 50, imageUrl: "/mecha/thunder/level-2.png", description: "场面压制能力初显，可覆盖整片战场。" },
      { level: 3, name: "强化型", threshold: 80, imageUrl: "/mecha/thunder/level-3.png", description: "强力输出与区域控场能力成型，雷霆之威尽显。" },
      { level: 4, name: "轰雷型", threshold: 120, imageUrl: "/mecha/thunder/level-4.png", description: "雷电武装加身，群体伤害与控场范围大幅增强。" },
      { level: 5, name: "万钧型", threshold: 160, imageUrl: "/mecha/thunder/level-5.png", description: "爆轰之力全开，范围爆发之威尽显。" },
      { level: 6, name: "雷翼型", threshold: 200, imageUrl: "/mecha/thunder/level-6.png", description: "轰击之力臻于完美，大范围雷电攻击与群体控制达到巅峰。" },
      { level: 7, name: "完整体", threshold: 250, imageUrl: "/mecha/thunder/level-7.png", description: "与你心意相通，每一次蜕变都让轰击之力更强。" },
    ],
  },
  {
    slug: "magnet",
    name: "磁暴",
    description: "磁场控制型人形机甲，擅长引力牵引与能量干扰",
    intro: "磁暴，磁场控制型人形机甲，擅长引力牵引与能量干扰，可改变战场态势限制敌人行动。负责装备干扰、引力束缚、阵型打乱。它在历练中不断觉醒，解锁更强形态、磁暴装甲与引力核心，每一次蜕变都让磁力之力更强。",
    sortOrder: 5,
    levels: [
      { level: 0, name: "量产型", threshold: 0, imageUrl: "/mecha/magnet/level-0.png", description: "基础引力牵引与能量干扰能力，可执行装备干扰任务。" },
      { level: 1, name: "改良型", threshold: 20, imageUrl: "/mecha/magnet/level-1.png", description: "磁场控制能力增强，双极之力初绽。" },
      { level: 2, name: "特装型", threshold: 50, imageUrl: "/mecha/magnet/level-2.png", description: "引力束缚能力初显，可限制敌人行动。" },
      { level: 3, name: "强化型", threshold: 80, imageUrl: "/mecha/magnet/level-3.png", description: "改变战场态势能力成型，干扰与控场之力涌动。" },
      { level: 4, name: "磁能型", threshold: 120, imageUrl: "/mecha/magnet/level-4.png", description: "磁能武装加身，引力牵引与能量干扰范围大幅增强。" },
      { level: 5, name: "引力型", threshold: 160, imageUrl: "/mecha/magnet/level-5.png", description: "引力核心觉醒，阵型打乱之威尽显。" },
      { level: 6, name: "核心型", threshold: 200, imageUrl: "/mecha/magnet/level-6.png", description: "磁力之力臻于完美，磁场控制达到巅峰。" },
      { level: 7, name: "完整体", threshold: 250, imageUrl: "/mecha/magnet/level-7.png", description: "与你心意相通，每一次蜕变都让磁力之力更强。" },
    ],
  },
  {
    slug: "aether",
    name: "空境",
    description: "空中全域载具机甲，擅长高空穿梭与快速部署",
    intro: "空境，空中全域载具机甲，擅长高空穿梭与快速部署，可跨越地形实现全员机动转移。负责空中运输、全域支援、高空侦查。它在历练中不断觉醒，解锁更强形态、天境引擎与跃迁之力，每一次蜕变都让穿梭之力更强。",
    sortOrder: 6,
    levels: [
      { level: 0, name: "量产型", threshold: 0, imageUrl: "/mecha/aether/level-0.png", description: "基础高空穿梭能力，可执行空中运输任务。" },
      { level: 1, name: "改良型", threshold: 20, imageUrl: "/mecha/aether/level-1.png", description: "快速部署能力增强，浮空之能初成。" },
      { level: 2, name: "特装型", threshold: 50, imageUrl: "/mecha/aether/level-2.png", description: "全域载具之能初显，可跨越地形机动转移。" },
      { level: 3, name: "强化型", threshold: 80, imageUrl: "/mecha/aether/level-3.png", description: "跃迁之力凝实，全域支援与高空侦查能力成型。" },
      { level: 4, name: "跃迁型", threshold: 120, imageUrl: "/mecha/aether/level-4.png", description: "跃迁引擎加身，高空穿梭与快速部署能力大幅增强。" },
      { level: 5, name: "超跃型", threshold: 160, imageUrl: "/mecha/aether/level-5.png", description: "跃迁核心觉醒，团队运输之威尽显。" },
      { level: 6, name: "破穹型", threshold: 200, imageUrl: "/mecha/aether/level-6.png", description: "穿梭之力臻于完美，跨越地形实现全员机动转移达到巅峰。" },
      { level: 7, name: "完整体", threshold: 250, imageUrl: "/mecha/aether/level-7.png", description: "与你心意相通，每一次蜕变都让穿梭之力更强。" },
    ],
  },
  {
    slug: "tidal",
    name: "沧龙",
    description: "深海两栖载具机甲，擅长隐秘潜行与远距离火力压制",
    intro: "沧龙，深海两栖载具机甲，擅长隐秘潜行与远距离火力压制，能在各种地形稳定作战，默默为团队扫清前路。负责深海突袭、团队运载、远程重炮、封锁水域。它在历练中不断觉醒，解锁更强形态、沧龙幽洋舰甲与潜航之力，每一次蜕变都让深海之力更强。",
    sortOrder: 7,
    levels: [
      { level: 0, name: "量产型", threshold: 0, imageUrl: "/mecha/tidal/level-0.png", description: "基础隐秘潜行与两栖作战能力，可执行深海突袭任务。" },
      { level: 1, name: "改良型", threshold: 20, imageUrl: "/mecha/tidal/level-1.png", description: "远距离火力压制能力增强，潜行之能初成。" },
      { level: 2, name: "特装型", threshold: 50, imageUrl: "/mecha/tidal/level-2.png", description: "两栖载具之能初显，可在各种地形稳定作战。" },
      { level: 3, name: "强化型", threshold: 80, imageUrl: "/mecha/tidal/level-3.png", description: "潜航之力凝实，团队运载与远程重炮能力成型。" },
      { level: 4, name: "幽洋型", threshold: 120, imageUrl: "/mecha/tidal/level-4.png", description: "幽洋舰甲加身，隐秘潜行与封锁水域能力大幅增强。" },
      { level: 5, name: "潜航型", threshold: 160, imageUrl: "/mecha/tidal/level-5.png", description: "潜航突破，深海突袭之威尽显，默默为团队扫清前路。" },
      { level: 6, name: "怒洋型", threshold: 200, imageUrl: "/mecha/tidal/level-6.png", description: "深海之力臻于完美，隐秘潜行与远距离火力压制达到巅峰。" },
      { level: 7, name: "完整体", threshold: 250, imageUrl: "/mecha/tidal/level-7.png", description: "与你心意相通，每一次蜕变都让深海之力更强。" },
    ],
  },
  {
    slug: "titan-fort",
    name: "镇岳",
    description: "陆地堡垒载具机甲，擅长阵地驻守与强力防御",
    intro: "镇岳，陆地堡垒载具机甲，擅长阵地驻守与强力防御，车身坚固无比，能抵御高强度攻击，为团队构筑安全防线；可稳定驻守战场、掩护队友推进，是陆地上最可靠的移动防御堡垒。它在历练中不断觉醒，解锁更强形态、超重型防御装甲与壁垒之力，每一次蜕变都让防御之力更强。",
    sortOrder: 8,
    levels: [
      { level: 0, name: "量产型", threshold: 0, imageUrl: "/mecha/titan-fort/level-0.png", description: "基础阵地驻守能力，可承担掩护队友推进任务。" },
      { level: 1, name: "改良型", threshold: 20, imageUrl: "/mecha/titan-fort/level-1.png", description: "强力防御能力增强，可抵御一定强度攻击。" },
      { level: 2, name: "特装型", threshold: 50, imageUrl: "/mecha/titan-fort/level-2.png", description: "陆地堡垒之能初显，可为团队构筑安全防线。" },
      { level: 3, name: "强化型", threshold: 80, imageUrl: "/mecha/titan-fort/level-3.png", description: "防御之力凝实，阵地驻守与掩护推进能力成型。" },
      { level: 4, name: "壁垒型", threshold: 120, imageUrl: "/mecha/titan-fort/level-4.png", description: "全域防御屏障加身，抵御高强度攻击能力大幅增强。" },
      { level: 5, name: "重装型", threshold: 160, imageUrl: "/mecha/titan-fort/level-5.png", description: "超重型防御装甲觉醒，堡垒驻守之威尽显。" },
      { level: 6, name: "要塞型", threshold: 200, imageUrl: "/mecha/titan-fort/level-6.png", description: "防御之力臻于完美，陆地上最可靠的移动防御堡垒。" },
      { level: 7, name: "完整体", threshold: 250, imageUrl: "/mecha/titan-fort/level-7.png", description: "与你心意相通，每一次蜕变都让防御之力更强。" },
    ],
  },
  {
    slug: "tunnel",
    name: "地渊",
    description: "地下隧道仿生机械兽，擅长钻地潜行与隧道开辟",
    intro: "地渊，地下隧道仿生机械兽，仿蚯蚓/穿山甲形态，可钻地潜行、打通隧道，在复杂地下环境中快速机动，为队伍开辟路线。负责地下渗透、隧道开辟、隐蔽运输、地下侦察。它在历练中不断觉醒，解锁更强形态、地脉钻头与深潜之力，每一次蜕变都让地下之力更强。",
    sortOrder: 9,
    levels: [
      { level: 0, name: "量产型", threshold: 0, imageUrl: "/mecha/tunnel/level-0.png", description: "基础钻地潜行能力，可执行地下渗透任务。" },
      { level: 1, name: "改良型", threshold: 20, imageUrl: "/mecha/tunnel/level-1.png", description: "隧道开辟能力增强，地下机动更加灵活。" },
      { level: 2, name: "特装型", threshold: 50, imageUrl: "/mecha/tunnel/level-2.png", description: "地脉钻头初显，可承担隐蔽运输重任。" },
      { level: 3, name: "强化型", threshold: 80, imageUrl: "/mecha/tunnel/level-3.png", description: "地下侦察能力成型，岩层穿行效率显著提升。" },
      { level: 4, name: "深潜型", threshold: 120, imageUrl: "/mecha/tunnel/level-4.png", description: "深潜之力加身，隧道开辟与隐蔽通道能力大幅增强。" },
      { level: 5, name: "地脉型", threshold: 160, imageUrl: "/mecha/tunnel/level-5.png", description: "地脉钻头觉醒，地下渗透之威尽显。" },
      { level: 6, name: "裂隙型", threshold: 200, imageUrl: "/mecha/tunnel/level-6.png", description: "地下之力臻于完美，为队伍开辟隐蔽通道达到巅峰。" },
      { level: 7, name: "完整体", threshold: 250, imageUrl: "/mecha/tunnel/level-7.png", description: "与你心意相通，每一次蜕变都让地下之力更强。" },
    ],
  },
  {
    slug: "ark",
    name: "方舟",
    description: "后勤补给型载具，擅长弹药补给与战场维修",
    intro: "方舟，后勤补给型载具，携带大量弹药、能源与维修物资，可向前线友军远程投送补给，并部署小型维修机器人进行战场抢修，是持续作战的保障单位。负责弹药补给、能源投送、战场维修、物资空投。它在历练中不断觉醒，解锁更强形态、补给投送舱与续航之力，每一次蜕变都让后勤之力更强。",
    sortOrder: 10,
    levels: [
      { level: 0, name: "量产型", threshold: 0, imageUrl: "/mecha/ark/level-0.png", description: "基础弹药补给能力，可执行物资空投任务。" },
      { level: 1, name: "改良型", threshold: 20, imageUrl: "/mecha/ark/level-1.png", description: "能源投送能力增强，补给效率提升。" },
      { level: 2, name: "特装型", threshold: 50, imageUrl: "/mecha/ark/level-2.png", description: "维修机器人集群初显，可承担战场抢修重任。" },
      { level: 3, name: "强化型", threshold: 80, imageUrl: "/mecha/ark/level-3.png", description: "远程投送能力成型，友军续航显著提升。" },
      { level: 4, name: "补给型", threshold: 120, imageUrl: "/mecha/ark/level-4.png", description: "补给投送舱加身，弹药与能源投送能力大幅增强。" },
      { level: 5, name: "方舟型", threshold: 160, imageUrl: "/mecha/ark/level-5.png", description: "战场后勤核心觉醒，持久战保障之威尽显。" },
      { level: 6, name: "续航型", threshold: 200, imageUrl: "/mecha/ark/level-6.png", description: "后勤之力臻于完美，让友军保持弹药与机体状态达到巅峰。" },
      { level: 7, name: "完整体", threshold: 250, imageUrl: "/mecha/ark/level-7.png", description: "与你心意相通，每一次蜕变都让后勤之力更强。" },
    ],
  },
  {
    slug: "medecac",
    name: "济世",
    description: "医疗运输载具机甲，擅长伤员转运与战场急救",
    intro: "济世，医疗运输载具机甲，以医疗与救援为核心，配备生命维持舱与快速部署系统，可在战场中快速转运伤员并实施急救。负责伤员转运、战场急救、医疗物资投送、撤离掩护。它在历练中不断觉醒，解锁更强形态、生命维持舱与护佑之力，每一次蜕变都让医疗之力更强。",
    sortOrder: 11,
    levels: [
      { level: 0, name: "量产型", threshold: 0, imageUrl: "/mecha/medecac/level-0.png", description: "基础伤员转运能力，可执行战场急救任务。" },
      { level: 1, name: "改良型", threshold: 20, imageUrl: "/mecha/medecac/level-1.png", description: "快速部署能力增强，医疗物资投送效率提升。" },
      { level: 2, name: "特装型", threshold: 50, imageUrl: "/mecha/medecac/level-2.png", description: "生命维持舱初显，可承担撤离掩护重任。" },
      { level: 3, name: "强化型", threshold: 80, imageUrl: "/mecha/medecac/level-3.png", description: "急救能力成型，能在战火中快速抵达伤员位置。" },
      { level: 4, name: "急救型", threshold: 120, imageUrl: "/mecha/medecac/level-4.png", description: "紧急医疗无人机加身，转运与急救能力大幅增强。" },
      { level: 5, name: "复苏型", threshold: 160, imageUrl: "/mecha/medecac/level-5.png", description: "医疗核心觉醒，保障小队生存之威尽显。" },
      { level: 6, name: "护佑型", threshold: 200, imageUrl: "/mecha/medecac/level-6.png", description: "医疗之力臻于完美，伤员转运与急救达到巅峰。" },
      { level: 7, name: "完整体", threshold: 250, imageUrl: "/mecha/medecac/level-7.png", description: "与你心意相通，每一次蜕变都让医疗之力更强。" },
    ],
  },
];
