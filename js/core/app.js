// The app shell: the menu, moving between games, Help and the music toggle.
import * as Sound from "./sound.js";
import * as Buddy from "./buddy.js";
import { newVisit } from "./session.js";
import { renderStars } from "./rewards.js";
import { fit } from "./stage.js";
import { ACCENT, shade } from "../art/theme.js";
import { spriteSvg, useIcon } from "../art/ui.js";
import { cardSvg } from "../art/cards.js";
import { catSvg } from "../art/mascot.js";
import { backdropSvg } from "../art/backdrops.js";
import { HELP } from "../logic/lines.js";

const HOME_TITLE = "Landon's Game Room";

let list = [];
let games = {};
let currentGame = null;

const homeBtn = document.getElementById("home-btn");
const helpBtn = document.getElementById("help-btn");
const titleText = document.getElementById("title-text");
const titleBadge = document.getElementById("title-badge");

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
  const info = list.find((g) => g.id === name);
  titleText.textContent = info.title;
  titleBadge.textContent = "";
  Buddy.show(!info.noBuddy);
  show(name);
  games[name].start();
}

export function goHome() {
  Sound.click();
  if (currentGame && games[currentGame].stop) games[currentGame].stop();
  newVisit();
  currentGame = null;
  Sound.hush();
  titleText.textContent = HOME_TITLE;
  titleBadge.textContent = "";
  Buddy.show(false);
  show("menu");
}

/* Best-effort landscape lock. iPad Safari doesn't allow locking from the
   browser (the rotate prompt covers portrait instead), but browsers that
   support the Screen Orientation API will honor this. */
function tryLockLandscape() {
  try {
    const orientation = /** @type {any} */ (screen.orientation);
    if (orientation && orientation.lock) orientation.lock("landscape").catch(() => {});
  } catch (_) {}
}

function buildMenu() {
  const grid = document.getElementById("menu-grid");
  grid.innerHTML = "";
  for (const { id, title } of list) {
    const card = document.createElement("button");
    card.className = "game-card";
    card.dataset.game = id;
    card.style.setProperty("--tint", shade(ACCENT[id], 0.72));
    card.style.setProperty("--deep", shade(ACCENT[id], -0.08));
    card.innerHTML = `<span class="card-window">${cardSvg(id)}</span><span class="card-name">${title}</span>`;
    card.addEventListener("click", () => openGame(id));
    grid.appendChild(card);
  }
  document.querySelector("#screen-menu .backdrop").innerHTML = backdropSvg("menu");
  document.getElementById("menu-cat").innerHTML = catSvg({ pose: "wave", size: 118 });
}

export function start(gameList) {
  list = gameList;
  games = Object.fromEntries(gameList.map((g) => [g.id, g.game]));

  // the interface icons, and each [data-icon] element's icon
  document.body.insertAdjacentHTML("afterbegin", spriteSvg());
  document.querySelectorAll("[data-icon]").forEach((el) => {
    el.insertAdjacentHTML("afterbegin", useIcon(/** @type {HTMLElement} */ (el).dataset.icon));
  });

  buildMenu();
  homeBtn.addEventListener("click", goHome);

  // Help: asking is ALWAYS rewarded, never penalized. It speaks a 2-word
  // request out loud (modeling his AAC goal), then the current game gives
  // a genuine hint while the cat points to it.
  helpBtn.addEventListener("click", () => {
    Sound.ensure();
    Sound.speak(HELP);
    Buddy.point();
    if (currentGame && games[currentGame].hint) games[currentGame].hint();
  });

  const musicBtn = document.getElementById("music-btn");
  musicBtn.addEventListener("click", () => {
    const on = !Sound.isMusicOn();
    Sound.setMusic(on);
    musicBtn.classList.toggle("off", !on);
  });

  tryLockLandscape();
  window.addEventListener("pointerdown", tryLockLandscape, { once: true });

  titleText.textContent = HOME_TITLE;
  renderStars();
  fit();
  if (document.fonts) document.fonts.ready.then(fit);
}

export function current() {
  return currentGame;
}
