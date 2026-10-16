// Stars, celebrations and confetti. Stars add up across every game and are
// kept on the device under the old "landon-stars" key.
import * as Sound from "./sound.js";
import { pick } from "./rng.js";

const STARS_KEY = "landon-stars";
const starTotalEl = document.getElementById("star-total");
let stars = 0;
try {
  stars = parseInt(localStorage.getItem(STARS_KEY) || "0", 10) || 0;
} catch (_) {}

export function renderStars() {
  starTotalEl.textContent = String(stars);
}

export function awardStars(n, { celebrate = true, message = null } = {}) {
  stars += n;
  try {
    localStorage.setItem(STARS_KEY, String(stars));
  } catch (_) {}
  renderStars();
  Sound.star();
  if (celebrate) {
    showCelebration(message || pick(PRAISE));
    confettiBurst();
  }
}

const PRAISE = ["Great job! 🌟", "You did it! 🎉", "Awesome! ⭐", "Way to go! 🙌", "Super! 🚀", "Amazing! 🌈"];

const celebrationEl = document.getElementById("celebration");
const celebrationText = document.getElementById("celebration-text");
let celebrationTimer = null;
export function showCelebration(text) {
  celebrationText.textContent = text;
  celebrationEl.classList.remove("hidden");
  // restart the CSS animation
  celebrationText.style.animation = "none";
  void celebrationText.offsetWidth;
  celebrationText.style.animation = "";
  clearTimeout(celebrationTimer);
  celebrationTimer = setTimeout(() => celebrationEl.classList.add("hidden"), 1700);
}

const confettiLayer = document.getElementById("confetti-layer");
const CONFETTI = ["🎉", "⭐", "🌟", "💛", "💙", "💜", "🧡", "✨"];
export function confettiBurst(count = 24) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "confetti";
    el.textContent = pick(CONFETTI);
    el.style.left = Math.random() * 100 + "vw";
    el.style.animationDuration = 1.6 + Math.random() * 1.6 + "s";
    el.style.animationDelay = Math.random() * 0.4 + "s";
    el.style.fontSize = 18 + Math.random() * 20 + "px";
    confettiLayer.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}
