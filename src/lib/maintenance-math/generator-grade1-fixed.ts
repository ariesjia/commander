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
  GenerateSessionInput,
  MaintenanceQuestion,
  MaintenanceSessionSpec,
} from "./types";

type PoolRow = { a: number; op: ArithmeticOp; b: number };

/** 一年级 20 以内加减法题池（固定列表，由确定性抽样取用） */
const GRADE1_POOL: PoolRow[] = (() => {
  const out: PoolRow[] = [];
  for (let a = 0; a <= 20; a++) {
    for (let b = 0; b <= 20; b++) {
      if (a + b <= 20) {
        out.push({ a, op: "+", b });
      }
    }
  }
  for (let a = 0; a <= 20; a++) {
    for (let b = 0; b <= a; b++) {
      out.push({ a, op: "-", b });
    }
  }
  return out;
})();

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

function generateChain3(rand: () => number, id: string): ChainQuestion {
  for (let attempt = 0; attempt < 800; attempt++) {
    const nums = [randomInt(rand, 0, 20), randomInt(rand, 0, 20), randomInt(rand, 0, 20)];
    const ops: ArithmeticOp[] = [pickOp(rand), pickOp(rand)];
    const q: ChainQuestion = { kind: "chain", id: "_", nums, ops };
    if (isValidQuestion(q)) {
      return { kind: "chain", id, nums, ops };
    }
  }
  return { kind: "chain", id, nums: [1, 2, 3], ops: ["+", "+"] };
}

function generateChain4(rand: () => number, id: string): ChainQuestion {
  for (let attempt = 0; attempt < 1200; attempt++) {
    const nums = [
      randomInt(rand, 0, 20),
      randomInt(rand, 0, 20),
      randomInt(rand, 0, 20),
      randomInt(rand, 0, 20),
    ];
    const ops: ArithmeticOp[] = [pickOp(rand), pickOp(rand), pickOp(rand)];
    const q: ChainQuestion = { kind: "chain", id: "_", nums, ops };
    if (isValidQuestion(q)) {
      return { kind: "chain", id, nums, ops };
    }
  }
  return { kind: "chain", id, nums: [1, 2, 3, 4], ops: ["+", "+", "+"] };
}

function generateChain5(rand: () => number, id: string): ChainQuestion {
  for (let attempt = 0; attempt < 2000; attempt++) {
    const nums = [
      randomInt(rand, 0, 20),
      randomInt(rand, 0, 20),
      randomInt(rand, 0, 20),
      randomInt(rand, 0, 20),
      randomInt(rand, 0, 20),
    ];
    const ops: ArithmeticOp[] = [pickOp(rand), pickOp(rand), pickOp(rand), pickOp(rand)];
    const q: ChainQuestion = { kind: "chain", id: "_", nums, ops };
    if (isValidQuestion(q)) {
      return { kind: "chain", id, nums, ops };
    }
  }
  return { kind: "chain", id, nums: [1, 2, 3, 4, 5], ops: ["+", "+", "+", "+"] };
}

/** 题量 ≥6 时：3 道三数连算 + 2 道四数 + 1 道五数；3≤题量&lt;6 时沿用 2×三数 + 1×四数 */
const CHAIN_SLOTS_FULL = 6;
const CHAIN_SLOTS_LEGACY = 3;

/**
 * 同 studentId + dateKey + generator 版本 → 同一题目序列
 *
 * 默认 10 题（题量≥6）：4 道两数一步 + 3 道三数连加减 + 2 道四数连加减 + 1 道五数连加减（从左到右，中间结果 0–20）。
 * 题量 &lt; 3 时仅两数题；3≤题量&lt;6 时 3 道连算位（2×三数 + 1×四数），其余两数题。
 */
export function generateGrade1Session(input: GenerateSessionInput): MaintenanceSessionSpec {
  const config = {
    ...DEFAULT_MAINTENANCE_GENERATOR_CONFIG,
    ...input.config,
  };
  const seedStr = `${input.studentId}|${input.dateKey}|${MAINTENANCE_MATH_GENERATOR_ID}|${MAINTENANCE_MATH_GENERATOR_VERSION}`;
  const seed = hash32(seedStr);
  const rand = mulberry32(seed);

  const maxTotal = GRADE1_POOL.length + CHAIN_SLOTS_FULL;
  const n = Math.min(config.questionCount, maxTotal);
  const wantChains = n >= 3;
  const chainSlots = wantChains && n >= CHAIN_SLOTS_FULL ? CHAIN_SLOTS_FULL : wantChains ? CHAIN_SLOTS_LEGACY : 0;
  const binaryCount = wantChains ? n - chainSlots : n;

  const indices: number[] = [];
  for (let i = 0; i < GRADE1_POOL.length; i++) indices.push(i);

  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [indices[i], indices[j]] = [indices[j]!, indices[i]!];
  }

  const questions: MaintenanceQuestion[] = [];
  let slot = 0;

  const takeBinary = (row: PoolRow): BinaryQuestion => ({
    kind: "binary",
    id: `${input.dateKey}-b-${slot++}`,
    a: row.a,
    op: row.op,
    b: row.b,
  });

  for (let k = 0; k < binaryCount; k++) {
    const raw = GRADE1_POOL[indices[k]!]!;
    questions.push(takeBinary(raw));
  }

  if (wantChains) {
    if (chainSlots === CHAIN_SLOTS_FULL) {
      questions.push(generateChain3(rand, `${input.dateKey}-c3-${slot++}`));
      questions.push(generateChain3(rand, `${input.dateKey}-c3-${slot++}`));
      questions.push(generateChain3(rand, `${input.dateKey}-c3-${slot++}`));
      questions.push(generateChain4(rand, `${input.dateKey}-c4-${slot++}`));
      questions.push(generateChain4(rand, `${input.dateKey}-c4-${slot++}`));
      questions.push(generateChain5(rand, `${input.dateKey}-c5-${slot++}`));
    } else {
      questions.push(generateChain3(rand, `${input.dateKey}-c3-${slot++}`));
      questions.push(generateChain3(rand, `${input.dateKey}-c3-${slot++}`));
      questions.push(generateChain4(rand, `${input.dateKey}-c4-${slot++}`));
    }
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
  const payload = spec.questions.map((q) => q.id).join(",");

  return `${spec.meta.generatorId}:${spec.meta.version}:${spec.dateKey}:${payload}`;
}
