import test from "node:test";
import assert from "node:assert/strict";
import { seeded } from "../helpers.mjs";
import { cutEdges } from "../../js/logic/jigsaw.js";
import { piecePath, MARGIN } from "../../js/art/jigsaw.js";

test("neighbouring pieces fit and the border is flat", () => {
  const rand = seeded(29);
  for (let n = 2; n <= 6; n++) {
    for (let k = 0; k < 50; k++) {
      const pieces = cutEdges(n, rand);
      const at = (x, y) => pieces[y * n + x];
      assert.equal(pieces.length, n * n);
      for (const p of pieces) {
        if (p.y === 0) assert.equal(p.top, 0);
        if (p.y === n - 1) assert.equal(p.bottom, 0);
        if (p.x === 0) assert.equal(p.left, 0);
        if (p.x === n - 1) assert.equal(p.right, 0);
        if (p.x < n - 1) { assert.notEqual(p.right, 0); assert.equal(p.right, -at(p.x + 1, p.y).left); }
        if (p.y < n - 1) { assert.notEqual(p.bottom, 0); assert.equal(p.bottom, -at(p.x, p.y + 1).top); }
      }
    }
  }
});

test("piece outlines are closed and stay within their margin", () => {
  const P = 100;
  for (const kind of [-1, 1]) {
    const d = piecePath(P, { top: kind, right: kind, bottom: kind, left: kind });
    assert.ok(d.startsWith("M0 0") && d.endsWith("Z"));
    const nums = d.match(/-?\d+(\.\d+)?/g).map(Number);
    for (const v of nums) assert.ok(v >= -MARGIN * P - 0.01 && v <= P + MARGIN * P + 0.01, `${v} is outside the margin`);
  }
  assert.equal(piecePath(P, { top: 0, right: 0, bottom: 0, left: 0 }), "M0 0L100 0L100 100L0 100L0 0Z");
});
