// The interface icons, as one SVG sprite of <symbol>s used with
// <svg><use href="#i-home"/></svg>. Flat colours in the storybook look.
import { WORLD as W, PEOPLE, PAGE } from "./theme.js";
import { el, g, rect, circle, path, polygon, starPoints } from "./svg.js";

const skin = PEOPLE.boy.skin;

const SYMBOLS = {
  home: g({},
    path("M24 5L44 22H38V42H10V22H4Z", { fill: W.red }),
    rect(12, 22, 24, 20, { fill: "#FFF1DE" }),
    rect(20, 28, 9, 14, { rx: 2, fill: W.woodDeep }),
    rect(31, 8, 5, 10, { fill: W.red })),
  help: g({},
    rect(13, 22, 22, 20, { rx: 9, fill: skin }),
    ...[[14, 9, 18], [20, 5, 22], [26, 6, 21], [32, 10, 17]].map(([x, y, h]) => rect(x - 3, y, 6.5, h + 4, { rx: 3.25, fill: skin })),
    rect(6, 24, 15, 6.5, { rx: 3.25, fill: skin, transform: "rotate(-35 13 27)" }),
    path("M17 34q7 4 14 0", { stroke: PEOPLE.boy.skinDeep, strokeWidth: 2.5, fill: "none", strokeLinecap: "round" })),
  star: g({},
    polygon(starPoints(24, 26, 21, 10), { fill: W.yellow }),
    polygon(starPoints(24, 26, 21, 10).slice(0, 6).concat([[24, 26]]), { fill: "#FFE07A", opacity: 0.6 })),
  music: g({},
    path("M18 34V12L38 8V30", { stroke: W.purple, strokeWidth: 4.5, fill: "none", strokeLinejoin: "round" }),
    circle(13.5, 35, 6.5, { fill: W.purple }), circle(33.5, 31, 6.5, { fill: W.purple })),
  speaker: g({},
    path("M6 18H14L25 9V39L14 30H6Z", { fill: "#6E7CA8" }),
    path("M31 17q5 7 0 14M36 12q9 12 0 24", { stroke: W.orange, strokeWidth: 4, fill: "none", strokeLinecap: "round" })),
  play: g({}, circle(24, 24, 20, { fill: W.green }), polygon([[19, 14], [35, 24], [19, 34]], { fill: "#FFFFFF" })),
  restart: g({},
    path("M36 18A14 14 0 1 0 38 27", { stroke: W.blue, strokeWidth: 5.5, fill: "none", strokeLinecap: "round" }),
    polygon([[30, 8], [43, 17], [31, 22]], { fill: W.blue })),
  photos: g({},
    rect(5, 9, 38, 30, { rx: 5, fill: W.woodDeep }),
    rect(9, 13, 30, 22, { fill: W.sky }),
    circle(32, 19, 4, { fill: W.sun }),
    path("M9 35L19 23L26 30L30 26L39 35Z", { fill: W.green })),
  scissors: g({},
    path("M14 8L30 34M34 8L18 34", { stroke: "#9AA5B1", strokeWidth: 4.5, strokeLinecap: "round" }),
    circle(14, 37, 6, { fill: "none", stroke: W.red, strokeWidth: 4.5 }),
    circle(34, 37, 6, { fill: "none", stroke: W.red, strokeWidth: 4.5 })),
  pencil: g({ transform: "rotate(45 24 24)" },
    rect(18, 4, 12, 30, { fill: W.yellow }),
    rect(18, 4, 12, 6, { fill: W.pink }),
    polygon([[18, 34], [30, 34], [24, 45]], { fill: "#F3D3A4" }),
    polygon([[22, 41], [26, 41], [24, 45]], { fill: PAGE.ink })),
  hourglass: g({},
    rect(10, 5, 28, 5, { rx: 2.5, fill: W.woodDeep }), rect(10, 38, 28, 5, { rx: 2.5, fill: W.woodDeep }),
    path("M14 10H34Q34 20 24 24Q34 28 34 38H14Q14 28 24 24Q14 20 14 10Z", { fill: "#DCEFFA" }),
    path("M18 33Q24 29 30 33V38H18Z", { fill: W.yellow })),
  tablet: g({}, rect(4, 9, 40, 30, { rx: 6, fill: "#5D6474" }), rect(8, 13, 32, 22, { rx: 2, fill: W.sky }), circle(41, 24, 1.5, { fill: "#9AA5B1" })),
  check: path("M10 25L20 35L38 13", { stroke: W.green, strokeWidth: 6, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }),
};

export const UI_ICONS = Object.keys(SYMBOLS);

export function spriteSvg() {
  const symbols = Object.entries(SYMBOLS)
    .map(([name, body]) => el("symbol", { id: "i-" + name, viewBox: "0 0 48 48" }, body))
    .join("");
  return el("svg", { xmlns: "http://www.w3.org/2000/svg", width: 0, height: 0, style: "position:absolute", ariaHidden: "true" }, symbols);
}

// markup for one icon from the sprite
export function useIcon(name, cls = "ico") {
  return `<svg class="${cls}" viewBox="0 0 48 48" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}
