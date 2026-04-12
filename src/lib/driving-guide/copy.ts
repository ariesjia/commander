/** 与维修叙事区分：驾驶舱 / 识字校准 */

export const DRIVING_GUIDE_COPY = {
  pageTitle: "驾驶指南",
  /**
   * 准备页：与「每日维修」工单页同构——先说明为何要练、与机甲叙事的关系，再提示点击后朗读。
   * 不在这里贴逐步操作细则（细则在朗读里）。
   */
  readyTitle: "指南已就绪",
  readyBody:
    "点击下方按钮开始。首次点击会朗读开场说明：识字手写是驾驶舱出舱前的字形校准，让控制台能辨认你的指令笔迹，与机体同步。接下来请按拼音在感应区书写。",
  /**
   * 点击「开始」后朗读（不显示在页面上）；衔接叙事 + 操作提示。
   */
  readyIntroNarration:
    "今日驾驶指南开始。识字校准能让驾驶舱确认你的字形与指令一致。请看拼音，在手写区写出词语。写对会有鼓励，再试一次也没关系。请专注看拼音与书写。",
  readyButton: "开始",
  readyListening: "聆听说明中…",
  progressLabel: (current: number, total: number) => `第 ${current}/${total} 词`,
  clear: "清除",
  submit: "提交",
  loading: "识别中…",
  doneTitle: "今日校准完成",
  doneBody: "控制台词条已确认，明天再来巩固吧。",
  backHome: "返回首页",
} as const;

export const SUCCESS_ENCOURAGEMENT_LINES = [
  "写得漂亮，继续保持！",
  "校准通过，推进下一项！",
  "笔迹清晰，读数稳定！",
  "很好，这一条过了！",
  "干得不错，驾驶舱为你亮灯！",
] as const;

export const FAILURE_HINT_LINES = [
  "再试一次，尽量写大一点、工整一点。",
  "没识别准，擦掉重来也可以。",
  "对照拼音再写一遍试试。",
  "笔画可以再清楚一点哦。",
] as const;

export function randomSuccessLine(): string {
  const i = Math.floor(Math.random() * SUCCESS_ENCOURAGEMENT_LINES.length);
  return SUCCESS_ENCOURAGEMENT_LINES[i]!;
}

export function randomFailureLine(): string {
  const i = Math.floor(Math.random() * FAILURE_HINT_LINES.length);
  return FAILURE_HINT_LINES[i]!;
}
