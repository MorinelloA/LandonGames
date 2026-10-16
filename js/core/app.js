// The app shell: the menu, moving between games, Help and the music toggle.
import * as Sound from "./sound.js";
import { newVisit } from "./session.js";
import { renderStars } from "./rewards.js";

let games = {};
let currentGame = null;

const homeBtn = document.getElementById("home-btn");
const helpBtn = document.getElementById("help-btn");

function show(screenId) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById("screen-" + screenId).classList.add("active");
  homeBtn.classList.toggle("hidden", screenId === "menu");
  helpBtn.classList.toggle("hidden", screenId === "menu");
}

export function openGame(name) {
  if (!games[name]) return;
  Sound.ensure();
  Sound.click();
  if (currentGame && games[currentGame].stop) games[currentGame].stop();
  newVisit();
  currentGame = name;
  show(name);
  games[name].start();
}

export function goHome() {
  Sound.click();
  if (currentGame && games[currentGame].stop) games[currentGame].stop();
  newVisit();
  currentGame = null;
  Sound.hush();
  show("menu");
}

/* Best-effort landscape lock. iPad Safari doesn't allow locking from the
   browser (the CSS rotate overlay covers portrait instead), but browsers
   that support the Screen Orientation API will honor this. */
function tryLockLandscape() {
  try {
    const orientation = /** @type {any} */ (screen.orientation);
    if (orientation && orientation.lock) orientation.lock("landscape").catch(() => {});
  } catch (_) {}
}

export function start(registry) {
  games = registry;

  document.querySelectorAll(".game-card").forEach((card) => {
    card.addEventListener("click", () => openGame(/** @type {HTMLElement} */ (card).dataset.game));
  });
  homeBtn.addEventListener("click", goHome);

  // Help: asking is ALWAYS rewarded, never penalized. It speaks a 2-word
  // request out loud (modeling his AAC goal), then the current game gives
  // a genuine hint.
  helpBtn.addEventListener("click", () => {
    Sound.ensure();
    Sound.speak("Help please");
    if (currentGame && games[currentGame].hint) games[currentGame].hint();
  });

  const musicBtn = document.getElementById("music-btn");
  musicBtn.classList.add("off");
  musicBtn.addEventListener("click", () => {
    const on = !Sound.isMusicOn();
    Sound.setMusic(on);
    musicBtn.classList.toggle("off", !on);
  });

  tryLockLandscape();
  window.addEventListener("pointerdown", tryLockLandscape, { once: true });

  renderStars();
}

export function current() {
  return currentGame;
}
