/**
 * 机甲维修（口算）全局参数（与 Asia/Shanghai 自然日配合 story 0007）
 */
export const MAINTENANCE_MATH_GENERATOR_ID = "grade1-renminjiaoban-p0p1-v1";

export const MAINTENANCE_MATH_GENERATOR_VERSION = "2.0.0";

export const DEFAULT_MAINTENANCE_GENERATOR_CONFIG = {
  questionCount: 10,
  maxNumber: 50,
  maxIntermediate: 50,
} as const;

/** 维修完成时额外获得随机道具的概率（0–1） */
export const MAINTENANCE_BONUS_ITEM_PROBABILITY = 0.5;
