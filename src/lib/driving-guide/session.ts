import { pinyin } from "pinyin-pro";
import {
  DRIVING_GUIDE_WORDS,
  type DrivingGuideWord,
} from "@/config/driving-guide-words";
import {
  DRIVING_GUIDE_GENERATOR_ID,
  DRIVING_GUIDE_GENERATOR_VERSION,
  DRIVING_GUIDE_STEPS_PER_SESSION,
} from "@/lib/driving-guide/constants";

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
 * 从词库确定性抽取 5 个不重复两字词（10 字）
 */
export function generateDrivingGuideSession(input: {
  studentId: string;
  dateKey: string;
}): DrivingGuideSessionSpec {
  const seedStr = `${input.studentId}:${input.dateKey}:${DRIVING_GUIDE_GENERATOR_ID}:${DRIVING_GUIDE_GENERATOR_VERSION}`;
  const rand = mulberry32(hash32(seedStr));

  const pool = [...DRIVING_GUIDE_WORDS] as DrivingGuideWord[];
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
