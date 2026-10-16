// Copy Cat: watch and listen to the growing pattern, then repeat it.
// Forgiving: a mistake never ends the game — after the quiet pause, the
// same pattern plays again so he can try again.
import * as Sound from "../core/sound.js";
import { awardStars } from "../core/rewards.js";
import { freeze } from "../core/freeze.js";

const padsEl = document.getElementById("simon-pads");
const pads = Array.from(document.querySelectorAll(".simon-pad"));
const statusEl = document.getElementById("simon-status");
const roundEl = document.getElementById("simon-round");
const startBtn = document.getElementById("simon-start");

const notes = [Sound.N.C4, Sound.N.E4, Sound.N.G4, Sound.N.C5];

let sequence = [];
let playerPos = 0;
let playing = false;   // the pattern is being shown
let active = false;    // a game is in progress
let running = false;   // the screen is open
let timeouts = [];

// Copy Cat keeps its own timers: Restart has to cancel a pattern that's
// mid-show without leaving the screen.
function later(fn, ms) {
  timeouts.push(setTimeout(fn, ms));
}

function clearTimers() {
  timeouts.forEach(clearTimeout);
  timeouts = [];
}

function lightPad(i, dur = 420) {
  pads[i].classList.add("lit");
  Sound.tone(notes[i], { type: "triangle", dur: dur / 1000, gain: 0.25 });
  later(() => pads[i].classList.remove("lit"), dur);
}

function showSequence() {
  playing = true;
  padsEl.classList.add("locked");
  statusEl.textContent = "Watch and listen... 👀";
  sequence.forEach((p, i) => {
    later(() => lightPad(p), 700 + i * 650);
  });
  later(() => {
    playing = false;
    playerPos = 0;
    padsEl.classList.remove("locked");
    statusEl.textContent = "Your turn! Copy the pattern! 🐱";
  }, 700 + sequence.length * 650);
}

function nextRound() {
  sequence.push(Math.floor(Math.random() * 4));
  roundEl.textContent = "Pattern length: " + sequence.length;
  showSequence();
}

function tapPad(i) {
  if (!running || !active || playing) return;
  lightPad(i, 300);
  if (i === sequence[playerPos]) {
    playerPos++;
    if (playerPos === sequence.length) {
      padsEl.classList.add("locked");
      const len = sequence.length;
      later(() => {
        if (len >= 3 && len % 3 === 0) {
          awardStars(1, { message: len + " in a row! 🌟" });
        } else {
          Sound.success();
        }
        later(nextRound, 900);
      }, 500);
    }
  } else {
    // silence and a short pause first: mistakes earn no sounds
    padsEl.classList.add("locked");
    statusEl.textContent = "Let's watch it again.";
    freeze(3000, () => { if (running && active) showSequence(); });
  }
}

pads.forEach((p, i) => p.addEventListener("click", () => tapPad(i)));

startBtn.addEventListener("click", () => {
  if (!running) return;
  Sound.click();
  clearTimers();
  sequence = [];
  active = true;
  startBtn.textContent = "🔄 Restart";
  nextRound();
});

export default {
  start() {
    running = true;
    active = false;
    sequence = [];
    roundEl.textContent = "";
    startBtn.textContent = "▶️ Start";
    statusEl.textContent = "Watch and listen, then copy the pattern!";
    padsEl.classList.remove("locked");
  },
  stop() {
    running = false;
    active = false;
    clearTimers();
    pads.forEach((p) => p.classList.remove("lit"));
    padsEl.classList.remove("locked");
  },
  hint() {
    // replay the pattern — asking to see it again is always free
    if (active && !playing) {
      playerPos = 0;
      showSequence();
    }
  },
};
