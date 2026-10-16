// The menu's picture for each game, drawn in a 240 x 140 box.
import { ACCENT, NOTES, WORLD as W, PEOPLE, CAT, shade } from "./theme.js";
import { g, rect, circle, ellipse, path, polygon, text, svg, starPoints } from "./svg.js";
import { head } from "./people.js";
import { cat } from "./mascot.js";
import { icon, blockTower } from "./props.js";

const FONT = "Fredoka, ui-rounded, sans-serif";
const num = (x, y, s, size = 30, fill = "#FFFFFF") =>
  text(x, y + size * 0.36, s, { textAnchor: "middle", fontSize: size, fontWeight: 700, fontFamily: FONT, fill });

function bubble(x, y, r, color, n) {
  return circle(x, y, r, { fill: color }) +
    circle(x - r * 0.38, y - r * 0.4, r * 0.22, { fill: "#FFFFFF", opacity: 0.75 }) +
    num(x, y, n, r * 0.95);
}

function letterBlock(x, y, s, color, letter) {
  return g({}, rect(x - s / 2, y - s / 2, s, s, { rx: 9, fill: color }),
    rect(x - s / 2 + 6, y - s / 2 + 6, s - 12, s - 12, { rx: 6, fill: shade(color, 0.22) }),
    num(x, y, letter, s * 0.6, shade(color, -0.4)));
}

// a jigsaw piece about 60 units wide, knobs right and bottom
function jigsaw(x, y, color, rot = 0) {
  return g({ transform: `translate(${x} ${y}) rotate(${rot})` },
    path("M-30 -30H-6Q-8 -42 0 -42Q8 -42 6 -30H30V-6Q42 -8 42 0Q42 8 30 6V30H6Q8 42 0 42Q-8 42 -6 30H-30V6Q-18 8 -18 0Q-18 -8 -30 -6Z", { fill: color }));
}

const ART = {
  mathpop: () => g({},
    rect(0, 100, 240, 40, { fill: shade(ACCENT.mathpop, 0.35) }),
    path("M0 100q30 -10 60 0t60 0t60 0t60 0", { fill: shade(ACCENT.mathpop, 0.35) }),
    bubble(66, 72, 30, "#5DB8DD", "3"), bubble(126, 46, 34, "#F28FB5", "5"), bubble(186, 78, 27, "#7CC36A", "8"),
    circle(100, 110, 6, { fill: "#FFFFFF", opacity: 0.6 }), circle(160, 118, 4, { fill: "#FFFFFF", opacity: 0.6 })),
  spelling: () => g({},
    rect(20, 112, 200, 14, { rx: 7, fill: shade(ACCENT.spelling, 0.3) }),
    letterBlock(70, 84, 50, W.red, "C"), letterBlock(122, 84, 50, W.yellow, "A"), letterBlock(174, 84, 50, W.blue, "T"),
    icon("cat", 122, 34, 44)),
  memory: () => g({},
    g({ transform: "rotate(-8 82 72)" }, rect(46, 22, 72, 96, { rx: 12, fill: ACCENT.memory }),
      ...[[82, 72, 12], [68, 52, 6], [82, 46, 6], [96, 52, 6]].map(([x, y, r]) => circle(x, y, r, { fill: shade(ACCENT.memory, 0.35) }))),
    g({ transform: "rotate(7 158 72)" }, rect(122, 22, 72, 96, { rx: 12, fill: "#FFFFFF" }), icon("dog", 158, 70, 56))),
  simon: () => g({},
    rect(38, 70, 70, 56, { rx: 14, fill: W.red }), rect(132, 70, 70, 56, { rx: 14, fill: W.blue }),
    circle(73, 98, 14, { fill: "#FFFFFF", opacity: 0.7 }),
    rect(155, 85, 24, 24, { rx: 4, fill: "#FFFFFF", opacity: 0.7 }),
    g({ transform: "translate(120 128) scale(0.5)" }, cat({ pose: "peek" }))),
  counting: () => g({},
    icon("basket", 120, 86, 100),
    icon("apple", 62, 50, 40), icon("apple", 176, 40, 40), icon("apple", 96, 30, 34), icon("apple", 150, 74, 30),
    circle(200, 104, 18, { fill: W.yellow }), num(200, 104, "4", 22, "#6B5200")),
  music: () => g({},
    rect(22, 64, 196, 12, { rx: 6, fill: W.woodDeep }), rect(22, 108, 196, 12, { rx: 6, fill: W.woodDeep }),
    ...NOTES.map((c, i) => rect(30 + i * 23.5, 54 + i * 3, 18, 76 - i * 6, { rx: 6, fill: c })),
    path("M150 30L196 6", { stroke: W.woodDark, strokeWidth: 6, strokeLinecap: "round" }), circle(146, 32, 10, { fill: W.red })),
  puzzle: () => g({},
    jigsaw(84, 70, ACCENT.puzzle, -6), jigsaw(158, 76, W.yellow, 12),
    circle(84, 70, 9, { fill: "#FFFFFF", opacity: 0.5 })),
  maze: () => g({},
    rect(34, 16, 172, 112, { rx: 10, fill: "#FFFBF0" }),
    path("M34 16H206V128H34Z M74 16V88 M114 56V128 M154 16V88 M74 88H114 M154 56H206", { stroke: "#9D8BD4", strokeWidth: 7, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }),
    icon("mouse", 54, 104, 36), icon("cheese", 184, 108, 34)),
  photopuzzle: () => g({},
    rect(46, 14, 148, 112, { rx: 10, fill: W.woodDeep }),
    rect(56, 24, 128, 92, { fill: W.sky }), circle(158, 48, 14, { fill: W.sun }),
    path("M56 116L96 70L124 98L142 80L184 116Z", { fill: W.green }),
    jigsaw(180, 104, ACCENT.photopuzzle, 10)),
  sortit: () => g({},
    path("M50 80H190L178 130H62Z", { fill: W.red }),
    rect(44, 70, 152, 18, { rx: 8, fill: shade(W.red, -0.15) }),
    icon("ball", 92, 56, 46), icon("teddy", 140, 44, 54), icon("apple", 180, 66, 34)),
  feelings: () => g({},
    g({ transform: "translate(60 168) scale(0.42)" }, head("boy", "happy")),
    g({ transform: "translate(120 168) scale(0.42)" }, head("girl", "sad")),
    g({ transform: "translate(180 168) scale(0.42)" }, head("boy", "angry"))),
  trace: () => g({},
    rect(40, 12, 160, 116, { rx: 10, fill: "#FFFFFF" }),
    path("M40 104H200M40 40H200", { stroke: "#BFD9F2", strokeWidth: 3 }),
    path("M76 104L110 30L144 104M90 76H130", { stroke: "#E2D4C4", strokeWidth: 12, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" }),
    path("M76 104L110 30L122 56", { stroke: ACCENT.trace, strokeWidth: 12, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" }),
    g({ transform: "translate(126 62) rotate(35)" }, rect(-7, -46, 14, 40, { fill: W.yellow }), polygon([[-7, -6], [7, -6], [0, 8]], { fill: "#F3D3A4" }), rect(-7, -52, 14, 8, { fill: W.pink }))),
};

export const CARD_GAMES = Object.keys(ART);

export function cardSvg(game) {
  const draw = ART[game];
  if (!draw) throw new Error("No card art for " + game);
  return svg(240, 140, draw(), { cls: "card-art" });
}
