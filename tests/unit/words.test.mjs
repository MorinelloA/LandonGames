import test from "node:test";
import assert from "node:assert/strict";
import { seeded } from "../helpers.mjs";
import { WORDS, LEVELS, wordPool, deal, inOrder } from "../../js/logic/words.js";

test("every level has plenty of words of its lengths", () => {
  for (let level = 1; level <= LEVELS.length; level++) {
    const pool = wordPool(level);
    assert.ok(pool.length >= 8, `level ${level} has ${pool.length} words`);
    for (const w of pool) assert.ok(LEVELS[level - 1].lengths.includes(w.word.length));
  }
  assert.equal(new Set(WORDS.map((w) => w.word)).size, WORDS.length, "no word twice");
});

test("letters are never dealt already spelling the word", () => {
  const rand = seeded(3);
  for (let level = 1; level <= LEVELS.length; level++) {
    const { decoys } = LEVELS[level - 1];
    for (const { word } of wordPool(level)) {
      for (let i = 0; i < 200; i++) {
        const tiles = deal(word, decoys, rand);
        assert.ok(!inOrder(tiles, word), `${word} dealt in order: ${tiles.join("")}`);
        assert.equal(tiles.length, word.length + decoys);
        assert.deepEqual(tiles.filter((ch) => word.includes(ch)).sort(), word.split("").sort());
        const extra = tiles.filter((ch) => !word.includes(ch));
        assert.equal(extra.length, decoys);
        assert.equal(new Set(extra).size, extra.length, "decoys are all different");
      }
    }
  }
});
