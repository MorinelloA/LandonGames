// The cat in the corner of every redrawn game. It sits and watches, cheers
// when something's right, and points while Help is showing a hint. It
// never reacts to a mistake: mistakes stay quiet.
import { catSvg } from "../art/mascot.js";

const el = document.getElementById("buddy");
let timer = null;

function pose(name, cls = "") {
  el.innerHTML = catSvg({ pose: name, size: 152, flip: name === "point" }); // point toward the game
  el.className = cls;
}

export function show(on) {
  clearTimeout(timer);
  if (on) pose("sit");
  else el.className = "hidden";
}

function brief(name, cls, ms) {
  if (el.classList.contains("hidden")) return;
  clearTimeout(timer);
  pose(name, cls);
  timer = setTimeout(() => pose("sit"), ms);
}

export function cheer() {
  brief("cheer", "cheer", 1400);
}

export function point() {
  brief("point", "", 2200);
}
