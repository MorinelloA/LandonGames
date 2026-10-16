// Sort It must never offer a right answer as a wrong one: picking it would
// earn the freeze for a correct answer.
import test from "node:test";
import assert from "node:assert/strict";
import { seeded } from "../helpers.mjs";
import { CLASSES, FUNCTIONS, FUNCTION_DISTRACTORS, FEATURES, MODES, makeRound } from "../../js/logic/sortit.js";

test("exactly one of the three choices answers the prompt, in every mode", () => {
  const rand = seeded(5);
  for (const mode of MODES) {
    for (let i = 0; i < 10000; i++) {
      const r = makeRound(mode, rand);
      assert.equal(r.choices.length, 3, `${r.prompt}: ${r.choices}`);
      assert.equal(new Set(r.choices).size, 3, `${r.prompt}: ${r.choices}`);
      assert.ok(r.answers.includes(r.correct));
      const right = r.choices.filter((c) => r.answers.includes(c));
      assert.deepEqual(right, [r.correct], `${r.prompt}: ${r.choices}`);
    }
  }
});

test("no thing belongs to two classes", () => {
  const all = Object.values(CLASSES).flat();
  assert.equal(new Set(all).size, all.length);
});

test("no function distractor answers any function question", () => {
  const answers = FUNCTIONS.flatMap((f) => [...f.correct, ...f.maybe]);
  for (const d of FUNCTION_DISTRACTORS) assert.ok(!answers.includes(d), d);
});

test("features pair up with their opposites", () => {
  for (const f of FEATURES) {
    const o = FEATURES.find((x) => x.name === f.opposite);
    assert.ok(o, `${f.name} has an opposite`);
    assert.equal(o.opposite, f.name);
    for (const item of f.items) assert.ok(!o.items.includes(item), `${item} is both ${f.name} and ${o.name}`);
  }
});

test("every thing Sort It can show has a picture", async () => {
  const { ICONS } = await import("../../js/art/icons.js");
  const shown = [
    ...Object.values(CLASSES).flat(),
    ...FUNCTIONS.flatMap((f) => f.correct),
    ...FUNCTION_DISTRACTORS,
    ...FEATURES.flatMap((f) => f.items),
  ];
  for (const id of shown) assert.ok(id in ICONS, `no icon for ${id}`);
});
