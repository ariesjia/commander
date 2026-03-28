import type { MaintenanceQuestion } from "./types";

/** 0–20 中文基数读法（一年级口算范围） */
export function numToZh(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 20) return String(n);
  if (n === 0) return "零";
  const oneToTen = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  if (n <= 10) return oneToTen[n] ?? String(n);
  if (n < 20) return "十" + ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"][n - 10];
  return "二十";
}

function opWord(op: "+" | "-"): string {
  return op === "+" ? "加" : "减";
}

/** 朗读用：「七加五等于多少？」「十二减三等于多少？」 */
function buildBinarySpeech(a: number, op: "+" | "-", b: number): string {
  return `${numToZh(a)}${opWord(op)}${numToZh(b)}等于多少？`;
}

/** 连加减朗读：「一加二加三等于多少？」 */
function buildChainSpeech(nums: number[], ops: ("+" | "-")[]): string {
  let s = numToZh(nums[0]!);
  for (let i = 0; i < ops.length; i++) {
    s += opWord(ops[i]!);
    s += numToZh(nums[i + 1]!);
  }
  return `${s}等于多少？`;
}

export function buildArithmeticSpeech(q: MaintenanceQuestion): string {
  if (q.kind === "binary") {
    return buildBinarySpeech(q.a, q.op, q.b);
  }
  return buildChainSpeech(q.nums, q.ops);
}
