// Feelings: hear a little story, then drag the face that shows how the
// character feels onto the story (IEP ELA goal). The story's picture shows
// what happened with the character's face neutral; once the right face is
// dropped, the character wears it. Three right first time in a row levels
// up; two misses in a row ease back down.
import * as Sound from "../core/sound.js";
import * as Drag from "../core/drag.js";
import { later } from "../core/session.js";
import { awardStars } from "../core/rewards.js";
import { freeze } from "../core/freeze.js";
import { shuffle } from "../core/rng.js";
import { glow } from "../core/hint.js";
import { createLevel } from "../core/levels.js";
import { LEVELS, CLEAN_TO_LEVEL_UP, MISSES_TO_EASE_DOWN, storiesFor, question, choicesFor } from "../logic/feelings.js";
import { storyScene } from "../art/scenes.js";
import { faceSvg } from "../art/people.js";
import { useIcon } from "../art/ui.js";

const sceneEl = document.getElementById("feel-scene");
const dropEl = document.getElementById("feel-drop");
const sentenceEl = document.getElementById("feel-sentence");
const questionEl = document.getElementById("feel-question");
const facesEl = document.getElementById("feel-faces");
const levelEl = document.getElementById("title-badge");
const hearBtn = document.getElementById("feel-hear");
hearBtn.innerHTML = useIcon("speaker");

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

  sceneEl.innerHTML = storyScene(current.id);
  sentenceEl.textContent = current.text;
  questionEl.textContent = question(current);

  facesEl.innerHTML = "";
  for (const feeling of choicesFor(current, level.value)) {
    const card = document.createElement("button");
    card.className = "face-card";
    card.dataset.feeling = feeling;
    card.setAttribute("aria-label", feeling);
    card.innerHTML = faceSvg({ who: current.who, mood: feeling, size: 96 }) + `<span>${feeling}</span>`;
    card.addEventListener("click", () => resolve(card, feeling));
    Drag.enable(card, {
      canDrag: () => running && !!current,
      targets: () => [dropEl],
      onPickup: () => { Sound.click(); dropEl.classList.add("armed"); },
      onEnd: () => dropEl.classList.remove("armed"),
      onDrop: (t) => {
        if (!t || !current) return false;
        const isRight = feeling === current.answer; // resolve() clears `current` on success
        resolve(card, feeling);
        return isRight;
      },
    });
    facesEl.appendChild(card);
  }

  speakStory();
}

function resolve(card, feeling) {
  if (!running || !current) return;
  if (feeling === current.answer) {
    Sound.pop();
    card.classList.add("chosen");
    sceneEl.innerHTML = storyScene(current.id, feeling); // now the character shows it
    Sound.speak(feeling + "! That's right!");
    missStreak = 0;
    if (!hadError) {
      cleanStreak++;
      if (cleanStreak >= CLEAN_TO_LEVEL_UP && level.value < LEVELS.length) {
        level.up();
        cleanStreak = 0;
        deck = [];
        renderLevel();
        awardStars(1, { message: "Level " + level.value + "!" });
      } else {
        awardStars(1, { celebrate: false });
        Sound.success();
      }
    } else {
      cleanStreak = 0;
      Sound.success();
    }
    current = null;
    later(nextRound, 2400);
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
    card.classList.add("wrong");
    setTimeout(() => card.classList.remove("wrong"), 450);
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
