// Trace It: finger-trace capital letters, lowercase letters and numbers
// dot to dot in school stroke order, or cut along a wavy line (IEP OT
// goals). It never freezes — motor practice is trial and error, so
// straying off the path simply doesn't advance. Sounds only mark progress.
import * as Sound from "../core/sound.js";
import { later } from "../core/session.js";
import { awardStars } from "../core/rewards.js";
import { shuffle } from "../core/rng.js";
import { LETTERS, LOWERCASE, DIGITS, subdivide, makeCutLine } from "../logic/trace.js";

const stage = document.getElementById("trace-stage");
const labelEl = document.getElementById("title-badge");
const modeBtns = /** @type {HTMLElement[]} */ ([...document.querySelectorAll(".trace-mode-btn")]);

const STROKE_COLORS = ["#ff8a8a", "#7ec8e3", "#90d4a3", "#c9a7eb"];
const TOL = 10;          // viewBox units of "close enough" to the next dot
const NS = "http://www.w3.org/2000/svg";

let mode = "abc";        // abc (A-Z) | lower (a-z) | num | cut
let order = [];          // shuffled characters for the current mode
let charIdx = 0;
let completedChars = 0;

let strokes = [];        // subdivided waypoints for the current character
let strokeIdx = 0;
let pointIdx = 0;        // next waypoint to reach in the current stroke
let svg = null;
let progressLine = null; // polyline being drawn for the current stroke
let targetDot = null;
let marker = null;       // pencil or scissors that rides along
let done = false;
let running = false;

function currentChar() {
  return mode === "cut" ? "✂️" : order[charIdx % order.length];
}

function el(name, attrs) {
  const e = document.createElementNS(NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

// lowercase strokes are shorter, so they get a slightly finer pen
function penWidth() {
  return mode === "cut" ? 4 : mode === "lower" ? 8 : 9;
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

  labelEl.textContent = mode === "cut" ? "✂️ Cut the line!" : currentChar();

  stage.innerHTML = "";
  svg = el("svg", { viewBox: "0 0 100 100" });

  // faint guide for the whole shape
  raw.forEach((s) => {
    svg.appendChild(el("polyline", {
      points: s.map((p) => p.join(",")).join(" "),
      fill: "none",
      stroke: mode === "cut" ? "#b8bed8" : "#dde2f2",
      "stroke-width": mode === "cut" ? 2 : penWidth(),
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-dasharray": mode === "cut" ? "4 3" : "none",
    }));
  });

  progressLine = null;
  targetDot = el("circle", { r: 5, class: "trace-target" });
  svg.appendChild(targetDot);

  marker = el("text", {
    class: "trace-marker",
    "font-size": "12",
    "text-anchor": "middle",
  });
  marker.textContent = mode === "cut" ? "✂️" : "✏️";
  svg.appendChild(marker);

  startStroke();
  stage.appendChild(svg);

  if (mode === "cut") {
    Sound.speak("Cut along the line!");
  } else {
    const kind = mode === "num" ? "number " : mode === "lower" ? "little letter " : "big letter ";
    Sound.speak("Trace the " + kind + currentChar());
  }
}

function startStroke() {
  const color = STROKE_COLORS[strokeIdx % STROKE_COLORS.length];
  progressLine = el("polyline", {
    points: strokes[strokeIdx][0].join(","),
    fill: "none",
    stroke: color,
    "stroke-width": penWidth(),
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });
  svg.insertBefore(progressLine, targetDot);
  pointIdx = 0;
  moveMarkers();
}

function moveMarkers() {
  const stroke = strokes[strokeIdx];
  const next = stroke[Math.min(pointIdx, stroke.length - 1)];
  targetDot.setAttribute("cx", next[0]);
  targetDot.setAttribute("cy", next[1]);
  const at = pointIdx === 0 ? stroke[0] : stroke[pointIdx - 1];
  marker.setAttribute("x", at[0]);
  marker.setAttribute("y", at[1] - 2);
}

function svgPoint(e) {
  const r = svg.getBoundingClientRect();
  return [((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100];
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
    strokeIdx++;
    if (strokeIdx >= strokes.length) {
      charDone();
    } else {
      startStroke();
    }
  } else {
    moveMarkers();
  }
}

function charDone() {
  done = true;
  targetDot.setAttribute("r", 0);
  if (mode === "cut") {
    // snip! the two halves drift apart
    svg.querySelectorAll("polyline").forEach((p) => { p.style.transition = "transform 0.6s"; });
    progressLine.style.transform = "translateY(4px)";
    Sound.fanfare();
    awardStars(1, { message: "Snip! ✂️" });
  } else {
    completedChars++;
    Sound.success();
    Sound.speak(currentChar() + "! Nice tracing!");
    if (completedChars % 3 === 0) {
      awardStars(1, { message: "Great tracing! ✏️" });
    }
    charIdx++;
  }
  later(buildChar, 1800);
}

/* finger tracking on the whole stage */
let fingerDown = false;
stage.addEventListener("pointerdown", (e) => {
  if (!running || !svg) return;
  e.preventDefault();
  try { stage.setPointerCapture(e.pointerId); } catch (_) {}
  fingerDown = true;
  const [x, y] = svgPoint(e);
  advanceTo(x, y);
});
stage.addEventListener("pointermove", (e) => {
  if (!running || !svg || !fingerDown) return;
  const [x, y] = svgPoint(e);
  advanceTo(x, y);
});
const lift = () => { fingerDown = false; };
stage.addEventListener("pointerup", lift);
stage.addEventListener("pointercancel", lift);

function setMode(m) {
  mode = m;
  modeBtns.forEach((b) => b.classList.toggle("active-song", b.dataset.mode === m));
  if (m === "abc") order = shuffle(Object.keys(LETTERS));
  else if (m === "lower") order = shuffle(Object.keys(LOWERCASE));
  else if (m === "num") order = shuffle(Object.keys(DIGITS));
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
    running = true;
    completedChars = 0;
    later(() => setMode("abc"));
  },
  stop() {
    running = false;
  },
  hint() {
    if (targetDot) {
      const dot = targetDot;
      dot.classList.add("trace-target-hint");
      setTimeout(() => dot.classList.remove("trace-target-hint"), 2200);
    }
  },
};
