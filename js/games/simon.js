// Copy Cat: the cat plays a growing pattern on four pads — each its own
// colour AND shape — then it's his turn to copy it. Forgiving: a mistake
// never ends the game; after the quiet pause the same pattern plays again.
import * as Sound from "../core/sound.js";
import { awardStars } from "../core/rewards.js";
import { freeze } from "../core/freeze.js";
import { catSvg } from "../art/mascot.js";
import { PADS, padSvg } from "../art/gameart.js";
import { shade } from "../art/theme.js";
import { backdropSvg } from "../art/backdrops.js";

const screen = document.getElementById("screen-simon");
const padsEl = document.getElementById("simon-pads");
const pads = /** @type {HTMLElement[]} */ (Array.from(document.querySelectorAll(".simon-pad")));
const catEl = document.getElementById("simon-cat");
const saysEl = document.getElementById("simon-says");
const levelEl = document.getElementById("title-badge");
const startBtn = document.getElementById("simon-start");
const startLabel = document.createElement("span");
startBtn.appendChild(startLabel);
startBtn.childNodes.forEach((n) => { if (n.nodeType === 3) n.remove(); });

const notes = [Sound.N.C4, Sound.N.E4, Sound.N.G4, Sound.N.C5];

pads.forEach((p, i) => {
  const c = PADS[i].color;
  p.style.setProperty("--c", c);
  p.style.setProperty("--soft", shade(c, 0.45));
  p.style.setProperty("--deep", shade(c, -0.15));
  p.style.setProperty("--glow-c", shade(c, 0.3));
  p.innerHTML = padSvg(i, 112);
});

let sequence = [];
let playerPos = 0;
let playing = false;   // the cat is showing the pattern
let active = false;    // a game is in progress
let running = false;   // the screen is open
let timeouts = [];
let drawn = false;

// Copy Cat keeps its own timers: Restart has to cancel a pattern that's
// mid-show without leaving the screen.
function later(fn, ms) {
  timeouts.push(setTimeout(fn, ms));
}

function clearTimers() {
  timeouts.forEach(clearTimeout);
  timeouts = [];
}

// the cat sits left of the pads, so its pointing paw always reaches right
function catPose(pose) {
  catEl.innerHTML = catSvg({ pose, size: 330 });
}

function says(text) {
  saysEl.textContent = text;
}

function lightPad(i, dur = 420, byCat = false) {
  pads[i].classList.add("lit");
  if (byCat) catPose("point");
  Sound.tone(notes[i], { type: "triangle", dur: dur / 1000, gain: 0.25 });
  later(() => {
    pads[i].classList.remove("lit");
    if (byCat) catPose("sit");
  }, dur);
}

function showSequence() {
  playing = true;
  padsEl.classList.add("locked");
  says("Watch and listen!");
  sequence.forEach((p, i) => later(() => lightPad(p, 420, true), 700 + i * 650));
  later(() => {
    playing = false;
    playerPos = 0;
    padsEl.classList.remove("locked");
    says("Your turn!");
  }, 700 + sequence.length * 650);
}

function nextRound() {
  sequence.push(Math.floor(Math.random() * 4));
  levelEl.textContent = "Pattern " + sequence.length;
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
        catPose("cheer");
        says("You did it!");
        if (len >= 3 && len % 3 === 0) {
          awardStars(1, { message: len + " in a row!" });
        } else {
          Sound.success();
        }
        later(() => { catPose("sit"); nextRound(); }, 1100);
      }, 400);
    }
  } else {
    // silence and a short pause first: mistakes earn no sounds
    padsEl.classList.add("locked");
    says("Let's watch it again.");
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
  startLabel.textContent = "Again";
  nextRound();
});

export default {
  start() {
    if (!drawn) {
      screen.querySelector(".backdrop").innerHTML = backdropSvg("playroom");
      drawn = true;
    }
    running = true;
    active = false;
    sequence = [];
    levelEl.textContent = "";
    startLabel.textContent = "Start";
    catPose("wave");
    says("Copy me! Press Start.");
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
