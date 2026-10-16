import test from "node:test";
import assert from "node:assert/strict";
import { seeded } from "../helpers.mjs";
import { LETTERS, LOWERCASE, DIGITS, subdivide, makeCutLine } from "../../js/logic/trace.js";

const shapes = { ...LETTERS, ...LOWERCASE, ...DIGITS };

test("every capital, little letter and number is there", () => {
  assert.equal(Object.keys(LETTERS).join(""), "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  assert.equal(Object.keys(LOWERCASE).join(""), "abcdefghijklmnopqrstuvwxyz");
  assert.deepEqual(Object.keys(DIGITS).sort(), "0123456789".split(""));
});

test("strokes stay on the 100x100 grid", () => {
  for (const [ch, strokes] of Object.entries(shapes)) {
    assert.ok(strokes.length >= 1, ch);
    for (const stroke of strokes) {
      assert.ok(stroke.length >= 2, `${ch} has a one-point stroke`);
      for (const [x, y] of stroke) {
        assert.ok(x >= 0 && x <= 100 && y >= 0 && y <= 100, `${ch} point ${x},${y}`);
      }
    }
  }
});

test("little letters sit between the ascender and descender lines", () => {
  for (const [ch, strokes] of Object.entries(LOWERCASE)) {
    for (const [, y] of strokes.flat()) assert.ok(y >= 8 && y <= 96, `${ch} at y=${y}`);
  }
});

test("waypoints are close enough together to follow with a finger", () => {
  for (const [ch, strokes] of Object.entries(shapes)) {
    for (const stroke of strokes) {
      const pts = subdivide(stroke);
      for (let i = 1; i < pts.length; i++) {
        const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        assert.ok(d <= 18, `${ch}: waypoints ${d.toFixed(1)} apart`);
      }
    }
  }
});

test("the cutting line stays on the paper", () => {
  const rand = seeded(19);
  for (let i = 0; i < 1000; i++) {
    for (const [x, y] of makeCutLine(rand)[0]) {
      assert.ok(x >= 0 && x <= 100 && y >= 10 && y <= 90, `${x},${y}`);
    }
  }
});
