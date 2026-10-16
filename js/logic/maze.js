// Cheese Maze's mazes: a classic recursive backtracker, so there is exactly
// one path between any two cells. The mouse starts top-left and the cheese
// waits bottom-right; each win unlocks the next size.

// maze sizes per level: [columns, rows]
export const SIZES = [[5, 4], [6, 5], [8, 6], [9, 7], [11, 8], [12, 9]];

// cells[y][x] = { t, r, b, l }: true where that side has a wall
export function generate(W, H, rand = Math.random) {
  const cells = Array.from({ length: H }, () =>
    Array.from({ length: W }, () => ({ t: true, r: true, b: true, l: true, seen: false }))
  );
  const stack = [[0, 0]];
  cells[0][0].seen = true;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const options = [];
    if (y > 0 && !cells[y - 1][x].seen) options.push([x, y - 1, "t", "b"]);
    if (x < W - 1 && !cells[y][x + 1].seen) options.push([x + 1, y, "r", "l"]);
    if (y < H - 1 && !cells[y + 1][x].seen) options.push([x, y + 1, "b", "t"]);
    if (x > 0 && !cells[y][x - 1].seen) options.push([x - 1, y, "l", "r"]);
    if (!options.length) { stack.pop(); continue; }
    const [nx, ny, wallHere, wallThere] = options[Math.floor(rand() * options.length)];
    cells[y][x][wallHere] = false;
    cells[ny][nx][wallThere] = false;
    cells[ny][nx].seen = true;
    stack.push([nx, ny]);
  }
  for (const row of cells) for (const c of row) delete c.seen;
  return cells;
}

export function canStep(cells, x, y, dx, dy) {
  const c = cells[y][x];
  if (dx === 1) return !c.r;
  if (dx === -1) return !c.l;
  if (dy === 1) return !c.b;
  if (dy === -1) return !c.t;
  return false;
}

// The way from (fx, fy) to (tx, ty): every cell after the start, in order,
// ending at the target. Empty when already there.
export function solve(cells, fx, fy, tx, ty) {
  const H = cells.length, W = cells[0].length;
  const prev = new Map();
  const key = (x, y) => x + "," + y;
  const seen = new Set([key(fx, fy)]);
  const queue = [[fx, fy]];
  while (queue.length) {
    const [x, y] = queue.shift();
    if (x === tx && y === ty) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(k) || !canStep(cells, x, y, dx, dy)) continue;
      seen.add(k);
      prev.set(k, [x, y]);
      queue.push([nx, ny]);
    }
  }
  const path = [];
  let cur = [tx, ty];
  while (cur && !(cur[0] === fx && cur[1] === fy)) {
    path.unshift(cur);
    cur = prev.get(key(cur[0], cur[1]));
  }
  return path;
}
