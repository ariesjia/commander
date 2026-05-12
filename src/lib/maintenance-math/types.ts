/** 单次运算（一步「检修」） */
export type ArithmeticOp = "+" | "-";

export type CompareSymbol = "<" | "=" | ">";

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

/** 可在题面中展示并计算的简单表达式 */
export type MaintenanceExpression =
  | {
      kind: "value";
      value: number;
    }
  | {
      kind: "binary";
      a: number;
      op: ArithmeticOp;
      b: number;
    };

/** 比大小：左右两侧可以是数字或一步加减表达式 */
export type CompareQuestion = {
  kind: "compare";
  id: string;
  left: MaintenanceExpression;
  right: MaintenanceExpression;
};

/** 填空求未知数：未知数固定在右操作数，避免题面最左是空格 */
export type MissingQuestion = {
  kind: "missing";
  id: string;
  a: number;
  op: ArithmeticOp;
  result: number;
};

/** 一步应用题：以文字叙述包裹一步加减表达式 */
export type WordProblemQuestion = {
  kind: "wordProblem";
  id: string;
  text: string;
  expression: Extract<MaintenanceExpression, { kind: "binary" }>;
};

/** 找规律填数：sequence 中仅一个 null 表示空格 */
export type PatternQuestion = {
  kind: "pattern";
  id: string;
  sequence: Array<number | null>;
  step: number;
};

export type MaintenanceQuestion =
  | BinaryQuestion
  | ChainQuestion
  | CompareQuestion
  | MissingQuestion
  | WordProblemQuestion
  | PatternQuestion;

export type MaintenanceAnswer = number | CompareSymbol;

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
  /** 题面与答案的数字上限（含） */
  maxNumber: number;
  /** 连加减中间结果上限（含） */
  maxIntermediate: number;
};

export type GenerateSessionInput = {
  studentId: string;
  dateKey: string;
  config: GeneratorConfig;
};
