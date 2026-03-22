import type { MechaSkillKind } from "@prisma/client";

export interface MechaSkillSeed {
  unlockLevel: 2 | 5 | 7;
  kind: MechaSkillKind;
  slug: string;
  name: string;
  description: string;
}

/** 每台机甲 3 条里程碑技能（等级 2 / 5 / 7），与 docs/stories/0004-mecha-skills.md §6 一致 */
export const MECHA_SKILLS_BY_SLUG: Record<string, MechaSkillSeed[]> = {
  xuanjia: [
    { unlockLevel: 2, kind: "ATTACK", slug: "xuanjia-rift-charge", name: "裂阵冲拳", description: "双臂推进器短距爆发，向前突击撕开敌方正面防线第一道缺口，为后续部队打开通道。" },
    { unlockLevel: 5, kind: "ATTACK", slug: "xuanjia-fort-barrage", name: "重铠炮轰", description: "展开肩部重火力单元，对阵地目标进行压制齐射，以火力覆盖迫使敌方收缩阵型。" },
    { unlockLevel: 7, kind: "ATTACK", slug: "xuanjia-final-cleave", name: "玄甲终焉斩", description: "核心短时过载，全开装甲与近战武装发动决定性突破，对关键目标执行正面歼灭。" },
  ],
  "star-shield": [
    { unlockLevel: 2, kind: "DEFENSE", slug: "star-shield-star-ring", name: "星环庇护", description: "展开环形护盾吸收来袭火力，为身边友军争取重整与撤退时间。" },
    { unlockLevel: 5, kind: "DEFENSE", slug: "star-shield-dawn-reflect", name: "辰辉反弹", description: "将所受部分冲击转化为定向反震波，干扰敌方攻势节奏并打断连续压制。" },
    { unlockLevel: 7, kind: "DEFENSE", slug: "star-shield-absolute-dome", name: "绝对星穹", description: "构筑大范围屏障，在短时间内将团队笼罩于高覆盖防护之下，对抗爆发集火。" },
  ],
  razor: [
    { unlockLevel: 2, kind: "ATTACK", slug: "razor-zig-slash", name: "折线闪切", description: "以折线机动贴近目标，等离子刃短促切割弱点，追求最小暴露时间。" },
    { unlockLevel: 5, kind: "ATTACK", slug: "razor-thunder-lunge", name: "雷霆突刺", description: "全推进器爆发直线贯穿，针对敌阵中的高价值目标实施一击穿透。" },
    { unlockLevel: 7, kind: "ATTACK", slug: "razor-final-verdict", name: "利刃终裁", description: "多段连斩与尾焰收尾衔接，对锁定目标执行单点歼灭裁决。" },
  ],
  swift: [
    { unlockLevel: 2, kind: "SUPPORT", slug: "swift-wind-mark", name: "风标侦测", description: "释放微型浮标扫描局部地形与热源，为友军标定视野与可疑动向。" },
    { unlockLevel: 5, kind: "CONTROL", slug: "swift-feint-pull", name: "迂回牵引", description: "高速蛇形机动吸引火力，牵制敌方并为队友创造侧翼窗口与安全转移时间。" },
    { unlockLevel: 7, kind: "BUFF", slug: "swift-full-map", name: "全域信标", description: "将战场态势压缩回传指挥链，使全队短时共享统一战术图层。" },
  ],
  thunder: [
    { unlockLevel: 2, kind: "CONTROL", slug: "thunder-arc-sweep", name: "电弧横扫", description: "扇形释放连锁电弧，对接触单位造成短暂麻痹与持续骚扰。" },
    { unlockLevel: 5, kind: "ATTACK", slug: "thunder-storm-zone", name: "雷域降临", description: "在指定区域落下持续雷暴，覆盖群体伤害并压制敌方推进。" },
    { unlockLevel: 7, kind: "ATTACK", slug: "thunder-judgment-bolt", name: "万钧天罚", description: "集束雷柱轰击中心点，对密集敌军发动毁灭性爆发打击。" },
  ],
  magnet: [
    { unlockLevel: 2, kind: "CONTROL", slug: "magnet-dipole-pull", name: "双极牵引", description: "对单体施加强引力，拖慢其位移并扰乱武器与传感瞄准。" },
    { unlockLevel: 5, kind: "CONTROL", slug: "magnet-maelstrom", name: "磁暴涡流", description: "在地面形成旋转磁场，干扰敌方电子设备并打乱其阵型衔接。" },
    { unlockLevel: 7, kind: "CONTROL", slug: "magnet-collapse", name: "引力坍缩", description: "短暂将区域内敌人向中心牵引，为友军创造集火与控场窗口。" },
  ],
  aether: [
    { unlockLevel: 2, kind: "SUPPORT", slug: "aether-drop-supply", name: "伞降补给", description: "对地面小队空投应急物资与弹药箱，保障前线持续输出。" },
    { unlockLevel: 5, kind: "BUFF", slug: "aether-formation-shift", name: "编队跃迁", description: "优化友军单位之间的战术转场路径，缩短暴露在威胁区的时间。" },
    { unlockLevel: 7, kind: "SUPPORT", slug: "aether-sky-corridor", name: "天境走廊", description: "开启持续一段时间的空中安全走廊，引导单位规避地对空高危区域。" },
  ],
  tidal: [
    { unlockLevel: 2, kind: "ATTACK", slug: "tidal-torpedo-snipe", name: "潜射鱼叉", description: "水下发射制导鱼雷，对水面或沿岸目标发动隐蔽突袭。" },
    { unlockLevel: 5, kind: "ATTACK", slug: "tidal-abyss-barrage", name: "幽洋弹幕", description: "上浮后遥控舰甲武器站进行覆盖射击，压制封锁水域。" },
    { unlockLevel: 7, kind: "ATTACK", slug: "tidal-devour-tide", name: "沧龙吞潮", description: "联合主炮与潜航姿态发动总攻，对目标水域执行毁灭性封锁。" },
  ],
  "titan-fort": [
    { unlockLevel: 2, kind: "DEFENSE", slug: "titan-fort-anchor-spike", name: "固守钉刺", description: "展开驻锄与侧装甲进入固守姿态，提升原地抗击打能力并反击近身目标。" },
    { unlockLevel: 5, kind: "ATTACK", slug: "titan-fort-bastion-salvo", name: "壁垒齐射", description: "全炮塔同步对正面扇形区域倾泻火力，形成移动火力堡垒。" },
    { unlockLevel: 7, kind: "DEFENSE", slug: "titan-fort-immovable", name: "镇岳不动", description: "进入极限防御姿态，以车身为核心为全队提供掩护与战线稳定（叙事效果，数值实现可后续接入）。" },
  ],
  tunnel: [
    { unlockLevel: 2, kind: "SUPPORT", slug: "tunnel-drill-burst", name: "地脉钻头", description: "硬化钻头部件快速打通短距岩层通道，供自身或友军穿行。" },
    { unlockLevel: 5, kind: "ATTACK", slug: "tunnel-ambush-surge", name: "裂隙奔袭", description: "自地下出口突然窜出袭击侧后，再潜回地下脱离火力网。" },
    { unlockLevel: 7, kind: "SUPPORT", slug: "tunnel-deep-network", name: "深渊路网", description: "为团队建立多条隐蔽地下机动线，支援包抄、补给与撤离。" },
  ],
  ark: [
    { unlockLevel: 2, kind: "SUPPORT", slug: "ark-emergency-drop", name: "应急空投", description: "无人机群向最近友军投送维修单元与弹药，缓解前线断供。" },
    { unlockLevel: 5, kind: "BUFF", slug: "ark-perpetual-beacon", name: "永续中继", description: "在前线部署补给信标，小范围内持续保障友军作战续航（叙事层）。" },
    { unlockLevel: 7, kind: "SUPPORT", slug: "ark-covenant", name: "方舟盟约", description: "全域协调多趟补给航线，使持久战中的弹药与能源分配最优化。" },
  ],
  medecac: [
    { unlockLevel: 2, kind: "HEAL", slug: "medecac-life-pulse", name: "生命脉冲", description: "对单体伤员注入稳定剂与止血雾，延缓创伤恶化争取救治时间。" },
    { unlockLevel: 5, kind: "HEAL", slug: "medecac-swarm-aid", name: "蜂群急救", description: "释放医疗无人机群，对区域内多名伤员并行检测与急救处理。" },
    { unlockLevel: 7, kind: "SUPPORT", slug: "medecac-evac-corridor", name: "净土撤离", description: "开辟受掩撤离走廊，优先将重伤员转移至安全区与后送节点。" },
  ],
  "iron-dragon": [
    { unlockLevel: 2, kind: "ATTACK", slug: "iron-dragon-battery-volley", name: "联装齐射", description: "多节车厢武器站同时对准同一目标区射击，形成瞬间火力峰值。" },
    { unlockLevel: 5, kind: "ATTACK", slug: "iron-dragon-line-blockade", name: "长编封锁", description: "车体展开侧翼炮塔，绵延火力覆盖铁路走廊，阻断敌方机动。" },
    { unlockLevel: 7, kind: "ATTACK", slug: "iron-dragon-terminal-blitz", name: "铁龙终站", description: "全车核心供能于主炮，执行一次轨道级毁灭轰击，清场关键节点。" },
  ],
  hound: [
    { unlockLevel: 2, kind: "CONTROL", slug: "hound-lock-bite", name: "撕咬固定", description: "利齿钳制目标下肢或武器，造成持续控制并暴露其破绽。" },
    { unlockLevel: 5, kind: "ATTACK", slug: "hound-rabid-rush", name: "狂犬连扑", description: "三连扑击与尾焰推进结合，对单目标发动爆发性近距输出。" },
    { unlockLevel: 7, kind: "BUFF", slug: "hound-alpha-mark", name: "猎王号令", description: "标记猎物并引导周围友军同步集火，完成围歼与清场（叙事层）。" },
  ],
  dive: [
    { unlockLevel: 2, kind: "ATTACK", slug: "dive-ap-dart", name: "疾降穿甲", description: "加速俯冲投下单枚动能穿甲弹，贯穿装甲并毁伤关键部件。" },
    { unlockLevel: 5, kind: "ATTACK", slug: "dive-sweep-bomb", name: "掠影轰炸", description: "低空连续投弹，覆盖狭长地带，压制敌方行进纵队。" },
    { unlockLevel: 7, kind: "ATTACK", slug: "dive-sky-strike", name: "天罚俯冲", description: "自高空垂直贯穿打击核心目标，追求一击决定战局。" },
  ],
};
