/** 首期词库：两字词，单次会话抽 5 词共 10 字（见 driving-guide session） */
export const DRIVING_GUIDE_WORDS = [
  "讲话",
  "请将",
  "心思",
  "才思",
  "床头",
  "床上",
  "前方",
  "前后",
  "土地",
  "大地",
  "故乡",
  "乡下",
  "红色",
  "月色",
  "火把",
  "把手",
  "花样",
  "一样",
  "可笑",
  "再见",
] as const;

export type DrivingGuideWord = (typeof DRIVING_GUIDE_WORDS)[number];
