/** 机甲维修叙事文案（避免「考试」「测验」） */
export const MAINTENANCE_COPY = {
  pageTitle: "机甲维修",
  stepLabel: (n: number, total: number) => `第 ${n} / ${total} 步 · 校准读数`,
  instruction: "输入算式结果，完成本步检修",
  wrongTryAgain: "读数波动，再试一步",
  submitAllWrong: "读数未全部校准，请再试一次",
  doneTitle: "今日维修完成",
  doneBody: "核心读数已稳定，主机甲状态良好。",
  disabled: "家长已关闭机甲维修，可在家长设置中开启。",
  alreadyDone: "今日工单已完成",
  loading: "加载工单…",

  /** 工单加载完成 → 需用户点击后再朗读（移动端 Speech 依赖手势） */
  readyTitle: "工单已就绪",
  readyBody: "点击下方按钮开始检修。首次点击会开启朗读。",
  readyButton: "开始检修",

  /** 浏览器朗读：维修叙事 + 题目（不单读算式） */
  ttsSessionStart: "今日维修工单开始。",
  /** 朗读不念「共几步」，界面仍用 stepLabel 显示进度 */
  ttsStepPrompt: (step: number) => `第${step}步。请校准读数。`,
  ttsCalibrationReadDone: "校准读数完成。",
  ttsDone: "今日维修完成。核心读数已稳定，主机甲状态良好。",
} as const;
