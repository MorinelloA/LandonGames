// Math Bubbles follows Landon's IEP math goal: sums within 10 then 20,
// differences within 20, from a field of 2 then 3 answers. The narrator
// can read every problem out.
import test from "node:test";
import assert from "node:assert/strict";
import { seeded } from "../helpers.mjs";
import { MAX_LEVEL, bubbleCount, levelMax, generate, choices } from "../../js/logic/math.js";
import { allLines, readProblem } from "../../js/logic/lines.js";

const OPS = { 1: ["+"], 2: ["+"], 3: ["+", "−"], 4: ["+", "−"], 5: ["+", "−"], 6: ["+", "−", "×"] };

test("the answer field matches the IEP ladder", () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(bubbleCount), [2, 3, 3, 3, 4, 4]);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(levelMax), [10, 10, 10, 20, 20, 30]);
});

test("every problem stays inside its level", () => {
  const rand = seeded(7);
  for (let level = 1; level <= MAX_LEVEL; level++) {
    const seen = new Set();
    for (let i = 0; i < 5000; i++) {
      const p = generate(level, rand);
      seen.add(p.op);
      assert.ok(OPS[level].includes(p.op), `level ${level} made ${p.op}`);
      assert.ok(p.a >= 1 && p.b >= 1, `operands start at 1: ${p.a} ${p.op} ${p.b}`);
      const expected = p.op === "+" ? p.a + p.b : p.op === "−" ? p.a - p.b : p.a * p.b;
      assert.equal(p.answer, expected);
      assert.ok(p.answer >= 0 && p.answer <= levelMax(level), `level ${level}: ${p.a} ${p.op} ${p.b} = ${p.answer}`);
      if (p.op === "×") assert.ok(p.a <= 5 && p.b <= 5);
    }
    assert.deepEqual([...seen].sort(), [...OPS[level]].sort(), `level ${level} uses all its operations`);
  }
});

test("the narrator reads a problem in the order it's written", () => {
  assert.deepEqual(readProblem({ a: 3, op: "+", b: 4 }), ["3", "plus", "4", "equals what?"]);
  assert.deepEqual(readProblem({ a: 9, op: "−", b: 3 }), ["9", "minus", "3", "equals what?"]);
  assert.deepEqual(readProblem({ a: 4, op: "×", b: 5 }), ["4", "times", "5", "equals what?"]);
});

test("every problem, at every level, is read with lines the narrator has", () => {
  const recorded = new Set(allLines());
  const rand = seeded(13);
  for (let level = 1; level <= MAX_LEVEL; level++) {
    for (let i = 0; i < 5000; i++) {
      const p = generate(level, rand);
      for (const line of readProblem(p)) assert.ok(recorded.has(line), `level ${level}: ${p.a} ${p.op} ${p.b} says "${line}"`);
    }
  }
});

test("the bubbles are distinct, include the answer, and never give it away", () => {
  const rand = seeded(11);
  for (let level = 1; level <= MAX_LEVEL; level++) {
    for (let i = 0; i < 5000; i++) {
      const p = generate(level, rand);
      const c = choices(p, level, rand);
      assert.equal(c.length, bubbleCount(level));
      assert.equal(new Set(c).size, c.length, `duplicate bubble in ${c}`);
      assert.ok(c.includes(p.answer));
      for (const v of c) assert.ok(v >= 0 && v <= levelMax(level), `level ${level} offered ${v}`);
    }
  }
});
