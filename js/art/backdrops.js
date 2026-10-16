// Backdrops: the places stories and games happen. Each is drawn in stage
// units (the stage is 1133 x 640) plus a generous bleed on every side, so
// any screen shape shows more scenery at the edges rather than bars.
import { WORLD as W, shade } from "./theme.js";
import { seaPlace } from "./gameart.js";
import { el, g, rect, circle, ellipse, path, polygon, svg, starPoints, uid } from "./svg.js";

export const STAGE_W = 1133;
export const STAGE_H = 640;
export const BLEED = { x: 340, top: 230, bottom: 170 };
const X0 = -BLEED.x, X1 = STAGE_W + BLEED.x, Y0 = -BLEED.top, Y1 = STAGE_H + BLEED.bottom;
const FULL_W = X1 - X0;

/* ---- outdoor pieces ---- */

export function cloud(x, y, s = 1, color = W.cloud) {
  return g({ transform: `translate(${x} ${y}) scale(${s})` },
    ellipse(0, 0, 70, 26, { fill: color }),
    circle(-28, -14, 26, { fill: color }),
    circle(8, -26, 34, { fill: color }),
    circle(40, -10, 24, { fill: color }));
}

export function sun(x, y, r = 46) {
  return circle(x, y, r * 1.45, { fill: W.sunGlow, opacity: 0.55 }) + circle(x, y, r, { fill: W.sun });
}

export function tree(x, y, s = 1, leaf = W.leaf) {
  return g({ transform: `translate(${x} ${y}) scale(${s})` },
    path("M-11 0L-8 -96Q0 -104 8 -96L11 0Z", { fill: W.trunk }),
    circle(-38, -118, 46, { fill: shade(leaf, -0.12) }),
    circle(36, -114, 44, { fill: shade(leaf, -0.12) }),
    circle(0, -158, 58, { fill: leaf }),
    circle(-40, -128, 42, { fill: leaf }),
    circle(40, -126, 40, { fill: leaf }),
    circle(-14, -176, 20, { fill: shade(leaf, 0.18), opacity: 0.7 }));
}

export function bush(x, y, s = 1, color = W.leafDeep) {
  return g({ transform: `translate(${x} ${y}) scale(${s})` },
    circle(-26, -14, 24, { fill: color }), circle(4, -26, 30, { fill: color }), circle(32, -12, 22, { fill: color }),
    rect(-50, -14, 104, 14, { fill: color }));
}

export function flower(x, y, color) {
  return g({ transform: `translate(${x} ${y})` },
    path("M0 0L0 -22", { stroke: W.leafDeep, strokeWidth: 3, strokeLinecap: "round" }),
    ...[0, 72, 144, 216, 288].map((a) => {
      const r = (a * Math.PI) / 180;
      return circle(Math.cos(r) * 7, -26 + Math.sin(r) * 7, 6, { fill: color });
    }),
    circle(0, -26, 4.5, { fill: W.yellow }));
}

function hills(groundY, { far = W.hillFar, near = W.hill } = {}) {
  return path(`M${X0} ${groundY - 70}Q${120} ${groundY - 170} ${420} ${groundY - 96}T${980} ${groundY - 120}T${X1} ${groundY - 90}V${groundY + 20}H${X0}Z`, { fill: far }) +
    path(`M${X0} ${groundY - 20}Q${260} ${groundY - 110} ${620} ${groundY - 40}T${X1} ${groundY - 50}V${groundY + 30}H${X0}Z`, { fill: near });
}

function sky(color = W.sky) {
  return rect(X0, Y0, FULL_W, Y1 - Y0, { fill: color }) +
    rect(X0, 260, FULL_W, 260, { fill: shade(color, 0.25), opacity: 0.6 });
}

function grassGround(groundY, color = W.grass) {
  return rect(X0, groundY, FULL_W, Y1 - groundY, { fill: color }) +
    path(`M${X0} ${groundY}Q${300} ${groundY + 26} ${700} ${groundY + 6}T${X1} ${groundY + 14}V${groundY}Z`, { fill: shade(color, -0.06) });
}

// a sunny park: the default outdoors
export function outdoors({ groundY = 470, trees = [[70, 1.15], [640, 0.95]], flowers = true, extra = "", time = "day" } = {}) {
  const night = time === "night";
  return g({},
    sky(night ? W.night : W.sky),
    night ? moonAndStars() : sun(980, 70) + cloud(260, 90, 1.1) + cloud(760, 150, 0.8) + cloud(1300, 80, 0.9),
    hills(groundY),
    grassGround(groundY),
    ...trees.map(([x, s]) => tree(x, groundY + 22, s)),
    bush(-120, groundY + 40, 1.2), bush(1240, groundY + 30, 1.1),
    flowers ? flower(220, groundY + 96, W.pink) + flower(250, groundY + 108, W.yellow) + flower(700, groundY + 120, W.purple) + flower(-40, groundY + 130, W.red) : "",
    extra,
  );
}

function moonAndStars() {
  const star = ([x, y], r) => g({}, ...[starPoints(x, y, r, r * 0.45)].map((pts) => polygon(pts, { fill: W.star })));
  return circle(980, 80, 42, { fill: "#FFF3C4" }) + circle(996, 70, 38, { fill: W.night }) +
    [[180, 60, 9], [420, 120, 7], [640, 40, 8], [1240, 140, 9], [-100, 120, 7], [820, 200, 6]].map(([x, y, r]) => star([x, y], r)).join("");
}

/* ---- indoor pieces ---- */

// a window onto `view`: day | rain | storm | night
export function windowFrame(x, y, w, h, view = "day") {
  const inner = { x: x + 14, y: y + 14, w: w - 28, h: h - 28 };
  let scene;
  if (view === "night") {
    scene = rect(inner.x, inner.y, inner.w, inner.h, { fill: W.night }) +
      circle(inner.x + inner.w * 0.72, inner.y + 46, 24, { fill: "#FFF3C4" }) + circle(inner.x + inner.w * 0.72 + 10, inner.y + 40, 22, { fill: W.night }) +
      [[0.2, 0.3], [0.45, 0.18], [0.3, 0.7], [0.6, 0.62], [0.85, 0.82]].map(([fx, fy]) =>
        polygon(starPoints(inner.x + inner.w * fx, inner.y + inner.h * fy, 7, 3), { fill: W.star })).join("");
  } else if (view === "storm") {
    scene = rect(inner.x, inner.y, inner.w, inner.h, { fill: "#4B5277" }) +
      cloud(inner.x + inner.w * 0.35, inner.y + 52, 0.75, "#6E7499") + cloud(inner.x + inner.w * 0.78, inner.y + 70, 0.6, "#6E7499") +
      polygon([[inner.x + inner.w * 0.52, inner.y + 70], [inner.x + inner.w * 0.42, inner.y + 140], [inner.x + inner.w * 0.5, inner.y + 140], [inner.x + inner.w * 0.4, inner.y + inner.h - 10], [inner.x + inner.w * 0.62, inner.y + 120], [inner.x + inner.w * 0.53, inner.y + 120], [inner.x + inner.w * 0.62, inner.y + 70]], { fill: "#FFE58A" }) +
      rain(inner, "#9EA6CF");
  } else if (view === "rain") {
    scene = rect(inner.x, inner.y, inner.w, inner.h, { fill: "#B9C7D6" }) +
      cloud(inner.x + inner.w * 0.3, inner.y + 46, 0.7, "#97A6B8") + cloud(inner.x + inner.w * 0.8, inner.y + 66, 0.55, "#97A6B8") +
      rect(inner.x, inner.y + inner.h - 40, inner.w, 40, { fill: "#8FB27A" }) + rain(inner, "#7F92A8");
  } else {
    scene = rect(inner.x, inner.y, inner.w, inner.h, { fill: W.sky }) +
      circle(inner.x + inner.w - 40, inner.y + 40, 26, { fill: W.sun }) +
      cloud(inner.x + inner.w * 0.35, inner.y + inner.h * 0.38, 0.55) +
      path(`M${inner.x} ${inner.y + inner.h - 34}Q${inner.x + inner.w * 0.4} ${inner.y + inner.h - 70} ${inner.x + inner.w} ${inner.y + inner.h - 40}V${inner.y + inner.h}H${inner.x}Z`, { fill: W.hill });
  }
  const id = uid("win");
  return g({},
    el("clipPath", { id }, rect(inner.x, inner.y, inner.w, inner.h)),
    rect(x, y, w, h, { rx: 16, fill: W.frame }),
    g({ clipPath: `url(#${id})` }, scene),
    rect(x + w / 2 - 6, y + 14, 12, h - 28, { fill: W.frame }),
    rect(x + 14, y + h / 2 - 6, w - 28, 12, { fill: W.frame }),
    rect(x - 16, y + h - 6, w + 32, 22, { rx: 8, fill: W.frame }),
    rect(x - 16, y + h + 10, w + 32, 6, { fill: W.wallDeep }),
  );
}

function rain(box, color) {
  let d = "";
  for (let i = 0; i < 26; i++) {
    const x = box.x + ((i * 53) % box.w);
    const y = box.y + ((i * 37) % (box.h - 30)) + 10;
    d += `M${x} ${y}l-6 16`;
  }
  return path(d, { stroke: color, strokeWidth: 4, strokeLinecap: "round" });
}

export function shelf(x, y, w = 220) {
  return rect(x, y, w, 16, { rx: 6, fill: W.woodDeep }) +
    path(`M${x + 24} ${y + 16}l12 22h-12z M${x + w - 24} ${y + 16}l-12 22h12z`, { fill: W.woodDark });
}

export function pictureFrame(x, y, w = 110, h = 86, art = "hills") {
  const inner = art === "sun"
    ? rect(x + 10, y + 10, w - 20, h - 20, { fill: "#FFF0C9" }) + circle(x + w / 2, y + h / 2, 18, { fill: W.sun })
    : rect(x + 10, y + 10, w - 20, h - 20, { fill: W.sky }) +
      path(`M${x + 10} ${y + h - 26}Q${x + w * 0.4} ${y + h - 52} ${x + w - 10} ${y + h - 30}V${y + h - 10}H${x + 10}Z`, { fill: W.hill });
  return rect(x, y, w, h, { rx: 8, fill: W.woodDeep }) + inner;
}

export function rug(cx, cy, rx = 300, ry = 46, color = W.rug) {
  return ellipse(cx, cy, rx, ry, { fill: color }) + ellipse(cx, cy, rx - 26, ry - 12, { fill: "none", stroke: shade(color, 0.3), strokeWidth: 5, strokeDasharray: "14 10" });
}

function bunting(y) {
  const flags = [];
  const colors = [W.red, W.yellow, W.blue, W.green, W.pink, W.purple, W.orange];
  for (let i = 0; i < 14; i++) {
    const x = -60 + i * 66;
    flags.push(polygon([[x, y + 6], [x + 46, y + 10], [x + 22, y + 52]], { fill: colors[i % colors.length] }));
  }
  return path(`M-80 ${y}Q420 ${y + 40} 900 ${y}`, { stroke: W.woodDeep, strokeWidth: 3, fill: "none" }) + flags.join("");
}

function floorBoards(top) {
  let d = "";
  for (let y = top + 34; y < Y1; y += 46) d += `M${X0} ${y}H${X1}`;
  return path(d, { stroke: W.floorDeep, strokeWidth: 3, opacity: 0.55 });
}

// a room: wall, floor and a few things on the wall
export function room({ wall = W.wall, floor = W.floor, floorY = 452, window: view = "day", windowX = 110, rugColor = W.rug, extra = "", party = false, dark = false, shelfAt = 470 } = {}) {
  const body = g({},
    rect(X0, Y0, FULL_W, floorY - Y0, { fill: wall }),
    rect(X0, floorY - 150, FULL_W, 10, { fill: shade(wall, -0.06) }),
    rect(X0, floorY, FULL_W, Y1 - floorY, { fill: floor }),
    floorBoards(floorY),
    rect(X0, floorY - 14, FULL_W, 16, { fill: W.frame }),
    view ? windowFrame(windowX, 70, 250, 220, view) : "",
    shelfAt !== null ? shelf(shelfAt, 160, 230) : "",
    party ? bunting(30) : "",
    rug(360, floorY + 128, 330, 48, rugColor),
    extra,
  );
  return dark ? body + rect(X0, Y0, FULL_W, Y1 - Y0, { fill: W.nightDeep, opacity: 0.62 }) : body;
}

/* ---- named places ---- */

// the menu: a warm playroom wall with soft spots, bunting peeking out
// from behind the top bar, and a wooden floor
function menuRoom() {
  const id = uid("dots");
  return g({},
    el("pattern", { id, width: 76, height: 76, patternUnits: "userSpaceOnUse" },
      circle(19, 19, 7, { fill: "#F8DCC0" }) + circle(57, 57, 7, { fill: "#F8DCC0" })),
    rect(X0, Y0, FULL_W, Y1 - Y0, { fill: "#FDEBD6" }),
    rect(X0, Y0, FULL_W, Y1 - Y0, { fill: `url(#${id})` }),
    g({ transform: "translate(-300 -58) scale(1.9 1)" }, bunting(0)),
    rect(X0, 600, FULL_W, Y1 - 600, { fill: W.floor }),
    rect(X0, 594, FULL_W, 10, { fill: W.frame }),
    floorBoards(600),
  );
}

// a starry night sky over dark hills
function nightSky() {
  return g({},
    rect(X0, Y0, FULL_W, Y1 - Y0, { fill: W.night }),
    moonAndStars(),
    ...[[300, 300, 6], [560, 250, 5], [880, 330, 6], [40, 380, 5], [1100, 260, 7], [700, 420, 5]].map(([x, y, r]) =>
      polygon(starPoints(x, y, r, r * 0.45), { fill: W.star })),
    circle(140, 150, 30, { fill: "#F2A27E" }), ellipse(140, 150, 52, 9, { fill: "none", stroke: "#F7CDB9", strokeWidth: 5 }),
    path(`M${X0} 560Q200 500 520 556T${X1} 540V${Y1}H${X0}Z`, { fill: "#3B4378" }),
    path(`M${X0} 610Q340 570 700 612T${X1} 600V${Y1}H${X0}Z`, { fill: "#2B3263" }),
  );
}

export const PLACES = {
  menu: menuRoom,
  sea: () => seaPlace(X0, Y0, FULL_W, Y1),
  space: nightSky,
  park: () => outdoors(),
  playground: () => outdoors({ trees: [[60, 1.1]], extra: slide(560, 560) }),
  pool: () => outdoors({ trees: [[60, 1.1]], flowers: false, extra: pool(300, 520, 470) }),
  station: () => outdoors({ trees: [[-60, 1]], flowers: false, extra: station() }),
  track: () => outdoors({ trees: [[-40, 1], [700, 0.9]], flowers: false, extra: raceTrack() }),
  bark: () => outdoors({ trees: [[60, 1.1], [690, 0.9]], extra: fence(470) }),
  playroom: () => room({ window: "day" }),
  party: () => room({ wall: "#FCE3EC", party: true, window: "day", shelfAt: null }),
  bedroom: () => room({ wall: "#E4E9FB", floor: "#D9B48C", window: "day", rugColor: "#9BB7EE", extra: bed(470, 452) , shelfAt: null }),
  kitchen: () => room({ wall: "#FFF0CC", floor: "#E9D7B9", window: "day", windowX: 90, shelfAt: null, extra: counter(400, 452) }),
  living: () => room({ wall: "#E8F2DF", window: "day", windowX: 90, shelfAt: null }),
  rainy: () => room({ wall: "#E9E3F4", window: "rain", windowX: 330, shelfAt: null, rugColor: "#A6C8E8" }),
  storm: () => room({ wall: "#D9D6EC", floor: "#C9A57F", window: "storm", windowX: 330, shelfAt: null, rugColor: "#9C9CC9" }),
  dark: () => room({ window: "night", windowX: 420, dark: true, shelfAt: null }),
  doorway: () => room({ wall: "#FDEAD6", window: null, shelfAt: null, extra: door(560, 452) }),
};

function slide(x, groundY) {
  return g({},
    rect(x + 130, groundY - 250, 14, 250, { fill: W.metalDeep }),
    rect(x + 190, groundY - 250, 14, 250, { fill: W.metalDeep }),
    ...[0, 1, 2, 3, 4].map((i) => rect(x + 130, groundY - 60 - i * 46, 74, 10, { rx: 5, fill: W.metal })),
    rect(x + 120, groundY - 262, 94, 20, { rx: 8, fill: W.red }),
    path(`M${x + 130} ${groundY - 250}Q${x + 40} ${groundY - 150} ${x - 40} ${groundY - 24}L${x - 10} ${groundY - 6}Q${x + 70} ${groundY - 120} ${x + 152} ${groundY - 226}Z`, { fill: W.yellow }),
    ellipse(x + 40, groundY + 10, 120, 16, { fill: W.sand }),
  );
}

function pool(x, y, w) {
  return g({},
    rect(x - 30, y - 30, w + 60, 150, { rx: 18, fill: "#FFFFFF" }),
    rect(x, y, w, 100, { rx: 12, fill: W.water }),
    path(`M${x + 20} ${y + 30}q24 -12 48 0t48 0M${x + 200} ${y + 60}q24 -12 48 0t48 0M${x + 120} ${y + 80}q24 -12 48 0`, { stroke: "#FFFFFF", strokeWidth: 5, fill: "none", strokeLinecap: "round", opacity: 0.8 }),
    path(`M${x + w - 50} ${y - 60}v90M${x + w - 20} ${y - 60}v90`, { stroke: W.metalDeep, strokeWidth: 8, strokeLinecap: "round", fill: "none" }),
    path(`M${x + w - 50} ${y - 60}q15 -22 30 0`, { stroke: W.metalDeep, strokeWidth: 8, strokeLinecap: "round", fill: "none" }),
  );
}

// tracks across the middle, a platform in front to stand on
function station() {
  return g({},
    rect(X0, 452, FULL_W, 66, { fill: "#BDAE9C" }),
    ...Array.from({ length: 30 }, (_, i) => rect(X0 + 20 + i * 64, 462, 40, 50, { rx: 4, fill: W.woodDeep })),
    rect(X0, 470, FULL_W, 9, { fill: W.metalDeep }),
    rect(X0, 496, FULL_W, 9, { fill: W.metalDeep }),
    rect(X0, 518, FULL_W, Y1 - 518, { fill: W.stone }),
    rect(X0, 518, FULL_W, 12, { fill: W.yellow }),
    ...Array.from({ length: 16 }, (_, i) => rect(X0 + i * 120, 560, 4, Y1 - 560, { fill: W.stoneDeep, opacity: 0.6 })),
  );
}

function raceTrack() {
  return g({},
    rect(X0, 500, FULL_W, Y1 - 500, { fill: "#E58A5C" }),
    ...[540, 590, 640, 690].map((y) => rect(X0, y, FULL_W, 5, { fill: "#FFFFFF", opacity: 0.85 })),
    rect(560, 500, 16, Y1 - 500, { fill: "#FFFFFF" }),
    rect(470, 330, 10, 180, { fill: W.metalDeep }), rect(660, 330, 10, 180, { fill: W.metalDeep }),
    rect(470, 330, 200, 38, { rx: 6, fill: "#FFFFFF" }),
    ...Array.from({ length: 10 }, (_, i) => rect(478 + i * 19, 338 + (i % 2) * 11, 10, 11, { fill: "#4A3426" })),
  );
}

function fence(groundY) {
  const posts = Array.from({ length: 16 }, (_, i) => path(`M${X0 + 40 + i * 70} ${groundY + 20}v-86l14 -16l14 16v86z`, { fill: "#FFFFFF" }));
  return g({}, rect(X0, groundY - 40, FULL_W, 12, { fill: "#FFFFFF" }), rect(X0, groundY - 2, FULL_W, 12, { fill: "#FFFFFF" }), ...posts);
}

function bed(x, floorY) {
  return g({},
    rect(x - 10, floorY - 150, 26, 160, { rx: 10, fill: W.woodDeep }),
    rect(x, floorY - 70, 250, 60, { rx: 14, fill: "#FFFFFF" }),
    rect(x + 20, floorY - 92, 76, 34, { rx: 14, fill: "#FFFFFF" }),
    rect(x + 90, floorY - 82, 170, 66, { rx: 16, fill: "#9BB7EE" }),
    rect(x + 250, floorY - 110, 22, 120, { rx: 10, fill: W.woodDeep }),
  );
}

function counter(x, floorY) {
  return g({},
    rect(x, floorY - 170, 460, 170, { fill: "#F5F1EA" }),
    rect(x - 10, floorY - 184, 480, 20, { rx: 8, fill: "#D9C8B0" }),
    rect(x + 20, floorY - 150, 130, 130, { rx: 10, fill: "#EDE5D8" }),
    rect(x + 170, floorY - 150, 130, 130, { rx: 10, fill: "#EDE5D8" }),
    rect(x + 320, floorY - 150, 120, 130, { rx: 10, fill: "#EDE5D8" }),
    circle(x + 140, floorY - 86, 6, { fill: W.woodDeep }), circle(x + 180, floorY - 86, 6, { fill: W.woodDeep }),
    rect(x + 30, floorY - 320, 180, 100, { rx: 10, fill: "#F5F1EA" }), rect(x + 250, floorY - 320, 180, 100, { rx: 10, fill: "#F5F1EA" }),
  );
}

function door(x, floorY) {
  return g({},
    rect(x - 14, floorY - 316, 228, 316, { rx: 12, fill: W.frame }),
    rect(x, floorY - 300, 200, 300, { fill: W.sky }),
    path(`M${x} ${floorY - 60}Q${x + 100} ${floorY - 110} ${x + 200} ${floorY - 70}V${floorY}H${x}Z`, { fill: W.grass }),
    tree(x + 150, floorY - 40, 0.55),
    path(`M${x} ${floorY - 300}L${x - 70} ${floorY - 286}V${floorY + 10}L${x} ${floorY}Z`, { fill: W.woodDeep }),
    circle(x - 52, floorY - 140, 7, { fill: W.yellow }),
  );
}

/* ---- the whole backdrop ---- */

// A place's backdrop as an <svg> covering the stage and its bleed.
export function backdropSvg(place, opts) {
  const draw = typeof place === "function" ? place : PLACES[place];
  if (!draw) throw new Error("No place called " + place);
  return svg(FULL_W, Y1 - Y0, draw(opts), {
    viewBox: `${X0} ${Y0} ${FULL_W} ${Y1 - Y0}`,
    cls: "backdrop-art",
    extra: { preserveAspectRatio: "xMidYMid slice" },
  });
}
