// Feelings: hear a little story, then drag the face that shows how the
// character feels onto the scene (IEP ELA goal). Three right first time
// in a row levels up; two misses in a row ease back down.
import * as Sound from "../core/sound.js";
import * as Drag from "../core/drag.js";
import { later } from "../core/session.js";
import { awardStars } from "../core/rewards.js";
import { freeze } from "../core/freeze.js";
import { shuffle } from "../core/rng.js";
import { glow } from "../core/hint.js";
import { createLevel } from "../core/levels.js";
import { FACES, LEVELS, CLEAN_TO_LEVEL_UP, MISSES_TO_EASE_DOWN, storiesFor, question, choicesFor } from "../logic/feelings.js";

const sceneEl = document.getElementById("feel-scene");
const sentenceEl = document.getElementById("feel-sentence");
const facesEl = document.getElementById("feel-faces");
const levelEl = document.getElementById("feel-level");
const hearBtn = document.getElementById("feel-hear");

const level = createLevel({ key: "landon-feelings-level", max: LEVELS.length });
let cleanStreak = 0;
let missStreak = 0;
let deck = [];
let current = null;
let hadError = false;
let running = false;

function renderLevel() {
  levelEl.textContent = "Level " + level.value;
}

// the story, then the question, queued so the question never cuts it off
function speakStory() {
  if (current) Sound.say([current.text, question(current)]);
}

function nextRound() {
  if (deck.length === 0) deck = shuffle(storiesFor(level.value));
  current = deck.pop();
  hadError = false;

  sceneEl.textContent = current.scene;
  sentenceEl.textContent = current.text;

  facesEl.innerHTML = "";
  choicesFor(current, level.value).forEach((feeling) => {
    const face = document.createElement("button");
    face.className = "feel-face";
    face.textContent = FACES[feeling];
    face.dataset.feeling = feeling;
    face.setAttribute("aria-label", feeling);
    face.addEventListener("click", () => resolve(face, feeling));
    Drag.enable(face, {
      canDrag: () => running,
      targets: () => [sceneEl],
      onPickup: () => Sound.click(),
      onDrop: (t) => {
        if (!t || !current) return false;
        const isRight = feeling === current.answer; // resolve() clears `current` on success
        resolve(face, feeling);
        return isRight;
      },
    });
    facesEl.appendChild(face);
  });

  speakStory();
}

function resolve(face, feeling) {
  if (!running || !current) return;
  if (feeling === current.answer) {
    Sound.pop();
    face.classList.add("pop");
    Sound.speak(feeling + "! That's right!");
    missStreak = 0;
    if (!hadError) {
      cleanStreak++;
      if (cleanStreak >= CLEAN_TO_LEVEL_UP && level.value < LEVELS.length) {
        level.up();
        cleanStreak = 0;
        deck = [];
        renderLevel();
        awardStars(1, { message: "Level " + level.value + "! 🚀" });
      } else {
        awardStars(1, { celebrate: false });
        Sound.success();
      }
    } else {
      cleanStreak = 0;
      Sound.success();
    }
    current = null;
    later(nextRound, 1800);
  } else {
    hadError = true;
    cleanStreak = 0;
    missStreak++;
    if (missStreak >= MISSES_TO_EASE_DOWN && level.value > 1) {
      level.down(); // quietly give him a breather
      missStreak = 0;
      deck = [];
      renderLevel();
    }
    face.classList.add("wrong");
    setTimeout(() => face.classList.remove("wrong"), 450);
    freeze(); // silence + a short pause: mistakes earn no sounds
  }
}

hearBtn.addEventListener("click", () => {
  Sound.click();
  speakStory();
});

export default {
  start() {
    running = true;
    cleanStreak = 0;
    missStreak = 0;
    deck = [];
    renderLevel();
    later(nextRound);
  },
  stop() {
    running = false;
  },
  hint() {
    if (current) {
      glow(/** @type {HTMLElement[]} */ ([...facesEl.children]).find((f) => f.dataset.feeling === current.answer));
    }
  },
};
