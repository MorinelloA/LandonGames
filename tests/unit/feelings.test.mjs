import test from "node:test";
import assert from "node:assert/strict";
import { seeded } from "../helpers.mjs";
import { MOODS, STORIES, LEVELS, storiesFor, choicesFor, question } from "../../js/logic/feelings.js";

test("every story names its character and asks about them", () => {
  for (const s of STORIES) {
    assert.ok(["boy", "girl"].includes(s.who), s.text);
    assert.ok(s.text.includes(s.who), `"${s.text}" should name the ${s.who}`);
    assert.equal(question(s), s.who === "girl" ? "How does she feel?" : "How does he feel?");
    assert.ok(MOODS.includes(s.answer), s.text);
    for (const ok of s.alsoOk || []) {
      assert.ok(MOODS.includes(ok) && ok !== s.answer, s.text);
    }
  }
});

test("no scene shows a feeling (faces, broken hearts, crosses, party poppers)", () => {
  // the Emoticons block is all faces; the rest are feeling cues
  const cue = /[\u{1F600}-\u{1F64F}\u{1F910}-\u{1F92F}\u{1F970}-\u{1F97A}\u{1F494}\u{1F49D}\u{2764}\u{274C}\u{1F6AB}\u{1F645}\u{1F389}]/u;
  for (const s of STORIES) assert.ok(!cue.test(s.scene), `${s.text}: ${s.scene}`);
});

test("each level has at least three stories for every feeling in play", () => {
  for (let level = 1; level <= LEVELS.length; level++) {
    const stories = storiesFor(level);
    for (const mood of LEVELS[level - 1].pool) {
      const n = stories.filter((s) => s.answer === mood).length;
      assert.ok(n >= 3, `level ${level} has ${n} ${mood} stories`);
    }
  }
});

test("the choices include the answer and never another fair answer", () => {
  const rand = seeded(9);
  for (let level = 1; level <= LEVELS.length; level++) {
    const { pool, field } = LEVELS[level - 1];
    for (const s of storiesFor(level)) {
      for (let i = 0; i < 300; i++) {
        const c = choicesFor(s, level, rand);
        assert.ok(c.includes(s.answer));
        assert.equal(new Set(c).size, c.length);
        assert.ok(c.length >= 2 && c.length <= field, `${s.text} at level ${level}: ${c}`);
        for (const mood of c) assert.ok(pool.includes(mood));
        for (const ok of s.alsoOk || []) assert.ok(!c.includes(ok), `${s.text} offered ${ok}`);
      }
    }
  }
});
