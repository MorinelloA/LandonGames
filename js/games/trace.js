// Trace It: finger-trace capital letters, little letters and numbers dot
// to dot in school stroke order, or cut along a wavy line (IEP OT goals).
// It never freezes — motor practice is trial and error, so straying off
// the path simply doesn't advance. Sounds only mark progress.
//
// The paper has handwriting lines matching the stroke data: capitals and
// numbers sit between y = 10 and 90; little letters have their x-height at
// 35, baseline at 80, ascenders up to 8 and descenders down to 96.
import * as Sound from "../core/sound.js";
import { later } from "../core/session.js";
import { awardStars, praise } from "../core/rewards.js";
import { shuffle } from "../core/rng.js";
import { LETTERS, LOWERCASE, DIGITS, subdivide, makeCutLine } from "../logic/trace.js";
import { backdropSvg } from "../art/backdrops.js";
import { NOTES } from "../art/theme.js";
import { pencil, scissors } from "../art/gameart.js";
import { g, rect, circle, path, polygon, text, svg } from "../art/svg.js";

const screen = document.getElementById("screen-trace");
const stage = document.getElementById("trace-stage");
const labelEl = document.getElementById("title-badge");
const modeBtns = /** @type {HTMLElement[]} */ ([...document.querySelectorAll(".trace-mode-btn")]);

const TOL = 10;          // viewBox units of "close enough" to the next dot
const FONT = "Fredoka, ui-rounded, sans-serif";
const GUIDE = "#E6DBCD";
const RULE = "#A9CBEB";

let mode = "abc";        // abc (A-Z) | lower (a-z) | num | cut
let order = [];          // shuffled characters for the current mode
let charIdx = 0;
let completedChars = 0;

let strokes = [];        // subdivided waypoints for the current character
let strokeIdx = 0;
let pointIdx = 0;        // next waypoint to reach in the current stroke
let svgEl = null;
let progressLine = null; // the line drawn so far in the current stroke
let targetDot = null;
let marker = null;       // the pencil or scissors that rides along
let done = false;
let running = false;
let drawn = false;

function currentChar() {
  return order[charIdx % order.length];
}

// lowercase strokes are shorter, so they get a slightly finer pen
function penWidth() {
  return mode === "cut" ? 4 : mode === "lower" ? 8 : 9;
}

function rules() {
  const solid = (y) => path(`M-2 ${y}H102`, { stroke: RULE, strokeWidth: 0.9 });
  const dashed = (y) => path(`M-2 ${y}H102`, { stroke: RULE, strokeWidth: 0.9, strokeDasharray: "2.5 2" });
  if (mode === "cut") return "";
  if (mode === "lower") return solid(8) + dashed(35) + solid(80) + path("M-2 96H102", { stroke: RULE, strokeWidth: 0.6, opacity: 0.6 });
  return solid(10) + dashed(50) + solid(90);
}

// a numbered dot where each stroke starts, with an arrow showing which way
function startMarks(raw) {
  if (mode === "cut") return "";
  return raw.map((s, i) => {
    const [x, y] = s[0], [x2, y2] = s[1];
    const len = Math.hypot(x2 - x, y2 - y) || 1;
    const ux = (x2 - x) / len, uy = (y2 - y) / len;
    const ax = x + ux * 8, ay = y + uy * 8;
    const arrow = polygon([[ax + ux * 2.6, ay + uy * 2.6], [ax - uy * 2, ay + ux * 2], [ax + uy * 2, ay - ux * 2]], { fill: NOTES[5], opacity: 0.8 });
    return g({ class: "start-mark", "data-stroke": i },
      arrow,
      circle(x, y, 3.6, { fill: NOTES[5] }),
      text(x, y + 1.6, String(i + 1), { textAnchor: "middle", fontSize: 4.4, fontWeight: 700, fill: "#FFFFFF", fontFamily: FONT }));
  }).join("");
}

function buildChar() {
  const raw = mode === "cut" ? makeCutLine()
    : mode === "num" ? DIGITS[currentChar()]
    : mode === "lower" ? LOWERCASE[currentChar()]
    : LETTERS[currentChar()];
  strokes = raw.map((s) => subdivide(s));
  strokeIdx = 0;
  pointIdx = 0;
  done = false;

  labelEl.textContent = mode === "cut" ? "Cut the line!" : currentChar();

  const guides = raw.map((s) => path("M" + s.map((p) => p.join(" ")).join("L"), {
    fill: "none",
    stroke: mode === "cut" ? "#B8AE9F" : GUIDE,
    strokeWidth: mode === "cut" ? 1.6 : penWidth(),
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeDasharray: mode === "cut" ? "4 3" : undefined,
  })).join("");

  stage.innerHTML = svg(610, 610, g({},
    rect(-5, -5, 110, 110, { rx: 6, fill: "#FFFFFF" }),
    mode === "cut" ? rect(-5, -5, 110, 110, { rx: 6, fill: "#FFF3D9" }) : "",
    rules(),
    guides,
    g({ id: "trace-progress" }),
    startMarks(raw),
    circle(0, 0, 4.6, { class: "trace-target", fill: NOTES[1], stroke: "#FFFFFF", strokeWidth: 1.4 }),
    g({ class: "trace-marker" }, mode === "cut" ? scissors() : pencil()),
  ), { viewBox: "-6 -6 112 112" });
  svgEl = stage.querySelector("svg");
  targetDot = svgEl.querySelector(".trace-target");
  marker = svgEl.querySelector(".trace-marker");

  startStroke();

  if (mode === "cut") {
    Sound.speak("Cut along the line!");
  } else {
    const kind = mode === "num" ? "number " : mode === "lower" ? "little letter " : "big letter ";
    Sound.speak("Trace the " + kind + currentChar());
  }
}

function startStroke() {
  const NS = "http://www.w3.org/2000/svg";
  progressLine = document.createElementNS(NS, "polyline");
  const attrs = {
    points: strokes[strokeIdx][0].join(","),
    fill: "none",
    stroke: mode === "cut" ? "#8E5F36" : NOTES[strokeIdx % NOTES.length],
    "stroke-width": String(mode === "cut" ? 2 : penWidth()),
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  };
  for (const k in attrs) progressLine.setAttribute(k, attrs[k]);
  svgEl.querySelector("#trace-progress").appendChild(progressLine);
  pointIdx = 0;
  moveMarkers();
}

function moveMarkers() {
  const stroke = strokes[strokeIdx];
  const next = stroke[Math.min(pointIdx, stroke.length - 1)];
  targetDot.setAttribute("cx", String(next[0]));
  targetDot.setAttribute("cy", String(next[1]));
  const at = pointIdx === 0 ? stroke[0] : stroke[pointIdx - 1];
  marker.setAttribute("transform", `translate(${at[0]} ${at[1]}) rotate(${mode === "cut" ? -90 : 28}) scale(0.16)`);
}

function svgPoint(e) {
  const r = svgEl.getBoundingClientRect();
  return [((e.clientX - r.left) / r.width) * 112 - 6, ((e.clientY - r.top) / r.height) * 112 - 6];
}

function advanceTo(px, py) {
  if (done) return;
  const stroke = strokes[strokeIdx];
  // consume every waypoint the finger has swept close to
  let moved = false;
  let guard = 0;
  while (pointIdx < stroke.length && guard++ < 6) {
    const [tx, ty] = stroke[pointIdx];
    if (Math.hypot(px - tx, py - ty) > TOL) break;
    progressLine.setAttribute("points", progressLine.getAttribute("points") + " " + tx + "," + ty);
    pointIdx++;
    moved = true;
    Sound.tone(320 + (pointIdx % 8) * 45, { type: "triangle", dur: 0.07, gain: 0.12 });
  }
  if (!moved) return;
  if (pointIdx >= stroke.length) {
    Sound.pop();
    const mark = svgEl.querySelector(`.start-mark[data-stroke="${strokeIdx}"]`);
    if (mark) mark.setAttribute("opacity", "0.25");
    strokeIdx++;
    if (strokeIdx >= strokes.length) charDone();
    else startStroke();
  } else {
    moveMarkers();
  }
}

function charDone() {
  done = true;
  targetDot.setAttribute("r", "0");
  if (mode === "cut") {
    // snip! the two halves of the paper part a little
    Sound.fanfare();
    awardStars(1, { message: "Snip!" });
  } else {
    completedChars++;
    praise();
    Sound.speak(currentChar() + "! Nice tracing!");
    if (completedChars % 3 === 0) awardStars(1, { message: "Great tracing!" });
    charIdx++;
  }
  later(buildChar, 1800);
}

/* finger tracking on the whole paper */
let fingerDown = false;
stage.addEventListener("pointerdown", (e) => {
  if (!running || !svgEl || !e.isPrimary) return;
  e.preventDefault();
  try { stage.setPointerCapture(e.pointerId); } catch (_) {}
  fingerDown = true;
  advanceTo(...svgPoint(e));
});
stage.addEventListener("pointermove", (e) => {
  if (!running || !svgEl || !fingerDown || !e.isPrimary) return;
  advanceTo(...svgPoint(e));
});
const lift = () => { fingerDown = false; };
stage.addEventListener("pointerup", lift);
stage.addEventListener("pointercancel", lift);

function setMode(m) {
  mode = m;
  modeBtns.forEach((b) => b.classList.toggle("on", b.dataset.mode === m));
  if (m === "abc") order = shuffle(Object.keys(LETTERS));
  else if (m === "lower") order = shuffle(Object.keys(LOWERCASE));
  else if (m === "num") order = shuffle(Object.keys(DIGITS));
  else order = ["cut"];
  charIdx = 0;
  buildChar();
}

modeBtns.forEach((b) => {
  b.addEventListener("click", () => {
    if (!running) return;
    Sound.click();
    setMode(b.dataset.mode);
  });
});

export default {
  start() {
    if (!drawn) {
      screen.querySelector(".backdrop").innerHTML = backdropSvg("living");
      drawn = true;
    }
    running = true;
    completedChars = 0;
    later(() => setMode("abc"));
  },
  stop() {
    running = false;
  },
  hint() {
    if (!targetDot) return;
    const dot = targetDot;
    dot.classList.add("hint");
    setTimeout(() => dot.classList.remove("hint"), 2200);
  },
};
