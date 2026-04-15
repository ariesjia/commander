import { pinyin } from "pinyin-pro";
import {
  DRIVING_GUIDE_GENERATOR_ID,
  DRIVING_GUIDE_GENERATOR_VERSION,
  DRIVING_GUIDE_STEPS_PER_SESSION,
} from "@/lib/driving-guide/constants";
import {
  drivingGuideWordPoolFingerprint,
  resolveDrivingGuideWordPool,
} from "@/lib/driving-guide/word-pool";

export type DrivingGuideCharHint = { char: string; pinyin: string };

export type DrivingGuideStepPublic = {
  stepIndex: number;
  word: string;
  chars: DrivingGuideCharHint[];
};

export type DrivingGuideSessionSpec = {
  dateKey: string;
  steps: { word: string }[];
  meta: { generatorId: string; version: string };
};

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

function charPinyin(c: string): string {
  try {
    const out = pinyin(c, { toneType: "symbol", type: "string" });
    return String(out).trim();
  } catch {
    return "";
  }
}

function buildStepPublic(word: string, stepIndex: number): DrivingGuideStepPublic {
  const chars = [...word].map((char) => ({
    char,
    pinyin: charPinyin(char),
  }));
  return { stepIndex, word, chars };
}

/**
 * 从词库确定性抽取 5 个不重复两字词（10 字）。
 * `wordPool` 长度须 ≥ `DRIVING_GUIDE_STEPS_PER_SESSION`（由 `resolveDrivingGuideWordPool` 保证）。
 */
export function generateDrivingGuideSession(input: {
  studentId: string;
  dateKey: string;
  wordPool: readonly string[];
  /** 含默认/自定义与词表内容摘要，见 `drivingGuideWordPoolFingerprint` */
  poolFingerprint: string;
}): DrivingGuideSessionSpec {
  const seedStr = `${input.studentId}:${input.dateKey}:${DRIVING_GUIDE_GENERATOR_ID}:${DRIVING_GUIDE_GENERATOR_VERSION}:${input.poolFingerprint}`;
  const rand = mulberry32(hash32(seedStr));

  const pool = [...input.wordPool];
  const indices = pool.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [indices[i], indices[j]] = [indices[j]!, indices[i]!];
  }

  const steps = indices
    .slice(0, DRIVING_GUIDE_STEPS_PER_SESSION)
    .map((idx) => ({ word: pool[idx]! }));

  return {
    dateKey: input.dateKey,
    steps,
    meta: {
      generatorId: DRIVING_GUIDE_GENERATOR_ID,
      version: DRIVING_GUIDE_GENERATOR_VERSION,
    },
  };
}

export function sessionHash(spec: DrivingGuideSessionSpec): string {
  const payload = spec.steps.map((s) => s.word).join("|");
  return `${spec.meta.generatorId}:${spec.meta.version}:${spec.dateKey}:${payload}`;
}

export function specToPublicSteps(spec: DrivingGuideSessionSpec): DrivingGuideStepPublic[] {
  return spec.steps.map((s, i) => buildStepPublic(s.word, i));
}

/** 与 GET session / POST step 共用：同一 Json 字段 → 同一 spec */
export function buildDrivingGuideSessionForStudent(input: {
  studentId: string;
  dateKey: string;
  drivingGuideWordList: unknown;
}): DrivingGuideSessionSpec {
  const { pool, source } = resolveDrivingGuideWordPool(input.drivingGuideWordList);
  const poolFingerprint = drivingGuideWordPoolFingerprint(pool, source);
  return generateDrivingGuideSession({
    studentId: input.studentId,
    dateKey: input.dateKey,
    wordPool: pool,
    poolFingerprint,
  });
}
