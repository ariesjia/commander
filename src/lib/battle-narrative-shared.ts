/** 战报文案与随机池（无 React / 无 window，服务端与客户端共用） */

export const PLAYER_ACTIONS = [
  "光束步枪 射击！",
  "军刀斩击！",
  "副武装 连射！",
  "推进器突进！",
  "火神炮牵制！",
  "浮游炮 齐射！",
  "盾击冲撞！",
  "霰弹近炸！",
  "回旋踢与肘击！",
  "肩炮点射！",
  "磁轨钉刺！",
  "导弹巢 扇面覆盖！",
  "粒子军刀 上段斩！",
  "膝撞与抓投！",
  "冷却槽全开的全力齐射！",
  "侧向滑步后的迎头痛击！",
  "诱敌深入后的反击！",
];

export const ENEMY_ACTIONS = [
  "电热鞭扫击！",
  "火箭筒反击！",
  "三连射！",
  "冲撞！",
  "米加粒子炮 蓄力射击！",
  "飞弹诱导 夹击！",
  "链锯横扫！",
  "压顶重砸！",
  "扩散光束！",
  "爪刃连刺！",
  "尾刃甩击！",
  "肩炮速射！",
  "烟幕里突然的近身！",
  "浮游单元 骚扰射击！",
  "地脉共振 震波！",
  "龙颚般的钳咬！",
];

export const PLAYER_HIT_EXTRAS = [
  "，打得特别准！",
  "，对手装甲上爆出火花！",
  "，对手被震得往后退！",
  "，读数一下子跳了一大截！",
  "，对手姿态有点乱了！",
  "，对手侧甲凹下去一块！",
];

export const PLAYER_HIT_EXTRAS_CRIT = [
  "，是特别猛的一击！",
  "，对手差点被掀翻！",
  "，屏幕上都闪光了！",
  "，连地面都跟着震了一下！",
  "，对手武器都握不稳了！",
];

export const ENEMY_HIT_SITUATIONS = [
  "",
  "侧翼来袭",
  "正上方",
  "烟幕里突然",
  "读数突然飙红",
  "雷达上多了好几个红点",
  "距离一下子被压到很近",
  "我们刚换弹的空档",
];

export const ENEMY_OPENING_SITUATIONS = ["抢先动手", "趁我们还没站稳", "来势汹汹", "第一波就压上来"];

export const WIN_PRE_DODGE_TENSION = [
  "【战场】对方火控描边跳动，像在找下一次窗口。",
  "【战场】读数暂时平稳，但推进剂与电容都在嗡嗡作响。",
  "【战场】尘土与残片被气流卷起，视野忽明忽暗。",
];

export const LOSE_PRE_DODGE_TENSION = [
  "【战场】我们抢先拉近距离，但对方的姿态异常稳定。",
  "【战场】HUD 提示新一轮接敌，双方都在等半秒先手。",
  "【战场】履带与关节同时作响，像同时扣在扳机边缘。",
];

export const COMBAT_ATMOSPHERE_LINES = [
  "推进器预热完毕，关节液压正常。",
  "火控锁定目标，弹匣上膛。",
  "护盾展开，姿态控制切换到战斗模式。",
  "雷达噪声有点大……但目标轮廓已经清晰。",
  "座舱里只剩下自己的呼吸和警报的滴答声。",
  "侧风不小，机体微微晃动，但准星稳稳咬住对方。",
];

export const BATTLE_START_LINES = [
  "战斗开始啦！",
  "交火！",
  "双方开始交火！",
  "第一回合！",
  "来吧，别留情！",
];

export const CLOSING_VOICE_WIN = [
  "任务完成，敌机击坠。",
  "目标沉默，可以收队了。",
  "敌机信号消失，我们赢了。",
  "威胁解除，干得漂亮。",
];

export const CLOSING_VOICE_LOSE = [
  "警告，机体大破。",
  "损伤过大，先撤！",
  "座机严重受损，请尽快脱离！",
  "操纵困难，优先保全驾驶员！",
];

export function randomPick<T>(arr: readonly T[], random: () => number = Math.random): T {
  return arr[Math.floor(random() * arr.length)]!;
}

export function randomPlayerDodgeLine(enemyAttack: string, random: () => number = Math.random): string {
  const atk = enemyAttack;
  return randomPick(
    [
      `【我方】${atk}擦身而过，我们惊险闪避！`,
      `【我方】急推操纵杆横向滑移，${atk}只打中了空处！`,
      `【我方】${atk}来了，我们侧向滑步躲开！`,
      `【我方】${atk}被我们看穿了，提前闪开！`,
      `【我方】${atk}掠过装甲外侧，好险！`,
      `【我方】${atk}贴着座舱盖飞过，我们低头躲过！`,
      `【我方】推进器短点喷射，${atk}从脚下扫空！`,
      `【我方】${atk}在掩体上炸开，我们已先一步撤出！`,
    ],
    random,
  );
}

export function randomEnemyDodgeLine(ourAttack: string, random: () => number = Math.random): string {
  const ours = ourAttack.trim() || randomPick(PLAYER_ACTIONS, random);
  return randomPick(
    [
      `【敌方】${ours}被闪掉了，对方溜得很快！`,
      `【敌方】${ours}落空，对方侧向滑移躲开了！`,
      `【敌方】${ours}只打中残影，对方已经换位！`,
      `【敌方】${ours}差一点点，对方急退避开了！`,
      `【敌方】对方急退加翻滚，${ours}没打中！`,
      `【敌方】${ours}打在空处，对方像泥鳅一样滑走了！`,
      `【敌方】对方预判了我们的弹道，${ours}被躲开了！`,
      `【敌方】${ours}掠过，对方缩进掩体后沿！`,
    ],
    random,
  );
}

export function randomEnemyAttackLabel(
  skills: readonly string[],
  random: () => number = Math.random,
): string {
  const list = skills.map((s) => s.trim()).filter(Boolean);
  if (list.length > 0) return randomPick(list, random);
  return randomPick(ENEMY_ACTIONS, random);
}

export function randomFinishWinLine(random: () => number = Math.random): string {
  const a = randomPick(PLAYER_ACTIONS, random);
  return randomPick(
    [
      `【我方】${a}使出终结一击，敌人被击落啦！`,
      `【我方】${a}最后一击命中要害，敌人被击落啦！`,
      `【我方】${a}补上关键一击，敌机被击落啦！`,
      `【我方】${a}终结连段，敌机坠落！`,
    ],
    random,
  );
}

export function randomFinishLoseLine(enemyAttack: string, random: () => number = Math.random): string {
  const a = enemyAttack;
  return randomPick(
    [
      `【敌方】${a}使出致命一击，我们遭到重创！`,
      `【敌方】${a}致命一击落下，我们遭到重创！`,
      `【敌方】${a}抓住破绽，我们遭到重创！`,
      `【敌方】${a}重击破甲，我们遭到重创！`,
    ],
    random,
  );
}

export function battleLinePlayerHit(action: string, enemyLostHp: number, extra = "") {
  return `【我方】${action}打中啦，敌人少了${enemyLostHp}点体力${extra}`;
}

export function battleLineEnemyHit(action: string, weLostHp: number, situation = "") {
  const lead = situation ? `${situation}，` : "";
  return `【敌方】${action}${lead}我们少了${weLostHp}点体力`;
}
