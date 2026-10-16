// Sort It!: find things by class, function and feature (IEP speech goal):
// a field of 3, the prompt spoken aloud, the right one dragged into the bin.
import * as Sound from "../core/sound.js";
import * as Drag from "../core/drag.js";
import { later } from "../core/session.js";
import { awardStars } from "../core/rewards.js";
import { freeze } from "../core/freeze.js";
import { shuffle } from "../core/rng.js";
import { glow } from "../core/hint.js";
import { MODES, STAR_EVERY, makeRound } from "../logic/sortit.js";

const promptEl = document.getElementById("sort-prompt");
const binEl = document.getElementById("sort-bin");
const binLabelEl = document.getElementById("sort-bin-label");
const cardsEl = document.getElementById("sort-cards");
const hearBtn = document.getElementById("sort-hear");

let modeIdx = 0;
let round = null;
let solved = 0;
let running = false;

function nextRound() {
  round = makeRound(MODES[modeIdx % MODES.length]);
  modeIdx++;

  promptEl.textContent = round.prompt;
  binEl.querySelector(".sort-bin-emoji").textContent = round.bin;
  binLabelEl.textContent = round.prompt;

  cardsEl.innerHTML = "";
  shuffle(round.choices).forEach((emoji) => {
    const card = document.createElement("button");
    card.className = "sort-card";
    card.textContent = emoji;
    card.addEventListener("click", () => resolve(card, emoji));
    Drag.enable(card, {
      canDrag: () => running,
      targets: () => [binEl],
      onPickup: () => Sound.click(),
      onDrop: (t) => {
        if (!t) return false;
        const right = emoji === round.correct;
        resolve(card, emoji);
        return right;
      },
    });
    cardsEl.appendChild(card);
  });

  Sound.speak(round.say);
}

function resolve(card, emoji) {
  if (!running) return;
  if (emoji === round.correct) {
    Sound.pop();
    card.classList.add("pop");
    solved++;
    binEl.classList.add("sort-bin-happy");
    setTimeout(() => binEl.classList.remove("sort-bin-happy"), 500);
    if (solved % STAR_EVERY === 0) {
      awardStars(1);
    } else {
      Sound.success();
    }
    later(nextRound, 1100);
  } else {
    card.classList.add("wrong");
    setTimeout(() => card.classList.remove("wrong"), 450);
    freeze(); // silence + a short pause: mistakes earn no sounds
  }
}

hearBtn.addEventListener("click", () => {
  Sound.click();
  if (round) Sound.speak(round.say);
});

export default {
  start() {
    running = true;
    solved = 0;
    modeIdx = Math.floor(Math.random() * MODES.length);
    later(nextRound);
  },
  stop() {
    running = false;
  },
  hint() {
    if (round) glow([...cardsEl.children].find((c) => c.textContent === round.correct));
  },
};
