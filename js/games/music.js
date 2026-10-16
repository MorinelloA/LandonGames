// Music Maker: a free-play xylophone, plus follow-the-glowing-bar songs.
// Wrong notes in a song are fine: it's free exploration, with no penalty.
import * as Sound from "../core/sound.js";
import { later } from "../core/session.js";
import { awardStars } from "../core/rewards.js";
import { glow } from "../core/hint.js";
import { KEYS, SONGS } from "../logic/music.js";

const xylo = document.getElementById("xylophone");
const hintEl = document.getElementById("music-hint");
const freeBtn = document.getElementById("music-free");

let bars = [];
let song = null;  // the follow-along song's key indexes
let songPos = 0;
let running = false;

function build() {
  xylo.innerHTML = "";
  bars = KEYS.map((k, i) => {
    const bar = document.createElement("button");
    bar.className = "xylo-bar";
    bar.textContent = k.name;
    bar.style.setProperty("--bar-color", k.color);
    bar.style.setProperty("--shrink", i * 4.5 + "%"); // classic xylophone taper
    bar.addEventListener("click", () => tapBar(i));
    xylo.appendChild(bar);
    return bar;
  });
}

function playKey(i) {
  const freq = Sound.N[KEYS[i].note];
  Sound.tone(freq, { type: "triangle", dur: 0.5, gain: 0.28 });
  Sound.tone(freq * 2, { type: "sine", dur: 0.3, gain: 0.08 }); // sparkle overtone
  bars[i].classList.add("playing");
  setTimeout(() => bars[i].classList.remove("playing"), 250);
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
        awardStars(2, { message: "You played the song! 🎶" });
        hintEl.textContent = "Tap the bars to make music!";
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
  document.querySelectorAll(".song-btn").forEach((b) => b.classList.remove("active-song"));
  bars.forEach((b) => b.classList.remove("next-note"));
}

function startSong(name, btn) {
  Sound.click();
  clearSongButtons();
  btn.classList.add("active-song");
  song = SONGS[name].keys;
  songPos = 0;
  hintEl.textContent = "Follow the glowing bar to play " + SONGS[name].name + "!";
  highlightNext();
}

document.querySelectorAll(".song-btn").forEach((btn) => {
  btn.addEventListener("click", () => running && startSong(/** @type {HTMLElement} */ (btn).dataset.song, btn));
});

freeBtn.addEventListener("click", () => {
  if (!running) return;
  Sound.click();
  song = null;
  clearSongButtons();
  hintEl.textContent = "Tap the bars to make music!";
});

export default {
  start() {
    running = true;
    song = null;
    build();
    clearSongButtons();
    hintEl.textContent = "Tap the bars to make music!";
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
