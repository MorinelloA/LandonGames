import test from "node:test";
import assert from "node:assert/strict";
import { seeded } from "../helpers.mjs";
import { SIZES, generate, canStep, solve } from "../../js/logic/maze.js";

test("every maze is perfect: closed border, matching walls, one path to anywhere", () => {
  const rand = seeded(13);
  for (const [W, H] of SIZES) {
    for (let i = 0; i < 300; i++) {
      const cells = generate(W, H, rand);
      let openings = 0;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const c = cells[y][x];
          if (x === 0) assert.ok(c.l);
          if (y === 0) assert.ok(c.t);
          if (x === W - 1) assert.ok(c.r);
          if (y === H - 1) assert.ok(c.b);
          if (x < W - 1) { assert.equal(c.r, cells[y][x + 1].l); if (!c.r) openings++; }
          if (y < H - 1) { assert.equal(c.b, cells[y + 1][x].t); if (!c.b) openings++; }
        }
      }
      // a spanning tree over W*H cells has W*H-1 openings: connected, no loops
      assert.equal(openings, W * H - 1);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (x === 0 && y === 0) continue;
          assert.ok(solve(cells, 0, 0, x, y).length > 0, `cell ${x},${y} unreachable`);
        }
      }
    }
  }
});

test("the hint path walks open corridors all the way to the cheese", () => {
  const rand = seeded(17);
  for (const [W, H] of SIZES) {
    for (let i = 0; i < 100; i++) {
      const cells = generate(W, H, rand);
      const path = solve(cells, 0, 0, W - 1, H - 1);
      let [x, y] = [0, 0];
      for (const [nx, ny] of path) {
        assert.equal(Math.abs(nx - x) + Math.abs(ny - y), 1);
        assert.ok(canStep(cells, x, y, nx - x, ny - y));
        [x, y] = [nx, ny];
      }
      assert.deepEqual([x, y], [W - 1, H - 1]);
    }
  }
});
