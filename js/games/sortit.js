// Sort It!: find things by class, function and feature (IEP speech goal):
// a field of 3, the prompt spoken aloud, the right one dragged into the
// bin. A wrong choice gets the quiet pause; no wrong choice is ever also
// right (see js/logic/sortit.js).
import * as Sound from "../core/sound.js";
import * as Drag from "../core/drag.js";
import { later } from "../core/session.js";
import { awardStars } from "../core/rewards.js";
import { freeze } from "../core/freeze.js";
import { shuffle } from "../core/rng.js";
import { glow } from "../core/hint.js";
import { flyInto, flash } from "../core/fx.js";
import { MODES, STAR_EVERY, makeRound, sizeOf } from "../logic/sortit.js";
import { iconImg } from "../art/icons.js";
import { binSvg } from "../art/gameart.js";
import { backdropSvg } from "../art/backdrops.js";
import { useIcon } from "../art/ui.js";

const screen = document.getElementById("screen-sortit");
const promptEl = document.getElementById("sort-prompt");
const binEl = document.getElementById("sort-bin");
const cardsEl = document.getElementById("sort-cards");
const hearBtn = document.getElementById("sort-hear");
hearBtn.innerHTML = useIcon("speaker");

let modeIdx = 0;
let round = null;
let solved = 0;
let running = false;
let drawn = false;

function nextRound() {
  round = makeRound(MODES[modeIdx % MODES.length]);
  modeIdx++;

  promptEl.textContent = round.prompt;
  binEl.innerHTML = binSvg(round.bin);

  cardsEl.innerHTML = "";
  for (const item of shuffle(round.choices)) {
    const card = document.createElement("button");
    card.className = "pic-card" + (round.sized ? " size-" + sizeOf(item) : "");
    card.dataset.item = item;
    card.setAttribute("aria-label", item.replace(/_/g, " "));
    card.innerHTML = iconImg(item, 168);
    card.addEventListener("click", () => resolve(card, item));
    Drag.enable(card, {
      canDrag: () => running && !!round,
      targets: () => [binEl],
      onPickup: () => { Sound.click(); binEl.classList.add("armed"); },
      onEnd: () => binEl.classList.remove("armed"),
      onDrop: (t) => {
        if (!t || !round) return false;
        const right = item === round.correct;
        resolve(card, item);
        return right;
      },
    });
    cardsEl.appendChild(card);
  }

  Sound.speak(round.say);
}

function resolve(card, item) {
  if (!running || !round) return;
  if (item === round.correct) {
    Sound.pop();
    flyInto(card, binEl);
    flash(binEl, "happy");
    solved++;
    if (solved % STAR_EVERY === 0) {
      awardStars(1);
    } else {
      Sound.success();
    }
    round = null;
    later(nextRound, 1300);
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
    if (!drawn) {
      screen.querySelector(".backdrop").innerHTML = backdropSvg("playroom");
      drawn = true;
    }
    running = true;
    solved = 0;
    modeIdx = Math.floor(Math.random() * MODES.length);
    later(nextRound);
  },
  stop() {
    running = false;
  },
  hint() {
    if (round) glow(/** @type {HTMLElement[]} */ ([...cardsEl.children]).find((c) => c.dataset.item === round.correct));
  },
};
