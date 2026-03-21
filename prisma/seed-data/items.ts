/** 道具图鉴种子（与 docs/data/item-catalog.md 一致，编号 0002 无素材故跳过） */
export interface ItemSeedRow {
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  kind: "DISPLAY" | "MATERIAL" | "CONSUMABLE";
  /** 与文件名编号一致，便于排序 */
  sortOrder: number;
}

export const ITEM_SEED_DATA: ItemSeedRow[] = [
  {
    slug: "pulse-ion-cannon",
    name: "脉冲离子炮",
    description:
      "重型机甲用高输出能量炮。炮口六角约束环内蓄积高密度离子脉冲，可贯穿复合装甲；能耗较高，适合一击决胜的火力窗口。",
    imageUrl: "/item/0001.png",
    kind: "DISPLAY",
    sortOrder: 1,
  },
  {
    slug: "ion-vambrace-blades",
    name: "离子震刃臂铠",
    description:
      "成对近战臂铠，强化合金与分段指节兼顾防护与灵活。前臂藏有高频离子刃，手背能量条可在近身战中提供额外爆发。",
    imageUrl: "/item/0003.png",
    kind: "DISPLAY",
    sortOrder: 3,
  },
  {
    slug: "swarm-nine-rocket-pod",
    name: "九联蜂群火箭巢",
    description:
      "中程火力支援舱。正面九联装微型导弹可扇形齐射，对区域目标做饱和打击；底部旋台便于在机动中保持射界。",
    imageUrl: "/item/0004.png",
    kind: "DISPLAY",
    sortOrder: 4,
  },
  {
    slug: "hex-thermal-missile-pod",
    name: "六联热能导弹巢",
    description:
      "六管并列热能导弹巢，适合短点射与覆盖轰炸。炮口预热呈暖色辉光，侧舷冷媒灯提示热控与待发状态。",
    imageUrl: "/item/0005.png",
    kind: "DISPLAY",
    sortOrder: 5,
  },
  {
    slug: "pulse-ion-rifle",
    name: "脉冲离子步枪",
    description:
      "中远距离制式能量步枪。侧方离子舱稳定供能，连续射出等离子弹丸；结构厚重，适合中阶机体主武器槽。",
    imageUrl: "/item/0006.png",
    kind: "DISPLAY",
    sortOrder: 6,
  },
  {
    slug: "scout-spider-core",
    name: "蛛式侦察核心",
    description:
      "四足球形侦察单元。中央蓝光主传感器利于雾天与杂波环境；节肢越障能力强，适合废墟与管道侦查。",
    imageUrl: "/item/0007.png",
    kind: "DISPLAY",
    sortOrder: 7,
  },
  {
    slug: "heavy-crawler-tracks",
    name: "重型双履带底盘",
    description:
      "双履带高扭矩行走模块。正面带近距传感，抓地稳、越障强，适合碎石坡地与战损路面推进。",
    imageUrl: "/item/0008.png",
    kind: "DISPLAY",
    sortOrder: 8,
  },
  {
    slug: "quantum-energy-cell",
    name: "量子储能箱",
    description:
      "加固型高密度储能容器。角柱冷光与顶面接口暗示大容量与安全闭锁，多用于运输高能素材或贵重组件。",
    imageUrl: "/item/0009.png",
    kind: "DISPLAY",
    sortOrder: 9,
  },
  {
    slug: "tactical-grapnel-launcher",
    name: "战术锚钩发射器",
    description:
      "三爪锚头与加粗索芯，用于攀高、牵引或牵制目标。侧舷散热栅承担索射瞬时热负荷，前向蓝光为待发指示。",
    imageUrl: "/item/0010.png",
    kind: "DISPLAY",
    sortOrder: 10,
  },
  {
    slug: "hf-radar-dish",
    name: "高频雷达天线",
    description:
      "抛物面战术雷达，栅格反射面与中央馈源匹配。可穿透一定电磁干扰，用于远程信标与战场态势感知。",
    imageUrl: "/item/0011.png",
    kind: "DISPLAY",
    sortOrder: 11,
  },
  {
    slug: "precision-mech-arm",
    name: "精密机械臂",
    description:
      "多轴工业级机械臂，肩座可对接维护站或外挂位。肘腕全向活动，适合补给线与微损件拾取。",
    imageUrl: "/item/0012.png",
    kind: "DISPLAY",
    sortOrder: 12,
  },
  {
    slug: "ion-thruster-core",
    name: "离子推进核心",
    description:
      "柱形离子推进／能源模块。前截面蓝光射流与中部金环为高压约束段，侧向琥珀散热口提示出力区间。",
    imageUrl: "/item/0013.png",
    kind: "DISPLAY",
    sortOrder: 13,
  },
  {
    slug: "nano-titanium-mantle",
    name: "纳米钛合金披风",
    description:
      "高领战术披风，纳米钛纤维与离子镀层兼顾背部防护。高速机动时边缘可对雷达波产生一定扰动，降低锁定概率。",
    imageUrl: "/item/0014.png",
    kind: "DISPLAY",
    sortOrder: 14,
  },
  {
    slug: "pulse-guard-chestplate",
    name: "脉冲护胸合金板",
    description:
      "胸甲单元，分段装甲与胸侧能量槽。中央橙色同步灯便于观察与机体神经链耦合状态，可抵御常见动能主射。",
    imageUrl: "/item/0015.png",
    kind: "DISPLAY",
    sortOrder: 15,
  },
  {
    slug: "mecha-field-repair-pack",
    name: "机甲抢修背囊",
    description:
      "外置扳手与电子探针的便携维修包，肩腰束带加固。发光条可显示工具组电量，适合战场紧急整备与管线抢修。",
    imageUrl: "/item/0016.png",
    kind: "DISPLAY",
    sortOrder: 16,
  },
];
