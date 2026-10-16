// Things in the stories that need drawing rather than an icon: a dropped
// ice cream, a knocked-down tower, a scribbled book, a TV that's off.
// Each is drawn around (x, y) on the ground or table it sits on.
import { WORLD as W, shade } from "./theme.js";
import { g, rect, circle, ellipse, path, polygon, image, text } from "./svg.js";
import { iconUrl } from "./icons.js";

// a vendored icon placed in a scene, centred on (x, y)
export function icon(id, x, y, size, { rotate = 0, flip = false } = {}) {
  const t = `translate(${x} ${y})` + (rotate ? ` rotate(${rotate})` : "") + (flip ? " scale(-1 1)" : "");
  return g({ transform: t }, image(iconUrl(id), -size / 2, -size / 2, size, size));
}

export function shadow(x, y, rx, ry = rx * 0.18) {
  return ellipse(x, y, rx, ry, { fill: "rgba(74,52,38,0.13)" });
}

export function table(x, y, w = 260, color = W.wood) {
  return g({},
    shadow(x, y + 4, w * 0.48, 10),
    rect(x - w / 2 + 18, y - 104, 18, 104, { rx: 6, fill: shade(color, -0.2) }),
    rect(x + w / 2 - 36, y - 104, 18, 104, { rx: 6, fill: shade(color, -0.2) }),
    rect(x - w / 2, y - 124, w, 26, { rx: 10, fill: color }),
    rect(x - w / 2, y - 104, w, 8, { fill: shade(color, -0.12) }),
  );
}

// the scoop has landed on the ground; the empty cone lies beside it
export function iceCreamDropped(x, y) {
  return g({ transform: `translate(${x} ${y})` },
    path("M-46 4Q-50 -14 -30 -18Q-22 -34 -2 -28Q16 -40 30 -24Q52 -22 48 0Q40 10 0 10Q-40 10 -46 4Z", { fill: "#F6A6C1" }),
    circle(-12, -22, 7, { fill: "#FFFFFF", opacity: 0.5 }),
    g({ transform: "translate(64 -6) rotate(70)" },
      polygon([[-16, -20], [16, -20], [0, 26]], { fill: "#E9B46C" }),
      path("M-10 -10L6 6M0 -18L10 -4M-8 2L2 14", { stroke: "#C98E45", strokeWidth: 3, strokeLinecap: "round" })),
  );
}

const BLOCK_COLORS = [W.red, W.blue, W.yellow, W.green, W.purple, W.orange];

function block(x, y, s, color, rot, letter) {
  return g({ transform: `translate(${x} ${y}) rotate(${rot})` },
    rect(-s / 2, -s / 2, s, s, { rx: 8, fill: color }),
    rect(-s / 2 + 7, -s / 2 + 7, s - 14, s - 14, { rx: 5, fill: shade(color, 0.25) }),
    letter ? text(0, s * 0.17, letter, { textAnchor: "middle", fontSize: s * 0.5, fontWeight: 700, fill: shade(color, -0.35), fontFamily: "Fredoka, sans-serif" }) : "");
}

// a tower that's been knocked over: blocks scattered on the floor
export function blocksFallen(x, y) {
  const spots = [[-90, -24, -18, "A"], [-30, -20, 12, "B"], [34, -26, 36, ""], [92, -22, -8, "C"], [-60, -76, 28, ""], [10, -70, -22, "D"], [64, -78, 14, ""]];
  return g({}, shadow(x, y, 150, 14), ...spots.map(([dx, dy, rot, l], i) => block(x + dx, y + dy, 50, BLOCK_COLORS[i % 6], rot, l)));
}

// a little tower still standing (for the menu and puzzles)
export function blockTower(x, y, n = 4) {
  return g({}, ...Array.from({ length: n }, (_, i) => block(x, y - 26 - i * 50, 50, BLOCK_COLORS[i % 6], 0, "ABCD"[i])));
}

// an open book; `scribbled` adds crayon scribbles across the pages
export function book(x, y, { scribbled = false, w = 170 } = {}) {
  const h = w * 0.62;
  return g({ transform: `translate(${x} ${y})` },
    shadow(0, 4, w * 0.55, 10),
    path(`M${-w / 2} ${-h}Q${-w / 4} ${-h - 14} 0 ${-h + 6}V0Q${-w / 4} -14 ${-w / 2} 0Z`, { fill: "#FFFFFF" }),
    path(`M${w / 2} ${-h}Q${w / 4} ${-h - 14} 0 ${-h + 6}V0Q${w / 4} -14 ${w / 2} 0Z`, { fill: "#FFFDF7" }),
    path(`M${-w / 2} 0Q${-w / 4} -14 0 0Q${w / 4} -14 ${w / 2} 0V8Q${w / 4} -6 0 8Q${-w / 4} -6 ${-w / 2} 8Z`, { fill: W.red }),
    ...[0.28, 0.44, 0.6, 0.76].map((f) => path(`M${-w * 0.42} ${-h * f}H${-w * 0.08}M${w * 0.08} ${-h * f}H${w * 0.42}`, { stroke: "#D9CDBE", strokeWidth: 4, strokeLinecap: "round" })),
    scribbled ? path(`M${-w * 0.4} ${-h * 0.7}q20 -30 30 0t30 -6t26 10t30 -10t30 8t26 -6M${-w * 0.36} ${-h * 0.42}q24 30 40 0t36 6t30 -8t34 10M${-w * 0.3} ${-h * 0.22}q30 -20 60 6t60 -6`, { stroke: W.purple, strokeWidth: 6, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" }) : "",
  );
}

// a plate with nothing left but crumbs
export function emptyPlate(x, y) {
  return g({ transform: `translate(${x} ${y})` },
    ellipse(0, 0, 66, 18, { fill: "#FFFFFF" }),
    ellipse(0, -2, 44, 11, { fill: "#F1ECE4" }),
    ...[[-14, -4], [6, -1], [18, -6], [-4, -8], [26, -1]].map(([cx, cy]) => circle(cx, cy, 2.6, { fill: "#C98E45" })),
  );
}

// a TV that has switched off: a dark, empty screen
export function tvOff(x, y) {
  return g({ transform: `translate(${x} ${y})` },
    shadow(0, 2, 120, 12),
    rect(-110, -76, 220, 76, { rx: 10, fill: W.woodDeep }),
    rect(-98, -64, 90, 52, { rx: 6, fill: shade(W.woodDeep, 0.15) }),
    rect(8, -64, 90, 52, { rx: 6, fill: shade(W.woodDeep, 0.15) }),
    rect(-120, -236, 240, 154, { rx: 14, fill: "#3A3F4B" }),
    rect(-106, -222, 212, 126, { rx: 8, fill: "#1E222B" }),
    path("M-86 -206L-46 -206L-92 -150Z", { fill: "#FFFFFF", opacity: 0.08 }),
    rect(-14, -84, 28, 10, { fill: "#3A3F4B" }),
  );
}

// a floor lamp that's off
export function lampOff(x, y) {
  return g({ transform: `translate(${x} ${y})` },
    ellipse(0, 0, 40, 10, { fill: "#6B6F7E" }),
    rect(-5, -230, 10, 230, { fill: "#6B6F7E" }),
    path("M-50 -230L50 -230L32 -300L-32 -300Z", { fill: "#B9B3A6" }),
  );
}

// a dog's loud bark: sound lines in front of its mouth
export function barkLines(x, y, dir = -1) {
  const d = (r) => `M${x + dir * r * 0.2} ${y - r}Q${x + dir * r} ${y} ${x + dir * r * 0.2} ${y + r}`;
  return path(d(22) + d(38) + d(54), { stroke: "#7C6352", strokeWidth: 6, strokeLinecap: "round", fill: "none", opacity: 0.75 });
}

// stuffing poking out of a teddy's torn seam
export function stuffing(x, y) {
  return g({ transform: `translate(${x} ${y})` },
    circle(0, 0, 13, { fill: "#FFFFFF" }), circle(14, -8, 10, { fill: "#FFFFFF" }), circle(-12, -10, 9, { fill: "#FFFFFF" }),
    path("M-22 10l8 -6l6 8l8 -8l8 8l8 -6", { stroke: "#8E5F36", strokeWidth: 3.5, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }));
}

// a balloon floating away, its string trailing below it
export function balloonAway(x, y, size = 110) {
  return path(`M${x + 2} ${y + size * 0.42}q-18 40 6 80t-10 70`, { stroke: "#9C8E86", strokeWidth: 3, fill: "none" }) + icon("balloon", x, y, size);
}

export function bunch(ids, x, y, size, gap = size * 0.9) {
  return ids.map((id, i) => icon(id, x + (i - (ids.length - 1) / 2) * gap, y, size)).join("");
}
