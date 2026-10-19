// Where a drag lands. At reach 0 (every game but Math Bubbles) the dragged
// thing's middle has to be on a target; Math Bubbles' reach of 80 counts a
// held bubble (radius about 80) as soon as it touches the sum.
import test from "node:test";
import assert from "node:assert/strict";
import { landing } from "../../js/core/drag.js";

const box = (left, top, right, bottom) => ({ left, top, right, bottom });

test("at reach 0 the middle has to be on a target, and the first of two touching wins", () => {
  const slots = [box(0, 0, 100, 100), box(100, 0, 200, 100)];
  assert.equal(landing(50, 50, slots), 0);
  assert.equal(landing(150, 50, slots), 1);
  assert.equal(landing(100, 50, slots), 0);
  assert.equal(landing(201, 50, slots), -1);
  assert.equal(landing(50, 101, slots), -1);
  assert.equal(landing(50, 50, []), -1);
});

test("with reach, a drop that close to the edge counts", () => {
  const sum = [box(345, 12, 790, 130)];
  assert.equal(landing(560, 130 + 79, sum, 80), 0, "just under the sum");
  assert.equal(landing(560, 130 + 81, sum, 80), -1, "a little further");
  assert.equal(landing(790 + 50, 130 + 50, sum, 80), 0, "off a corner, about 71 away");
  assert.equal(landing(790 + 60, 130 + 60, sum, 80), -1, "off a corner, about 85 away");
  assert.equal(landing(560, -60, sum, 80), 0, "above it");
  assert.equal(landing(400, 60, sum, 80), 0, "on it");
});

test("with reach, the nearest target wins", () => {
  const two = [box(0, 0, 100, 100), box(150, 0, 250, 100)];
  assert.equal(landing(120, 50, two, 40), 0);
  assert.equal(landing(130, 50, two, 40), 1);
});
