/** 基准分选项：0.1（细粒度）、1（默认）、10（粗粒度） */
export type BaseScore = 0.1 | 1 | 10;

export const BASE_SCORE_OPTIONS: BaseScore[] = [0.1, 1, 10];

/** 数据库值（以1分为单位）转为显示值，避免浮点精度问题（如 0.30000000000000004） */
export function toDisplay(dbValue: number, baseScore: BaseScore): number {
  const raw = dbValue * baseScore;
  if (baseScore === 0.1) {
    return Math.round(raw * 10) / 10;
  }
  return Math.round(raw);
}

/** 显示值转为数据库值（以1分为单位） */
export function toDb(displayValue: number, baseScore: BaseScore): number {
  return Math.round(displayValue / baseScore);
}

/** 获取任务确认滑条的 step 属性 */
export function getSliderStep(baseScore: BaseScore): number {
  return baseScore === 1 ? 0.1 : baseScore;
}
