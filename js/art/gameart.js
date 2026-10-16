// Art that belongs to one game: Sort It's bins, Math Bubbles' sea,
// Copy Cat's pads, the xylophone, maze pieces and the like.
import { WORLD as W, NOTES, shade } from "./theme.js";
import { g, rect, circle, ellipse, path, polygon, svg, starPoints, text, image } from "./svg.js";
import { iconUrl } from "./icons.js";

/* ---- Sort It: a bin for each kind of question, in a 340 x 230 box ---- */

function toyBox() {
  return g({},
    ellipse(170, 222, 150, 10, { fill: "rgba(74,52,38,0.13)" }),
    path("M44 40L296 40L310 6Q170 -22 30 6Z", { fill: shade(W.red, -0.18) }),               // the open lid
    rect(30, 60, 280, 160, { rx: 18, fill: W.red }),
    rect(30, 60, 280, 30, { rx: 14, fill: shade(W.red, -0.12) }),
    ...[[90, 150], [170, 140], [250, 152]].map(([x, y], i) => polygon(starPoints(x, y, 24, 11), { fill: [W.yellow, "#FFFFFF", W.yellow][i], opacity: 0.9 })),
    rect(56, 214, 34, 12, { rx: 6, fill: shade(W.red, -0.3) }), rect(250, 214, 34, 12, { rx: 6, fill: shade(W.red, -0.3) }),
  );
}

function toolBox() {
  return g({},
    ellipse(170, 222, 150, 10, { fill: "rgba(74,52,38,0.13)" }),
    path("M120 64V28Q120 14 134 14H206Q220 14 220 28V64", { stroke: shade(W.blue, -0.3), strokeWidth: 14, fill: "none", strokeLinecap: "round" }),
    rect(24, 60, 292, 160, { rx: 16, fill: W.blue }),
    rect(24, 60, 292, 44, { rx: 14, fill: shade(W.blue, -0.14) }),
    rect(150, 92, 40, 26, { rx: 6, fill: W.yellow }),
    path("M40 150H300M40 182H300", { stroke: shade(W.blue, 0.2), strokeWidth: 6, strokeLinecap: "round" }),
  );
}

function wovenBasket() {
  const weave = [];
  for (let x = 54; x < 290; x += 26) weave.push(`M${x} 96L${x + 10} 212`);
  return g({},
    ellipse(170, 222, 150, 10, { fill: "rgba(74,52,38,0.13)" }),
    path("M70 90Q70 -6 170 -6Q270 -6 270 90", { stroke: W.woodDeep, strokeWidth: 16, fill: "none", strokeLinecap: "round" }),
    path("M26 84H314L290 216Q288 226 276 226H64Q52 226 50 216Z", { fill: W.wood }),
    path(weave.join(""), { stroke: W.woodDeep, strokeWidth: 5, opacity: 0.55 }),
    path("M36 128H304M42 168H298", { stroke: W.woodDeep, strokeWidth: 6, opacity: 0.55 }),
    rect(18, 74, 304, 26, { rx: 13, fill: W.woodDeep }),
  );
}

const BINS = { toybox: toyBox, toolbox: toolBox, basket: wovenBasket };

export function binSvg(kind) {
  return svg(340, 230, BINS[kind](), { viewBox: "0 -26 340 256", cls: "bin-art" });
}

/* ---- Math Bubbles: under the sea ---- */

export function seaPlace(X0, Y0, FULL_W, Y1) {
  const weed = (x, h, c) => path(`M${x} 640q-18 ${-h / 3} 0 ${-h / 1.6}t0 ${-h / 2.6}`, { stroke: c, strokeWidth: 16, fill: "none", strokeLinecap: "round" });
  return g({},
    rect(X0, Y0, FULL_W, Y1 - Y0, { fill: W.sea }),
    rect(X0, 150, FULL_W, Y1 - 150, { fill: shade(W.sea, -0.08) }),
    rect(X0, 360, FULL_W, Y1 - 360, { fill: shade(W.sea, -0.16) }),
    polygon([[120, Y0], [300, Y0], [160, 560], [60, 560]], { fill: "#FFFFFF", opacity: 0.08 }),
    polygon([[620, Y0], [760, Y0], [640, 520], [560, 520]], { fill: "#FFFFFF", opacity: 0.07 }),
    path(`M${X0} 610Q200 580 520 606T${X0 + FULL_W} 600V${Y1}H${X0}Z`, { fill: W.sand }),
    path(`M${X0} 640Q300 626 640 640T${X0 + FULL_W} 636V${Y1}H${X0}Z`, { fill: W.sandDeep }),
    weed(40, 220, W.leafDeep), weed(76, 160, W.leaf), weed(1030, 240, W.leafDeep), weed(1070, 170, W.leaf), weed(-200, 200, W.leaf),
    ellipse(880, 628, 70, 34, { fill: W.stoneDeep }), ellipse(930, 636, 44, 22, { fill: W.stone }),
    ellipse(300, 640, 50, 22, { fill: W.stone }),
    // a few fish going about their day, and a crab on the sand
    image(iconUrl("tropical_fish"), 1000, 210, 96, 96),
    g({ transform: "translate(-40 260) scale(-1 1)" }, image(iconUrl("blowfish"), -80, 0, 80, 80)),
    image(iconUrl("fish"), 700, 120, 64, 64, { opacity: 0.85 }),
    image(iconUrl("crab"), 560, 590, 70, 70),
    ...[[220, 200, 7], [236, 170, 5], [900, 420, 6], [912, 392, 4]].map(([x, y, r]) => circle(x, y, r, { fill: "none", stroke: "#FFFFFF", strokeWidth: 2.5, opacity: 0.6 })),
  );
}

/* ---- Copy Cat: four pads, each its own colour AND shape ---- */

export const PADS = [
  { color: W.red, shape: "circle" },
  { color: W.yellow, shape: "star" },
  { color: W.green, shape: "triangle" },
  { color: W.blue, shape: "square" },
];

export function padShape(i, size = 70) {
  const { shape } = PADS[i];
  const c = "#FFFFFF";
  if (shape === "circle") return circle(0, 0, size * 0.5, { fill: c });
  if (shape === "star") return polygon(starPoints(0, 4, size * 0.58, size * 0.26), { fill: c });
  if (shape === "triangle") return polygon([[0, -size * 0.52], [size * 0.55, size * 0.42], [-size * 0.55, size * 0.42]], { fill: c });
  return rect(-size * 0.44, -size * 0.44, size * 0.88, size * 0.88, { rx: size * 0.12, fill: c });
}

export function padSvg(i, size = 90) {
  return svg(size, size, padShape(i, size * 0.8), { viewBox: `${-size / 2} ${-size / 2} ${size} ${size}`, cls: "pad-art" });
}

/* ---- Music Maker: the xylophone frame and its mallet ---- */

export function malletSvg() {
  return svg(60, 170, g({},
    path("M30 160L30 46", { stroke: W.woodDeep, strokeWidth: 10, strokeLinecap: "round" }),
    circle(30, 30, 24, { fill: W.red }), circle(22, 22, 7, { fill: "#FFFFFF", opacity: 0.45 })), { cls: "mallet-art" });
}

export function noteColor(i) {
  return NOTES[i % NOTES.length];
}

/* ---- Cheese Maze: the walls as one path, the mouse and its cheese ---- */

export function mazeWallsPath(cells, cell) {
  const H = cells.length, Wd = cells[0].length;
  let d = "";
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < Wd; x++) {
      const c = cells[y][x], X = x * cell, Y = y * cell;
      if (c.t) d += `M${X} ${Y}H${X + cell}`;
      if (c.l) d += `M${X} ${Y}V${Y + cell}`;
      if (x === Wd - 1 && c.r) d += `M${X + cell} ${Y}V${Y + cell}`;
      if (y === H - 1 && c.b) d += `M${X} ${Y + cell}H${X + cell}`;
    }
  }
  return d;
}

/* ---- Trace It: paper, a pencil and scissors ---- */

export function pencil() {
  return g({},
    rect(-7, -64, 14, 50, { fill: W.yellow }),
    rect(-7, -64, 4, 50, { fill: shade(W.yellow, -0.12) }),
    rect(-7, -72, 14, 10, { rx: 3, fill: W.pink }),
    rect(-7, -64, 14, 4, { fill: W.metal }),
    polygon([[-7, -14], [7, -14], [0, 0]], { fill: "#F3D3A4" }),
    polygon([[-2.6, -5], [2.6, -5], [0, 0]], { fill: "#4A3426" }),
  );
}

export function scissors() {
  return g({},
    path("M-4 -60L10 0M4 -60L-10 0", { stroke: "#9AA5B1", strokeWidth: 5, strokeLinecap: "round" }),
    circle(-12, 9, 9, { fill: "none", stroke: W.red, strokeWidth: 5 }),
    circle(12, 9, 9, { fill: "none", stroke: W.red, strokeWidth: 5 }),
  );
}

export function numberLabel(x, y, n, size = 16) {
  return circle(x, y, size * 0.75, { fill: W.blue }) +
    text(x, y + size * 0.32, String(n), { textAnchor: "middle", fontSize: size, fontWeight: 700, fill: "#FFFFFF", fontFamily: "Fredoka, sans-serif" });
}
