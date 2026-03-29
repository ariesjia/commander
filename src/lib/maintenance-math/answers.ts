import type { ArithmeticOp, MaintenanceQuestion } from "./types";

function applyStep(acc: number, op: ArithmeticOp, n: number): number {
  return op === "+" ? acc + n : acc - n;
}

/** 从左到右计算连加减 */
export function evaluateChain(nums: number[], ops: ArithmeticOp[]): number {
  let acc = nums[0]!;
  for (let i = 0; i < ops.length; i++) {
    acc = applyStep(acc, ops[i]!, nums[i + 1]!);
  }
  return acc;
}

export function expectedAnswer(q: MaintenanceQuestion): number {
  if (q.kind === "binary") {
    return q.op === "+" ? q.a + q.b : q.a - q.b;
  }
  return evaluateChain(q.nums, q.ops);
}

export function isValidQuestion(q: MaintenanceQuestion): boolean {
  if (q.kind === "binary") {
    if (!Number.isInteger(q.a) || !Number.isInteger(q.b)) return false;
    if (q.a < 0 || q.b < 0) return false;
    if (q.op === "+") {
      return q.a + q.b <= 20;
    }
    return q.a - q.b >= 0 && q.a <= 20;
  }
  const { nums, ops } = q;
  if (nums.length !== ops.length + 1) return false;
  if (nums.length < 3 || nums.length > 5) return false;
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 20)) return false;
  if (ops.some((o) => o !== "+" && o !== "-")) return false;
  let acc = nums[0]!;
  for (let i = 0; i < ops.length; i++) {
    acc = applyStep(acc, ops[i]!, nums[i + 1]!);
    if (acc < 0 || acc > 20) return false;
  }
  return true;
}
