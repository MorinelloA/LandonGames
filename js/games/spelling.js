// Word Builder: drag letters into slots to spell the word; the iPad says
// the word aloud. Three perfect words level up; a hard word eases back.
import * as Sound from "../core/sound.js";
import * as Drag from "../core/drag.js";
import { later } from "../core/session.js";
import { awardStars } from "../core/rewards.js";
import { freeze } from "../core/freeze.js";
import { shuffle } from "../core/rng.js";
import { glow } from "../core/hint.js";
import { createLevel } from "../core/levels.js";
import { LEVELS, CLEAN_TO_LEVEL_UP, ERRORS_TO_EASE_DOWN, wordPool, deal } from "../logic/words.js";

const pictureEl = document.getElementById("spell-picture");
const slotsEl = document.getElementById("spell-slots");
const lettersEl = document.getElementById("spell-letters");
const hearBtn = document.getElementById("spell-hear");
const levelEl = document.getElementById("spell-level");

const level = createLevel({ key: "landon-word-level", max: LEVELS.length });
let cleanStreak = 0; // words finished without any mistakes
let deck = [];
let word = "";
let filled = [];     // letter placed in each slot (or null)
let errors = 0;      // mistakes on the current word
let running = false;

function renderLevel() {
  levelEl.textContent = "Level " + level.value;
}

function nextWord() {
  if (deck.length === 0) deck = shuffle(wordPool(level.value));
  const entry = deck.pop();
  word = entry.word;
  filled = Array(word.length).fill(null);
  errors = 0;
  pictureEl.textContent = entry.emoji;

  slotsEl.innerHTML = "";
  for (let i = 0; i < word.length; i++) {
    const s = document.createElement("div");
    s.className = "spell-slot";
    s.dataset.idx = String(i);
    slotsEl.appendChild(s);
  }

  lettersEl.innerHTML = "";
  deal(word, LEVELS[level.value - 1].decoys).forEach((ch) => {
    const t = document.createElement("button");
    t.className = "letter-tile";
    t.textContent = ch;
    // tap fills the next empty slot (if this letter belongs there)
    t.addEventListener("click", () => {
      const next = filled.indexOf(null);
      if (next !== -1) placeLetter(t, ch, next);
    });
    // drag onto any empty slot
    Drag.enable(t, {
      canDrag: () => running && !t.classList.contains("used"),
      targets: () => [...slotsEl.children].filter((s) => !s.classList.contains("filled")),
      onPickup: () => Sound.click(),
      onDrop: (slot) => {
        if (!slot) return false;
        return placeLetter(t, ch, parseInt(/** @type {HTMLElement} */ (slot).dataset.idx, 10));
      },
    });
    lettersEl.appendChild(t);
  });

  Sound.speak(word);
}

function placeLetter(tile, ch, idx) {
  if (!running || tile.classList.contains("used") || filled[idx] !== null) return false;
  if (ch === word[idx]) {
    Sound.click();
    tile.classList.add("used");
    filled[idx] = ch;
    const slot = slotsEl.children[idx];
    slot.textContent = ch;
    slot.classList.add("filled");
    if (!filled.includes(null)) wordDone();
    return true;
  }
  errors++;
  tile.classList.add("wrong");
  setTimeout(() => tile.classList.remove("wrong"), 450);
  freeze(); // silence + a short pause: mistakes earn no sounds
  return false;
}

function wordDone() {
  Sound.success();
  later(() => Sound.speak(word + "! Great job!"), 250);

  // adapt: three perfect words in a row → harder; a really tough word → easier
  if (errors === 0) {
    cleanStreak++;
    if (cleanStreak >= CLEAN_TO_LEVEL_UP && level.value < LEVELS.length) {
      level.up();
      cleanStreak = 0;
      deck = [];
      renderLevel();
      awardStars(2, { message: "Level " + level.value + "! 🚀" });
      Sound.speak("Level up!");
      later(nextWord, 2100);
      return;
    }
  } else {
    cleanStreak = 0;
    if (errors >= ERRORS_TO_EASE_DOWN && level.value > 1) {
      level.down(); // quietly give him a breather
      deck = [];
      renderLevel();
    }
  }
  awardStars(1, { message: word.toUpperCase() + "! 🌟" });
  later(nextWord, 1900);
}

hearBtn.addEventListener("click", () => {
  Sound.click();
  if (word) Sound.speak(word);
});

export default {
  start() {
    running = true;
    cleanStreak = 0;
    deck = [];
    renderLevel();
    nextWord();
  },
  stop() {
    running = false;
  },
  hint() {
    const next = filled.indexOf(null);
    if (next === -1) return;
    glow([...lettersEl.children].find((t) => !t.classList.contains("used") && t.textContent === word[next]));
  },
};
