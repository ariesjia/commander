/**
 * 运行：npx tsx scripts/verify-maintenance-math.ts
 * 验证出题器确定性与答案合法性（无 vitest 时的轻量检查）
 */
import assert from "node:assert/strict";
import { generateGrade1Session } from "../src/lib/maintenance-math/generator-grade1-fixed";
import { expectedAnswer, isValidQuestion } from "../src/lib/maintenance-math/answers";
import { DEFAULT_MAINTENANCE_GENERATOR_CONFIG } from "../src/config/maintenance-math";

const input = {
  studentId: "student_test_1",
  dateKey: "2026-03-28",
  config: { ...DEFAULT_MAINTENANCE_GENERATOR_CONFIG },
};

const a = generateGrade1Session(input);
const b = generateGrade1Session(input);
assert.deepEqual(a.questions, b.questions, "同输入应生成相同题目");

for (const q of a.questions) {
  assert.ok(isValidQuestion(q), `invalid q: ${JSON.stringify(q)}`);
  const ans = expectedAnswer(q);
  assert.ok(Number.isInteger(ans), "answer int");
  assert.ok(ans >= 0 && ans <= 20, `answer range: ${ans}`);
}

const binaries = a.questions.filter((q) => q.kind === "binary").length;
const chains3 = a.questions.filter((q) => q.kind === "chain" && q.nums.length === 3).length;
const chains4 = a.questions.filter((q) => q.kind === "chain" && q.nums.length === 4).length;
assert.equal(binaries, 7, "默认 10 题含 7 道两数一步");
assert.equal(chains3, 2, "含 2 道三数连加减");
assert.equal(chains4, 1, "含 1 道四数连加减");
assert.equal(a.questions.length, 10, "默认题量为 10");

console.log("maintenance-math verify: ok", a.questions.length, "questions");
