// Counting, puzzle sizes, levels and per-visit timers.
import test from "node:test";
import assert from "node:assert/strict";
import { seeded, memoryStorage } from "../helpers.mjs";
import { newTarget, answerOptions, MIN_COUNT, MAX_COUNT } from "../../js/logic/counting.js";
import { nextSize, MIN_SIZE, MAX_SIZE } from "../../js/logic/puzzle.js";
import { createLevel } from "../../js/core/levels.js";
import { later, newVisit } from "../../js/core/session.js";

test("counting rounds have 3 to 10 things and three different numbers to pick", () => {
  const rand = seeded(23);
  for (let i = 0; i < 10000; i++) {
    const target = newTarget(rand);
    assert.ok(target >= MIN_COUNT && target <= MAX_COUNT);
    const options = answerOptions(target, rand);
    assert.equal(options.length, 3);
    assert.equal(new Set(options).size, 3);
    assert.ok(options.includes(target));
    for (const n of options) assert.ok(n >= 1 && n <= 12);
  }
});

test("puzzles grow after clean solves and shrink after hard ones", () => {
  assert.equal(nextSize(2, 0), 3);
  assert.equal(nextSize(5, 1), 6);
  assert.equal(nextSize(MAX_SIZE, 0), MAX_SIZE);
  assert.equal(nextSize(3, 9), 2);
  assert.equal(nextSize(MIN_SIZE, 50), MIN_SIZE);
  assert.equal(nextSize(4, 5), 4);
});

test("a level reads, clamps and saves under its key", () => {
  const storage = memoryStorage({ "landon-math-level": "4" });
  const level = createLevel({ key: "landon-math-level", max: 6, storage });
  assert.equal(level.value, 4);
  level.up(); level.up(); level.up();
  assert.equal(level.value, 6);
  assert.equal(storage.getItem("landon-math-level"), "6");
  assert.equal(createLevel({ key: "x", max: 6, storage: memoryStorage({ x: "99" }) }).value, 6);
  assert.equal(createLevel({ key: "x", max: 6, storage: memoryStorage({ x: "junk" }) }).value, 1);
  assert.equal(createLevel({ key: "x", min: 2, max: 6, storage: memoryStorage() }).value, 2);
});

test("a level still works when storage throws (private browsing)", () => {
  const broken = { getItem() { throw new Error("no"); }, setItem() { throw new Error("no"); } };
  const level = createLevel({ key: "k", max: 3, storage: broken });
  assert.equal(level.value, 1);
  assert.equal(level.up(), 2);
});

test("a step from an old visit never fires into a new one", async () => {
  const fired = [];
  later(() => fired.push("old"), 5);
  newVisit();
  later(() => fired.push("new"), 5);
  await new Promise((r) => setTimeout(r, 30));
  assert.deepEqual(fired, ["new"]);
});
