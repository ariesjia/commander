import { DRIVING_GUIDE_WORDS } from "@/config/driving-guide-words";
import { DRIVING_GUIDE_STEPS_PER_SESSION } from "@/lib/driving-guide/constants";

/** 两字中文词语（与驾驶指南整词手写一致） */
const TWO_CHAR_HANZI = /^[\u4e00-\u9fff]{2}$/;

function isValidWord(w: string): boolean {
  return TWO_CHAR_HANZI.test(w);
}

function parseTokensFromText(text: string): string[] {
  return text
    .split(/[\s,，、;；\n\r]+/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 从家长输入（多行/逗号分隔的原始字符串）解析为候选词 */
export function parseDrivingGuideWordListText(text: string): string[] {
  return parseTokensFromText(text);
}

/**
 * 规范化并校验将写入 DB 的词表。
 * - 空输入 → `value: null`（使用默认词库）
 * - 非空 → 至少 `DRIVING_GUIDE_STEPS_PER_SESSION` 个不重复的两字词
 */
export function normalizeAndValidateWordListForSave(input: {
  words?: unknown;
  text?: unknown;
}):
  | { ok: true; value: string[] | null }
  | { ok: false; errors: string[] } {
  let raw: string[] = [];

  if (Array.isArray(input.words)) {
    raw = input.words.map((w) => String(w).trim()).filter(Boolean);
  } else if (typeof input.text === "string") {
    raw = parseDrivingGuideWordListText(input.text);
  } else if (input.words !== undefined || input.text !== undefined) {
    return { ok: false, errors: ["请使用 words 数组或 text 字符串提交"] };
  }

  if (raw.length === 0) {
    return { ok: true, value: null };
  }

  const seen = new Set<string>();
  const normalized: string[] = [];
  const invalid: string[] = [];

  for (const w of raw) {
    if (seen.has(w)) continue;
    seen.add(w);
    if (!isValidWord(w)) {
      invalid.push(w);
      continue;
    }
    normalized.push(w);
  }

  if (invalid.length > 0) {
    return {
      ok: false,
      errors: [
        `以下须为不重复的两字中文词语：${invalid.slice(0, 8).join("、")}${invalid.length > 8 ? "…" : ""}`,
      ],
    };
  }

  if (normalized.length < DRIVING_GUIDE_STEPS_PER_SESSION) {
    return {
      ok: false,
      errors: [
        `至少需要 ${DRIVING_GUIDE_STEPS_PER_SESSION} 个不重复的两字词，当前有效 ${normalized.length} 个`,
      ],
    };
  }

  return { ok: true, value: normalized };
}

function jsonToStringArray(json: unknown): string[] | null {
  if (json == null) return null;
  if (!Array.isArray(json)) return null;
  const out: string[] = [];
  for (const item of json) {
    if (typeof item !== "string") return null;
    const t = item.trim();
    if (t) out.push(t);
  }
  return out;
}

/**
 * 从 DB Json 字段解析出自定义词；过滤出合法两字词、去重保序。
 */
export function parseStoredDrivingGuideWordList(json: unknown): string[] {
  const arr = jsonToStringArray(json);
  if (!arr?.length) return [];

  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of arr) {
    if (!isValidWord(w) || seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  return out;
}

export type DrivingGuidePoolSource = "default" | "custom";

/**
 * 决定当日出题用池：自定义合法且数量足够则用自定义，否则回退默认词库。
 */
export function resolveDrivingGuideWordPool(json: unknown): {
  pool: string[];
  source: DrivingGuidePoolSource;
} {
  const custom = parseStoredDrivingGuideWordList(json);
  if (custom.length >= DRIVING_GUIDE_STEPS_PER_SESSION) {
    return { pool: custom, source: "custom" };
  }
  return {
    pool: [...DRIVING_GUIDE_WORDS],
    source: "default",
  };
}

/**
 * 拼入 session seed，使不同词池/默认与自定义抽题与 hash 可区分。
 */
export function drivingGuideWordPoolFingerprint(
  pool: string[],
  source: DrivingGuidePoolSource,
): string {
  if (source === "default") {
    return `default:${[...DRIVING_GUIDE_WORDS].sort().join("|")}`;
  }
  return `custom:${[...pool].sort().join("|")}`;
}
