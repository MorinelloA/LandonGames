// Music Maker: a xylophone to play freely, plus follow-the-glowing-bar
// songs. Wrong notes in a song are fine: it's free exploration, with no
// penalty. Bars run a rainbow up the scale, as Marble Run's notes do.
import * as Sound from "../core/sound.js";
import { later } from "../core/session.js";
import { awardStars } from "../core/rewards.js";
import { glow } from "../core/hint.js";
import { KEYS, SONGS } from "../logic/music.js";
import { NOTES, WORLD, shade } from "../art/theme.js";
import { malletSvg } from "../art/gameart.js";
import { iconImg } from "../art/icons.js";
import { backdropSvg } from "../art/backdrops.js";
import { g, rect, path, svg } from "../art/svg.js";

const screen = document.getElementById("screen-music");
const xylo = document.getElementById("xylophone");
const frameEl = document.getElementById("xylo-frame");
const mallet = document.getElementById("mallet");
const freeBtn = document.getElementById("music-free");
const songBtns = /** @type {HTMLElement[]} */ ([...document.querySelectorAll(".song-btn")]);
mallet.innerHTML = malletSvg();
songBtns.forEach((b) => b.insertAdjacentHTML("afterbegin", iconImg(b.dataset.pic, 38)));

const BAR_W = 90, GAP = 16, TALL = 400, STEP = 22, MID = 220;
const heightOf = (i) => TALL - i * STEP;

// the wooden frame: two rails that close in as the bars get shorter
function frame() {
  const x = (i) => 28 + i * (BAR_W + GAP) + BAR_W / 2;
  const rail = (f) => {
    const y0 = MID + (f - 0.5) * heightOf(0), y1 = MID + (f - 0.5) * heightOf(7);
    return path(`M${x(0) - 70} ${y0 - 6}L${x(7) + 70} ${y1 - 3}`, { stroke: WORLD.woodDeep, strokeWidth: 26, strokeLinecap: "round" });
  };
  return svg(900, 440, g({},
    rect(40, 410, 820, 16, { rx: 8, fill: "rgba(74,52,38,0.12)" }),
    rail(0.18), rail(0.68),
  ));
}

let bars = [];
let song = null;  // the follow-along song's key indexes
let songPos = 0;
let running = false;
let drawn = false;

function build() {
  xylo.innerHTML = "";
  bars = KEYS.map((k, i) => {
    const bar = document.createElement("button");
    bar.className = "xylo-bar";
    bar.textContent = k.name;
    bar.setAttribute("aria-label", k.name);
    const c = NOTES[i];
    bar.style.setProperty("--c", c);
    bar.style.setProperty("--deep", shade(c, -0.14));
    bar.style.setProperty("--ink-c", shade(c, -0.55));
    bar.style.setProperty("--h", heightOf(i) + "px");
    bar.addEventListener("pointerdown", () => tapBar(i));
    xylo.appendChild(bar);
    return bar;
  });
}

function strike(i) {
  const r = bars[i];
  mallet.style.left = 120 + r.offsetLeft + BAR_W / 2 + 4 + "px";
  mallet.style.top = 30 + r.offsetTop - 120 + "px";
  mallet.classList.remove("strike");
  void mallet.offsetWidth;
  mallet.classList.add("strike");
}

function playKey(i) {
  const freq = Sound.N[KEYS[i].note];
  Sound.tone(freq, { type: "triangle", dur: 0.5, gain: 0.28 });
  Sound.tone(freq * 2, { type: "sine", dur: 0.3, gain: 0.08 }); // sparkle overtone
  bars[i].classList.add("playing");
  setTimeout(() => bars[i].classList.remove("playing"), 160);
  strike(i);
}

function tapBar(i) {
  if (!running) return;
  playKey(i);
  if (song && i === song[songPos]) {
    bars[i].classList.remove("next-note");
    songPos++;
    if (songPos >= song.length) {
      song = null;
      clearSongButtons();
      later(() => {
        Sound.fanfare();
        awardStars(2, { message: "You played the song!" });
      }, 400);
    } else {
      highlightNext();
    }
  }
}

function highlightNext() {
  bars.forEach((b) => b.classList.remove("next-note"));
  bars[song[songPos]].classList.add("next-note");
}

function clearSongButtons() {
  songBtns.forEach((b) => b.classList.remove("on"));
  freeBtn.classList.add("on");
  bars.forEach((b) => b.classList.remove("next-note"));
}

function startSong(name, btn) {
  Sound.click();
  clearSongButtons();
  freeBtn.classList.remove("on");
  btn.classList.add("on");
  song = SONGS[name].keys;
  songPos = 0;
  Sound.speak("Let's play " + SONGS[name].name + "! Follow the glowing bar.");
  highlightNext();
}

songBtns.forEach((btn) => btn.addEventListener("click", () => running && startSong(btn.dataset.song, btn)));

freeBtn.addEventListener("click", () => {
  if (!running) return;
  Sound.click();
  song = null;
  clearSongButtons();
});

export default {
  start() {
    if (!drawn) {
      screen.querySelector(".backdrop").innerHTML = backdropSvg("music");
      frameEl.innerHTML = frame();
      drawn = true;
    }
    running = true;
    song = null;
    build();
    clearSongButtons();
  },
  stop() {
    running = false;
    song = null;
  },
  hint() {
    if (song) glow(bars[song[songPos]]);
    else Sound.speak("Tap the bars to make music!");
  },
};
