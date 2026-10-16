// Cheese Maze: drag the mouse through the maze to the cheese. Each win
// unlocks a bigger maze.
import * as Sound from "../core/sound.js";
import { later } from "../core/session.js";
import { awardStars } from "../core/rewards.js";
import { createLevel } from "../core/levels.js";
import { SIZES, generate, canStep, solve } from "../logic/maze.js";

const board = document.getElementById("maze-board");
const levelEl = document.getElementById("maze-level");

const level = createLevel({ key: "landon-maze-level", max: SIZES.length });

let W = 0, H = 0;
let cells = [];      // cells[y][x] = { t, r, b, l } walls
let px = 0, py = 0;  // the mouse's cell
let cellSize = 0;
let playerEl = null;
let won = false;
let running = false;

function renderLevel() {
  levelEl.textContent = "Level " + level.value;
}

function build() {
  won = false;
  [W, H] = SIZES[level.value - 1];
  cells = generate(W, H);
  px = 0;
  py = 0;

  const maxW = Math.min(window.innerWidth * 0.9, 900);
  const maxH = window.innerHeight * 0.62;
  cellSize = Math.floor(Math.min(maxW / W, maxH / H));

  board.innerHTML = "";
  board.style.gridTemplateColumns = `repeat(${W}, ${cellSize}px)`;
  board.style.gridTemplateRows = `repeat(${H}, ${cellSize}px)`;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = document.createElement("div");
      d.className = "maze-cell";
      if (cells[y][x].t) d.classList.add("wall-t");
      if (cells[y][x].l) d.classList.add("wall-l");
      if (x === W - 1 && cells[y][x].r) d.classList.add("edge-r");
      if (y === H - 1 && cells[y][x].b) d.classList.add("edge-b");
      board.appendChild(d);
    }
  }

  const goal = document.createElement("div");
  goal.id = "maze-goal";
  goal.textContent = "🧀";
  placeAt(goal, W - 1, H - 1);
  board.appendChild(goal);

  playerEl = document.createElement("div");
  playerEl.id = "maze-player";
  playerEl.textContent = "🐭";
  placeAt(playerEl, 0, 0);
  board.appendChild(playerEl);

  markVisited(0, 0);
}

function placeAt(el, x, y) {
  el.style.width = cellSize + "px";
  el.style.height = cellSize + "px";
  el.style.fontSize = cellSize * 0.62 + "px";
  el.style.left = x * cellSize + "px";
  el.style.top = y * cellSize + "px";
}

function markVisited(x, y) {
  const cell = board.children[y * W + x];
  if (cell) cell.classList.add("visited");
}

let stepPitch = 0;
function step(dx, dy) {
  px += dx;
  py += dy;
  placeAt(playerEl, px, py);
  markVisited(px, py);
  Sound.tone(300 + (stepPitch++ % 5) * 60, { type: "triangle", dur: 0.08, gain: 0.12 });
  if (px === W - 1 && py === H - 1) win();
}

// walk toward wherever the finger is, one open corridor cell at a time
function moveToward(cx, cy) {
  let guard = 0;
  while ((cx !== px || cy !== py) && guard++ < 4) {
    const dx = Math.sign(cx - px), dy = Math.sign(cy - py);
    const preferX = Math.abs(cx - px) >= Math.abs(cy - py);
    if (preferX && dx && canStep(cells, px, py, dx, 0)) step(dx, 0);
    else if (dy && canStep(cells, px, py, 0, dy)) step(0, dy);
    else if (dx && canStep(cells, px, py, dx, 0)) step(dx, 0);
    else break;
    if (won) break;
  }
}

function pointerCell(e) {
  const r = board.getBoundingClientRect();
  const x = Math.floor((e.clientX - r.left) / cellSize);
  const y = Math.floor((e.clientY - r.top) / cellSize);
  if (x < 0 || y < 0 || x >= W || y >= H) return null;
  return [x, y];
}

let dragging = false;
board.addEventListener("pointerdown", (e) => {
  if (!running || won) return;
  e.preventDefault();
  try { board.setPointerCapture(e.pointerId); } catch (_) {}
  dragging = true;
  const c = pointerCell(e);
  if (c) moveToward(c[0], c[1]);
});
board.addEventListener("pointermove", (e) => {
  if (!running || won || !dragging) return;
  const c = pointerCell(e);
  if (c) moveToward(c[0], c[1]);
});
const stopDrag = () => { dragging = false; };
board.addEventListener("pointerup", stopDrag);
board.addEventListener("pointercancel", stopDrag);

function win() {
  won = true;
  playerEl.classList.add("win");
  Sound.fanfare();
  awardStars(2, { message: "Cheese! 🧀" });
  Sound.speak("You found the cheese! Great job!");
  if (level.value < SIZES.length) {
    level.up();
    renderLevel();
  }
  later(build, 2400);
}

export default {
  start() {
    running = true;
    renderLevel();
    later(build);
  },
  stop() {
    running = false;
  },
  hint() {
    // light up the next few steps toward the cheese
    if (won || !cells.length) return;
    solve(cells, px, py, W - 1, H - 1).slice(0, 3).forEach(([x, y]) => {
      const cell = board.children[y * W + x];
      if (cell) {
        cell.classList.add("maze-hint");
        setTimeout(() => cell.classList.remove("maze-hint"), 2200);
      }
    });
  },
};
