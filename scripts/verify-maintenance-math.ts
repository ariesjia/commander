/**
 * 运行：npx tsx scripts/verify-maintenance-math.ts
 * 验证出题器确定性与答案合法性（无 vitest 时的轻量检查）
 */
import assert from "node:assert/strict";
import { generateGrade1Session } from "../src/lib/maintenance-math/generator-grade1-fixed";
import { evaluateExpression, expectedAnswer, isAllowedAddSubStep, isValidQuestion } from "../src/lib/maintenance-math/answers";
import { DEFAULT_MAINTENANCE_GENERATOR_CONFIG } from "../src/config/maintenance-math";
import type { MaintenanceExpression, MaintenanceQuestion } from "../src/lib/maintenance-math/types";

const input = {
  studentId: "student_test_1",
  dateKey: "2026-03-28",
  config: { ...DEFAULT_MAINTENANCE_GENERATOR_CONFIG },
};

const a = generateGrade1Session(input);
const b = generateGrade1Session(input);
assert.deepEqual(a.questions, b.questions, "同输入应生成相同题目");

function assertBinarySurface(a: number, op: "+" | "-", b: number) {
  assert.notEqual(a, 0, "题面最左数不能为 0");
  assert.ok(isAllowedAddSubStep(a, op, b), `invalid add/sub step: ${a}${op}${b}`);
}

function assertExpression(expr: MaintenanceExpression) {
  if (expr.kind === "binary") {
    assertBinarySurface(expr.a, expr.op, expr.b);
    const value = evaluateExpression(expr);
    assert.ok(value >= 0 && value <= 100, `expression range: ${value}`);
  }
}

function assertHygiene(q: MaintenanceQuestion) {
  if (q.kind === "binary") {
    assertBinarySurface(q.a, q.op, q.b);
  } else if (q.kind === "chain") {
    assert.notEqual(q.nums[0], 0, "连算最左数不能为 0");
    let acc = q.nums[0]!;
    for (let i = 0; i < q.ops.length; i++) {
      const op = q.ops[i]!;
      const next = q.nums[i + 1]!;
      assert.ok(isAllowedAddSubStep(acc, op, next), `invalid chain step: ${acc}${op}${next}`);
      acc = op === "+" ? acc + next : acc - next;
      assert.ok(acc >= 0 && acc <= 100, `chain intermediate range: ${acc}`);
    }
  } else if (q.kind === "compare") {
    assertExpression(q.left);
    assertExpression(q.right);
  } else if (q.kind === "missing") {
    assert.notEqual(q.a, 0, "填空题最左数不能为 0");
    const missing = expectedAnswer(q);
    assert.equal(typeof missing, "number", "missing answer number");
    assert.ok(isAllowedAddSubStep(q.a, q.op, missing as number), "missing hidden step hygiene");
  } else if (q.kind === "wordProblem") {
    assertExpression(q.expression);
  } else {
    assert.notEqual(q.sequence[0], 0, "规律题最左数不能为 0");
  }
}

for (const q of a.questions) {
  assert.ok(isValidQuestion(q), `invalid q: ${JSON.stringify(q)}`);
  assertHygiene(q);
  const ans = expectedAnswer(q);
  if (typeof ans === "number") {
    assert.ok(Number.isInteger(ans), "answer int");
    assert.ok(ans >= 0 && ans <= 100, `answer range: ${ans}`);
  } else {
    assert.ok(["<", "=", ">"].includes(ans), `compare answer: ${ans}`);
  }
}

const binaries = a.questions.filter((q) => q.kind === "binary").length;
const chains3 = a.questions.filter((q) => q.kind === "chain" && q.nums.length === 3).length;
const chains4 = a.questions.filter((q) => q.kind === "chain" && q.nums.length === 4).length;
const compares = a.questions.filter((q) => q.kind === "compare").length;
const missings = a.questions.filter((q) => q.kind === "missing").length;
const words = a.questions.filter((q) => q.kind === "wordProblem").length;
const patterns = a.questions.filter((q) => q.kind === "pattern").length;
assert.equal(binaries, 3, "默认 10 题含 3 道两数一步");
assert.equal(chains3, 1, "含 1 道三数连加减");
assert.equal(chains4, 1, "含 1 道四数连加减");
assert.equal(compares, 1, "含 1 道比大小");
assert.equal(missings, 2, "含 2 道填空");
assert.equal(words, 1, "含 1 道应用题");
assert.equal(patterns, 1, "含 1 道找规律");
assert.equal(a.questions.length, 10, "默认题量为 10");

console.log("maintenance-math verify: ok", a.questions.length, "questions");
