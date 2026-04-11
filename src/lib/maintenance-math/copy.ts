/** 每步检修部位（循环使用，避免 UI/朗读重复「校准读数」） */
export const MAINTENANCE_STEP_FOCUS = [
  "主控仪表",
  "左臂管线",
  "右臂传感",
  "冷却回路",
  "电容电压",
  "推进剂槽",
  "关节液压",
  "火控模块",
  "护盾回路",
  "总检确认",
] as const;

function stepFocus(step1Based: number): string {
  const i = (step1Based - 1) % MAINTENANCE_STEP_FOCUS.length;
  return MAINTENANCE_STEP_FOCUS[i];
}

/** 答对本步后的短播报（轮换，避免总说「校准读数完成」） */
const STEP_READ_DONE_TTS = ["本步完成。", "读数正常。", "检修通过。", "对上了。"] as const;

/** 机甲维修叙事文案（避免「考试」「测验」） */
export const MAINTENANCE_COPY = {
  pageTitle: "机甲维修",
  stepLabel: (n: number, total: number) => `第 ${n} / ${total} 步 · ${stepFocus(n)}`,
  instruction: "输入算式结果，完成本步检修",
  wrongTryAgain: "读数波动，再试一步",
  submitAllWrong: "还有读数不对，请再试一次",
  doneTitle: "今日维修完成",
  doneBody: "核心读数已稳定，主机甲状态良好。",
  /** 完成时约 50% 额外掉落道具的展示标题 */
  doneBonusTitle: "检修补给",
  doneBonusLine: (name: string) => `获得道具「${name}」×1`,
  ttsBonusReward: (name: string) => `本次检修补给：获得道具 ${name}。`,
  disabled: "家长已关闭机甲维修，可在家长设置中开启。",
  alreadyDone: "今日工单已完成",
  loading: "加载工单…",

  /** 工单加载完成 → 需用户点击后再朗读（移动端 Speech 依赖手势） */
  readyTitle: "工单已就绪",
  readyBody:
    "点击下方按钮开始检修。首次点击会朗读开场说明：用口算结果校对机体各部位的仪表读数。",
  readyButton: "开始检修",

  /**
   * 浏览器朗读：维修开场背景（随后接第 1 步部位名 + 题目）
   * 说明口算与「校对机体各部位读数」的关系，避免像纯做题
   */
  ttsSessionStart:
    "今日维修工单开始。各部位仪表要靠算式结果来对齐读数，请你帮忙口算，校对机体各部位的数值。",
  /** 朗读不念「共几步」，界面仍用 stepLabel 显示进度 */
  ttsStepPrompt: (step: number) => `第${step}步，${stepFocus(step)}。${step === 0 ? "请说出算式结果" : ""}`,
  ttsStepReadDone: (step: number) => STEP_READ_DONE_TTS[(step - 1) % STEP_READ_DONE_TTS.length],
  ttsDone: "今日维修完成。核心读数已稳定，主机甲状态良好。",
};
