// Stars, celebrations and confetti. Stars add up across every game and are
// kept on the device under the old "landon-stars" key. A celebration is the
// cat cheering beside a word of praise; each star then flies up to the
// counter. All of it skips the motion when Reduce Motion is on.
import * as Sound from "./sound.js";
import * as Buddy from "./buddy.js";
import { pick } from "./rng.js";
import { catSvg } from "../art/mascot.js";
import { CONFETTI } from "../art/theme.js";
import { useIcon } from "../art/ui.js";

const STARS_KEY = "landon-stars";
const starTotalEl = document.getElementById("star-total");
const starCountEl = document.getElementById("star-count");
let stars = 0;
try {
  stars = parseInt(localStorage.getItem(STARS_KEY) || "0", 10) || 0;
} catch (_) {}

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function renderStars() {
  starTotalEl.textContent = String(stars);
}

function bumpCounter() {
  renderStars();
  starCountEl.classList.remove("bump");
  void starCountEl.offsetWidth;
  starCountEl.classList.add("bump");
}

// a star flies from the middle of the screen up to the counter
function flyStar() {
  if (reduceMotion() || !starCountEl.animate) {
    bumpCounter();
    return;
  }
  const target = starCountEl.getBoundingClientRect();
  const star = document.createElement("div");
  star.className = "flying-star";
  star.innerHTML = useIcon("star", "ico");
  document.body.appendChild(star);
  const x0 = window.innerWidth / 2 - 32, y0 = window.innerHeight / 2 - 32;
  const x1 = target.left + 4, y1 = target.top - 6;
  star.animate([
    { transform: `translate(${x0}px, ${y0}px) scale(1.4)` },
    { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 60}px) scale(1.1)`, offset: 0.55 },
    { transform: `translate(${x1}px, ${y1}px) scale(0.6)` },
  ], { duration: 900, easing: "ease-in-out" }).onfinish = () => {
    star.remove();
    bumpCounter();
  };
}

export function awardStars(n, { celebrate = true, message = null } = {}) {
  stars += n;
  try {
    localStorage.setItem(STARS_KEY, String(stars));
  } catch (_) {}
  Sound.star();
  Buddy.cheer();
  if (celebrate) {
    showCelebration(message || pick(PRAISE));
    confettiBurst();
    setTimeout(flyStar, 700);
  } else {
    flyStar();
  }
}

// A right answer that doesn't earn a star yet: the chime, and the cat cheers.
export function praise() {
  Sound.success();
  Buddy.cheer();
}

const PRAISE = ["Great job!", "You did it!", "Awesome!", "Way to go!", "Super!", "Amazing!"];

const celebrationEl = document.getElementById("celebration");
const card = /** @type {HTMLElement} */ (celebrationEl.querySelector(".cheer-card"));
const celebrationText = document.getElementById("celebration-text");
document.getElementById("celebration-cat").innerHTML = catSvg({ pose: "cheer", size: 140 });
let celebrationTimer = null;

// pictures in the words are left out: the cat is the picture
export function showCelebration(text) {
  celebrationText.textContent = text.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "").trim();
  celebrationEl.classList.remove("hidden");
  // restart the CSS animation
  card.style.animation = "none";
  void card.offsetWidth;
  card.style.animation = "";
  clearTimeout(celebrationTimer);
  celebrationTimer = setTimeout(() => celebrationEl.classList.add("hidden"), 1700);
}

const confettiLayer = document.getElementById("confetti-layer");
export function confettiBurst(count = 28) {
  if (reduceMotion()) return;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "confetti" + (i % 3 === 0 ? " dot" : "");
    el.style.background = pick(CONFETTI);
    el.style.left = Math.random() * 100 + "vw";
    el.style.animationDuration = 1.8 + Math.random() * 1.4 + "s";
    el.style.animationDelay = Math.random() * 0.35 + "s";
    el.style.rotate = Math.round(Math.random() * 180) + "deg";
    confettiLayer.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}
