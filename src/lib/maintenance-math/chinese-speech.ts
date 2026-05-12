import type { MaintenanceExpression, MaintenanceQuestion } from "./types";

/** 0–100 中文基数读法（一年级口算范围） */
export function numToZh(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 100) return String(n);
  if (n === 0) return "零";
  const oneToTen = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  if (n <= 10) return oneToTen[n] ?? String(n);
  if (n < 20) return "十" + ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"][n - 10];
  if (n === 100) return "一百";
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `${oneToTen[tens]}十${ones === 0 ? "" : oneToTen[ones]}`;
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

function buildExpressionSpeech(expr: MaintenanceExpression): string {
  if (expr.kind === "value") return numToZh(expr.value);
  return `${numToZh(expr.a)}${opWord(expr.op)}${numToZh(expr.b)}`;
}

export function buildArithmeticSpeech(q: MaintenanceQuestion): string {
  switch (q.kind) {
    case "binary":
      return buildBinarySpeech(q.a, q.op, q.b);
    case "chain":
      return buildChainSpeech(q.nums, q.ops);
    case "compare":
      return `${buildExpressionSpeech(q.left)}和${buildExpressionSpeech(q.right)}比一比，应该填大于，小于，还是等于？`;
    case "missing":
      return `${numToZh(q.a)}${opWord(q.op)}几等于${numToZh(q.result)}？`;
    case "wordProblem":
      return q.text;
    case "pattern":
      return `找规律填数：${q.sequence.map((n) => (n == null ? "几" : numToZh(n))).join("，")}。空格里应该填多少？`;
  }
}
