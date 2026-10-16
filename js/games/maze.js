// Cheese Maze: drag the mouse along the garden paths to the cheese. Each
// win unlocks a bigger maze. The mouse leaves a trail of crumbs and turns
// to face the way it's going; Help lights the next few steps.
import * as Sound from "../core/sound.js";
import { later } from "../core/session.js";
import { awardStars } from "../core/rewards.js";
import { createLevel } from "../core/levels.js";
import { SIZES, generate, canStep, solve } from "../logic/maze.js";
import { FOUND_CHEESE } from "../logic/lines.js";
import { mazeWallsPath } from "../art/gameart.js";
import { iconImg } from "../art/icons.js";
import { backdropSvg } from "../art/backdrops.js";
import { WORLD } from "../art/theme.js";
import { g, rect, path, svg } from "../art/svg.js";

const screen = document.getElementById("screen-maze");
const board = document.getElementById("maze-board");
const levelEl = document.getElementById("title-badge");
const NS = "http://www.w3.org/2000/svg";

// the board fits here, clear of the cat in the corner
const AREA = { x: 60, y: 14, w: 870, h: 606 };
const PAD = 14; // the wooden frame around the paths

const level = createLevel({ key: "landon-maze-level", max: SIZES.length });

let W = 0, H = 0;
let cells = [];      // cells[y][x] = { t, r, b, l } walls
let px = 0, py = 0;  // the mouse's cell
let cellSize = 0;
let mouseEl = null;
let crumbsEl = null;
let hintEl = null;
let facing = 1;      // 1 = facing right
let won = false;
let running = false;
let drawn = false;

function renderLevel() {
  levelEl.textContent = "Level " + level.value;
}

function build() {
  won = false;
  [W, H] = SIZES[level.value - 1];
  cells = generate(W, H);
  px = 0;
  py = 0;
  facing = 1;
  cellSize = Math.floor(Math.min((AREA.w - PAD * 2) / W, (AREA.h - PAD * 2) / H));
  const bw = cellSize * W + PAD * 2, bh = cellSize * H + PAD * 2;
  board.style.width = bw + "px";
  board.style.height = bh + "px";
  board.style.left = AREA.x + Math.round((AREA.w - bw) / 2) + "px";
  board.style.top = AREA.y + Math.round((AREA.h - bh) / 2) + "px";

  const wall = Math.max(6, cellSize * 0.16);
  board.innerHTML = svg(bw, bh, g({},
    rect(0, 0, bw, bh, { rx: 22, fill: WORLD.woodDeep }),
    rect(PAD - 4, PAD - 4, cellSize * W + 8, cellSize * H + 8, { rx: 12, fill: "#F4EBD3" }),
    g({ id: "maze-hints", transform: `translate(${PAD} ${PAD})` }),
    g({ id: "maze-crumbs", transform: `translate(${PAD} ${PAD})` }),
    g({ transform: `translate(${PAD} ${PAD})` },
      path(mazeWallsPath(cells, cellSize), { stroke: WORLD.leafDeep, strokeWidth: wall + 6, strokeLinecap: "round", fill: "none" }),
      path(mazeWallsPath(cells, cellSize), { stroke: WORLD.leaf, strokeWidth: wall, strokeLinecap: "round", fill: "none" })),
  ), { viewBox: `0 0 ${bw} ${bh}` }) +
    `<div id="maze-cheese">${iconImg("cheese", Math.round(cellSize * 0.72))}</div>` +
    `<div id="maze-mouse">${iconImg("mouse", Math.round(cellSize * 0.78))}</div>`;

  crumbsEl = board.querySelector("#maze-crumbs");
  hintEl = board.querySelector("#maze-hints");
  mouseEl = board.querySelector("#maze-mouse");
  place(board.querySelector("#maze-cheese"), W - 1, H - 1, 0.72, 0);
  place(mouseEl, 0, 0, 0.78);
}

// put an icon in a cell; `flip` turns the mouse (whose picture faces left)
function place(el, x, y, frac, flip = 1) {
  const size = cellSize * frac;
  const ox = PAD + x * cellSize + (cellSize - size) / 2, oy = PAD + y * cellSize + (cellSize - size) / 2;
  el.style.transform = `translate(${ox}px, ${oy}px)`;
  const img = /** @type {HTMLElement} */ (el.querySelector(".icon"));
  if (img && flip) img.style.transform = flip === 1 ? "scaleX(-1)" : "";
}

function crumb(x, y) {
  const c = document.createElementNS(NS, "circle");
  c.setAttribute("cx", String((x + 0.5) * cellSize));
  c.setAttribute("cy", String((y + 0.5) * cellSize));
  c.setAttribute("r", String(Math.max(3, cellSize * 0.08)));
  c.setAttribute("fill", WORLD.yellow);
  crumbsEl.appendChild(c);
}

let stepPitch = 0;
function step(dx, dy) {
  crumb(px, py);
  px += dx;
  py += dy;
  if (dx) facing = dx;
  place(mouseEl, px, py, 0.78, facing);
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

// the board may be scaled on screen, so measure cells from its drawn size
function pointerCell(e) {
  const r = board.getBoundingClientRect();
  const s = r.width / (cellSize * W + PAD * 2);
  const x = Math.floor((e.clientX - r.left - PAD * s) / (cellSize * s));
  const y = Math.floor((e.clientY - r.top - PAD * s) / (cellSize * s));
  if (x < 0 || y < 0 || x >= W || y >= H) return null;
  return [x, y];
}

let dragging = false;
board.addEventListener("pointerdown", (e) => {
  if (!running || won || !e.isPrimary) return;
  e.preventDefault();
  try { board.setPointerCapture(e.pointerId); } catch (_) {}
  dragging = true;
  const c = pointerCell(e);
  if (c) moveToward(c[0], c[1]);
});
board.addEventListener("pointermove", (e) => {
  if (!running || won || !dragging || !e.isPrimary) return;
  const c = pointerCell(e);
  if (c) moveToward(c[0], c[1]);
});
const stopDrag = () => { dragging = false; };
board.addEventListener("pointerup", stopDrag);
board.addEventListener("pointercancel", stopDrag);

function win() {
  won = true;
  mouseEl.classList.add("win");
  Sound.fanfare();
  awardStars(2, { message: "Cheese!" });
  Sound.speak(FOUND_CHEESE);
  if (level.value < SIZES.length) {
    level.up();
    renderLevel();
  }
  later(build, 2400);
}

export default {
  start() {
    if (!drawn) {
      screen.querySelector(".backdrop").innerHTML = backdropSvg("park");
      drawn = true;
    }
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
    hintEl.innerHTML = "";
    for (const [x, y] of solve(cells, px, py, W - 1, H - 1).slice(0, 3)) {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", String((x + 0.5) * cellSize));
      c.setAttribute("cy", String((y + 0.5) * cellSize));
      c.setAttribute("r", String(cellSize * 0.22));
      c.setAttribute("fill", "#FFD45E");
      c.setAttribute("class", "maze-hint-dot");
      hintEl.appendChild(c);
    }
    setTimeout(() => { if (hintEl) hintEl.innerHTML = ""; }, 2200);
  },
};
