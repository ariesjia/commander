/** 单次运算（一步「检修」） */
export type ArithmeticOp = "+" | "-";

/** 两数一步（a op b） */
export type BinaryQuestion = {
  kind: "binary";
  id: string;
  a: number;
  op: ArithmeticOp;
  b: number;
};

/**
 * 连加减（从左到右）：nums 与 ops 交替，如 nums=[1,2,3], ops=["+","-"] → (1+2)-3
 */
export type ChainQuestion = {
  kind: "chain";
  id: string;
  nums: number[];
  ops: ArithmeticOp[];
};

export type MaintenanceQuestion = BinaryQuestion | ChainQuestion;

/** @deprecated 使用 BinaryQuestion */
export type ArithmeticQuestion = BinaryQuestion;

export type MaintenanceSessionSpec = {
  dateKey: string;
  questions: MaintenanceQuestion[];
  meta: { generatorId: string; version: string };
};

export type GeneratorConfig = {
  /** 每日题量 */
  questionCount: number;
  /** 加法结果上限（含） */
  maxSum: number;
};

export type GenerateSessionInput = {
  studentId: string;
  dateKey: string;
  config: GeneratorConfig;
};
