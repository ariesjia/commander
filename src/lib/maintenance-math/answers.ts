import type {
  ArithmeticOp,
  CompareSymbol,
  MaintenanceAnswer,
  MaintenanceExpression,
  MaintenanceQuestion,
} from "./types";

function applyStep(acc: number, op: ArithmeticOp, n: number): number {
  return op === "+" ? acc + n : acc - n;
}

function isIntInRange(n: number, min: number, max: number): boolean {
  return Number.isInteger(n) && n >= min && n <= max;
}

export function isAllowedAddSubStep(left: number, op: ArithmeticOp, right: number): boolean {
  if (!isIntInRange(left, 0, 100) || !isIntInRange(right, 0, 100)) return false;
  if (right === 0) return false;
  if (op === "-" && left === right) return false;
  return true;
}

function isValidBinarySurface(a: number, op: ArithmeticOp, b: number): boolean {
  if (a === 0) return false;
  if (!isAllowedAddSubStep(a, op, b)) return false;
  const ans = applyStep(a, op, b);
  return isIntInRange(ans, 0, 100);
}

export function evaluateExpression(expr: MaintenanceExpression): number {
  if (expr.kind === "value") return expr.value;
  return applyStep(expr.a, expr.op, expr.b);
}

function isValidExpression(expr: MaintenanceExpression): boolean {
  if (expr.kind === "value") return isIntInRange(expr.value, 0, 100);
  return isValidBinarySurface(expr.a, expr.op, expr.b);
}

/** 从左到右计算连加减 */
export function evaluateChain(nums: number[], ops: ArithmeticOp[]): number {
  let acc = nums[0]!;
  for (let i = 0; i < ops.length; i++) {
    acc = applyStep(acc, ops[i]!, nums[i + 1]!);
  }
  return acc;
}

function compareValues(left: number, right: number): CompareSymbol {
  if (left < right) return "<";
  if (left > right) return ">";
  return "=";
}

function expectedMissingAnswer(q: Extract<MaintenanceQuestion, { kind: "missing" }>): number {
  return q.op === "+" ? q.result - q.a : q.a - q.result;
}

export function expectedAnswer(q: MaintenanceQuestion): MaintenanceAnswer {
  switch (q.kind) {
    case "binary":
      return applyStep(q.a, q.op, q.b);
    case "chain":
      return evaluateChain(q.nums, q.ops);
    case "compare":
      return compareValues(evaluateExpression(q.left), evaluateExpression(q.right));
    case "missing":
      return expectedMissingAnswer(q);
    case "wordProblem":
      return evaluateExpression(q.expression);
    case "pattern": {
      const missingIndex = q.sequence.findIndex((n) => n == null);
      const first = q.sequence[0];
      return typeof first === "number" && missingIndex >= 0 ? first + q.step * missingIndex : NaN;
    }
  }
}

export function isValidQuestion(q: MaintenanceQuestion): boolean {
  if (q.kind === "binary") {
    return isValidBinarySurface(q.a, q.op, q.b);
  }

  if (q.kind === "chain") {
    const { nums, ops } = q;
    if (nums.length !== ops.length + 1) return false;
    if (nums.length < 3 || nums.length > 5) return false;
    if (nums[0] === 0) return false;
    if (nums.some((n) => !isIntInRange(n, 0, 100))) return false;
    if (ops.some((o) => o !== "+" && o !== "-")) return false;
    let acc = nums[0]!;
    for (let i = 0; i < ops.length; i++) {
      const op = ops[i]!;
      const next = nums[i + 1]!;
      if (!isAllowedAddSubStep(acc, op, next)) return false;
      acc = applyStep(acc, op, next);
      if (!isIntInRange(acc, 0, 100)) return false;
    }
    return true;
  }

  if (q.kind === "compare") {
    return isValidExpression(q.left) && isValidExpression(q.right);
  }

  if (q.kind === "missing") {
    if (q.a === 0) return false;
    if (!isIntInRange(q.a, 1, 100) || !isIntInRange(q.result, 0, 100)) return false;
    const missing = expectedMissingAnswer(q);
    if (!isIntInRange(missing, 1, 100)) return false;
    return isAllowedAddSubStep(q.a, q.op, missing) && applyStep(q.a, q.op, missing) === q.result;
  }

  if (q.kind === "wordProblem") {
    return q.text.trim().length > 0 && isValidExpression(q.expression);
  }

  const missingIndex = q.sequence.findIndex((n) => n == null);
  if (missingIndex < 0) return false;
  if (q.sequence.filter((n) => n == null).length !== 1) return false;
  if (!isIntInRange(q.step, 1, 20)) return false;
  const first = q.sequence[0];
  if (first == null || !isIntInRange(first, 1, 100)) return false;
  const answer = expectedAnswer(q);
  if (typeof answer !== "number" || !isIntInRange(answer, 0, 100)) return false;
  for (let i = 0; i < q.sequence.length; i++) {
    const expected = first + q.step * i;
    const value = q.sequence[i] ?? answer;
    if (value !== expected || !isIntInRange(value, 0, 100)) return false;
  }
  return true;
}
