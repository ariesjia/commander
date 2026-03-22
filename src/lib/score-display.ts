/** 基准分选项：0.1（细粒度）、1（默认）、10（粗粒度） */
export type BaseScore = 0.1 | 1 | 10;

export const BASE_SCORE_OPTIONS: BaseScore[] = [0.1, 1, 10];

const DISPLAY_PRECISION = 1e6;
const DB_UNIT_PRECISION = 1e8;

/** 数据库值（以1分为单位）转为显示值，避免浮点尾巴 */
export function toDisplay(dbValue: number, baseScore: BaseScore): number {
  const raw = dbValue * baseScore;
  if (baseScore === 0.1) {
    return Math.round(raw * 10) / 10;
  }
  return Math.round(raw * DISPLAY_PRECISION) / DISPLAY_PRECISION;
}

/** 显示值转为数据库值（以1分为单位），支持小数 */
export function toDb(displayValue: number, baseScore: BaseScore): number {
  const raw = displayValue / baseScore;
  return Math.round(raw * DB_UNIT_PRECISION) / DB_UNIT_PRECISION;
}

/** 获取任务确认滑条的 step 属性 */
export function getSliderStep(baseScore: BaseScore): number {
  return 0.1;
}
