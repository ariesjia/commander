import {
  DEFAULT_MAINTENANCE_GENERATOR_CONFIG,
  MAINTENANCE_MATH_GENERATOR_ID,
  MAINTENANCE_MATH_GENERATOR_VERSION,
} from "@/config/maintenance-math";
import { isValidQuestion } from "./answers";
import type {
  ArithmeticOp,
  BinaryQuestion,
  ChainQuestion,
  CompareQuestion,
  GenerateSessionInput,
  GeneratorConfig,
  MaintenanceExpression,
  MaintenanceQuestion,
  MaintenanceSessionSpec,
  MissingQuestion,
  PatternQuestion,
  WordProblemQuestion,
} from "./types";

type PoolRow = { a: number; op: ArithmeticOp; b: number };

/** 人教版一年级 P0/P1：按配置生成口算题池（过滤 +0/-0/a-a/左 0） */
function buildBinaryPool(maxNumber: number): PoolRow[] {
  const out: PoolRow[] = [];
  for (let a = 1; a <= maxNumber; a++) {
    for (let b = 1; b <= maxNumber; b++) {
      if (a + b <= maxNumber) {
        out.push({ a, op: "+", b });
      }
    }
  }
  for (let a = 1; a <= maxNumber; a++) {
    for (let b = 1; b < a; b++) {
      out.push({ a, op: "-", b });
    }
  }
  return out;
}

/**
 * 32-bit 哈希（确定性 seed）
 */
function hash32(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(rand: () => number, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

function pickOp(rand: () => number): ArithmeticOp {
  return rand() < 0.5 ? "+" : "-";
}

function evalBinary(a: number, op: ArithmeticOp, b: number): number {
  return op === "+" ? a + b : a - b;
}

function pickPoolRow(pool: PoolRow[], rand: () => number, predicate: (row: PoolRow) => boolean = () => true): PoolRow {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const row = pool[randomInt(rand, 0, pool.length - 1)]!;
    if (predicate(row)) return row;
  }
  return { a: 9, op: "+", b: 6 };
}

function generateBinary(pool: PoolRow[], rand: () => number, id: string, maxAnswer: number): BinaryQuestion {
  const row = pickPoolRow(pool, rand, (r) => evalBinary(r.a, r.op, r.b) <= maxAnswer);
  return { kind: "binary", id, ...row };
}

function generateTensBinary(rand: () => number, id: string, maxNumber: number): BinaryQuestion {
  const maxTen = Math.max(2, Math.floor(maxNumber / 10));
  for (let attempt = 0; attempt < 500; attempt++) {
    const a = randomInt(rand, 1, maxTen) * 10;
    const b = randomInt(rand, 1, maxTen) * 10;
    const op = pickOp(rand);
    const q: BinaryQuestion =
      op === "+"
        ? { kind: "binary", id, a, op, b: Math.min(b, maxNumber - a) || 10 }
        : { kind: "binary", id, a: Math.max(a, b + 10), op, b };
    if (isValidQuestion(q)) return q;
  }
  return { kind: "binary", id, a: 20, op: "+", b: 10 };
}

function generateChain(rand: () => number, id: string, length: 3 | 4, maxIntermediate: number): ChainQuestion {
  for (let attempt = 0; attempt < 3000; attempt++) {
    const nums = [randomInt(rand, 1, Math.max(2, maxIntermediate - 10))];
    const ops: ArithmeticOp[] = [];
    let acc = nums[0]!;
    for (let i = 1; i < length; i++) {
      const op = pickOp(rand);
      const maxNext = op === "+" ? Math.max(1, maxIntermediate - acc) : Math.max(1, acc - 1);
      const next = randomInt(rand, 1, Math.min(20, maxNext));
      if (op === "-" && next === acc) break;
      ops.push(op);
      nums.push(next);
      acc = evalBinary(acc, op, next);
    }
    const q: ChainQuestion = { kind: "chain", id, nums, ops };
    if (nums.length === length && isValidQuestion(q)) return q;
  }
  return { kind: "chain", id, nums: [22, 10, 5], ops: ["+", "-"] };
}

function toExpr(row: PoolRow): MaintenanceExpression {
  return { kind: "binary", ...row };
}

function generateCompare(pool: PoolRow[], rand: () => number, id: string, maxNumber: number): CompareQuestion {
  const leftRow = pickPoolRow(pool, rand);
  const left = toExpr(leftRow);
  const leftValue = evalBinary(leftRow.a, leftRow.op, leftRow.b);
  const offset = randomInt(rand, -6, 6);
  const rightValue = Math.max(0, Math.min(maxNumber, leftValue + offset));
  return {
    kind: "compare",
    id,
    left,
    right: { kind: "value", value: rightValue },
  };
}

function generateMissing(rand: () => number, id: string, maxNumber: number, preferredOp?: ArithmeticOp): MissingQuestion {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const op = preferredOp ?? pickOp(rand);
    const a = op === "+" ? randomInt(rand, 1, Math.max(2, maxNumber - 10)) : randomInt(rand, 2, maxNumber);
    const missing = op === "+" ? randomInt(rand, 1, maxNumber - a) : randomInt(rand, 1, a - 1);
    const q: MissingQuestion = { kind: "missing", id, a, op, result: evalBinary(a, op, missing) };
    if (isValidQuestion(q)) return q;
  }
  return preferredOp === "-"
    ? { kind: "missing", id, a: 15, op: "-", result: 9 }
    : { kind: "missing", id, a: 16, op: "+", result: 24 };
}

const WORD_PROBLEM_NOUNS = ["能源块", "维修螺栓", "校准芯片", "装甲片", "补给箱"] as const;

function generateWordProblem(pool: PoolRow[], rand: () => number, id: string, maxNumber: number): WordProblemQuestion {
  const row = pickPoolRow(pool, rand, (r) => evalBinary(r.a, r.op, r.b) <= maxNumber);
  const noun = WORD_PROBLEM_NOUNS[randomInt(rand, 0, WORD_PROBLEM_NOUNS.length - 1)]!;
  const text =
    row.op === "+"
      ? `仓库里有 ${row.a} 个${noun}，又送来 ${row.b} 个，现在一共有多少个？`
      : `仓库里有 ${row.a} 个${noun}，维修用掉 ${row.b} 个，还剩多少个？`;
  return { kind: "wordProblem", id, text, expression: { kind: "binary", ...row } };
}

function generatePattern(rand: () => number, id: string, maxNumber: number): PatternQuestion {
  for (let attempt = 0; attempt < 500; attempt++) {
    const step = randomInt(rand, 2, Math.min(10, Math.max(2, Math.floor(maxNumber / 8))));
    const start = randomInt(rand, 1, maxNumber - step * 4);
    const missingIndex = randomInt(rand, 1, 3);
    const sequence = Array.from({ length: 5 }, (_, i) => start + step * i) as Array<number | null>;
    sequence[missingIndex] = null;
    const q: PatternQuestion = { kind: "pattern", id, sequence, step };
    if (isValidQuestion(q)) return q;
  }
  return { kind: "pattern", id, sequence: [5, 10, null, 20, 25], step: 5 };
}

function createQuestionFactories(rand: () => number, dateKey: string, config: GeneratorConfig) {
  let slot = 0;
  const nextId = (kind: string) => `${dateKey}-${kind}-${slot++}`;
  const maxNumber = Math.max(20, config.maxNumber);
  const maxIntermediate = Math.max(20, config.maxIntermediate);
  const pool = buildBinaryPool(maxNumber);
  return [
    () => generateBinary(pool, rand, nextId("b20"), Math.min(20, maxNumber)),
    () => generateBinary(pool, rand, nextId("bmax"), maxNumber),
    () => generateTensBinary(rand, nextId("bt"), maxNumber),
    () => generateChain(rand, nextId("c3"), 3, maxIntermediate),
    () => generateChain(rand, nextId("c4"), 4, maxIntermediate),
    () => generateCompare(pool, rand, nextId("cmp"), maxNumber),
    () => generateMissing(rand, nextId("missp"), maxNumber, "+"),
    () => generateMissing(rand, nextId("missm"), maxNumber, "-"),
    () => generateWordProblem(pool, rand, nextId("word"), maxNumber),
    () => generatePattern(rand, nextId("pat"), maxNumber),
  ];
}

/**
 * 同 studentId + dateKey + generator 版本 → 同一题目序列
 *
 * 默认 10 题覆盖人教版一年级 P0/P1：20/100 以内加减、连加减、比大小、填空、应用题、找规律。
 */
export function generateGrade1Session(input: GenerateSessionInput): MaintenanceSessionSpec {
  const config = {
    ...DEFAULT_MAINTENANCE_GENERATOR_CONFIG,
    ...input.config,
  };
  const seedStr = `${input.studentId}|${input.dateKey}|${MAINTENANCE_MATH_GENERATOR_ID}|${MAINTENANCE_MATH_GENERATOR_VERSION}`;
  const seed = hash32(seedStr);
  const rand = mulberry32(seed);

  const questions: MaintenanceQuestion[] = [];
  const factories = createQuestionFactories(rand, input.dateKey, config);
  const n = Math.max(1, config.questionCount);

  for (let i = 0; i < n; i++) {
    const factory = factories[i % factories.length]!;
    const q = factory();
    if (!isValidQuestion(q)) {
      throw new Error(`Invalid maintenance question generated: ${JSON.stringify(q)}`);
    }
    questions.push(q);
  }

  return {
    dateKey: input.dateKey,
    questions,
    meta: {
      generatorId: MAINTENANCE_MATH_GENERATOR_ID,
      version: MAINTENANCE_MATH_GENERATOR_VERSION,
    },
  };
}

export function sessionHash(spec: MaintenanceSessionSpec): string {
  const payload = JSON.stringify(spec.questions);

  return `${spec.meta.generatorId}:${spec.meta.version}:${spec.dateKey}:${payload}`;
}
