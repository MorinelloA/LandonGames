// Counting Time: drag each thing into the basket (or tap it) to count it
// out loud, then pick how many there were. The numbers to pick from only
// appear once everything is counted, so the counting comes first.
import * as Sound from "../core/sound.js";
import * as Drag from "../core/drag.js";
import { later } from "../core/session.js";
import { awardStars } from "../core/rewards.js";
import { freeze } from "../core/freeze.js";
import { shuffle, pick } from "../core/rng.js";
import { glow } from "../core/hint.js";
import { flyInto, flash } from "../core/fx.js";
import { THEMES, newTarget, answerOptions } from "../logic/counting.js";
import { iconImg } from "../art/icons.js";
import { binSvg } from "../art/gameart.js";
import { backdropSvg } from "../art/backdrops.js";
import { useIcon } from "../art/ui.js";

const screen = document.getElementById("screen-counting");
const backdropEl = screen.querySelector(".backdrop");
const area = document.getElementById("count-area");
const answersEl = document.getElementById("count-answers");
const basket = document.getElementById("count-basket");
const basketTag = document.getElementById("basket-tag");
const promptEl = document.getElementById("count-prompt");
const hearBtn = document.getElementById("count-hear");
hearBtn.innerHTML = useIcon("speaker");
basket.insertAdjacentHTML("afterbegin", binSvg("basket"));

// where things can sit: a grid over the stage, clear of the caption, the
// basket, the numbers and the cat
const SPOTS = [];
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 8; col++) {
    const x = 40 + col * 128, y = 104 + row * 124;
    const underBasket = x < 330 && y + 112 > 392;
    const underCat = x + 112 > 960 && y + 112 > 480;
    if (!underBasket && !underCat) SPOTS.push([x, y]);
  }
}

let target = 0;
let counted = 0;
let answered = false;
let running = false;
let theme = null;
let place = "";

function say() {
  Sound.speak("Count the " + theme.plural + "!");
}

function newRound() {
  answered = false;
  counted = 0;
  basketTag.textContent = "0";
  target = newTarget();
  theme = pick(THEMES);
  if (theme.place !== place) {
    backdropEl.innerHTML = backdropSvg(theme.place);
    place = theme.place;
  }
  promptEl.textContent = "Count the " + theme.plural + "!";

  area.innerHTML = "";
  for (const [x, y] of shuffle(SPOTS).slice(0, target)) {
    const item = document.createElement("button");
    item.className = "count-item";
    item.setAttribute("aria-label", theme.item);
    item.innerHTML = iconImg(theme.item, 104);
    item.style.left = x + Math.round(Math.random() * 14 - 7) + "px";
    item.style.top = y + Math.round(Math.random() * 12 - 6) + "px";
    // tap counts it where it is...
    item.addEventListener("click", () => countItem(item, false));
    // ...dragging it into the basket counts it too
    Drag.enable(item, {
      canDrag: () => running && !answered && !item.classList.contains("counted"),
      targets: () => [basket],
      onPickup: () => Sound.click(),
      onDrop: (t) => {
        if (!t) return false;
        countItem(item, true);
        return true;
      },
    });
    area.appendChild(item);
  }

  answersEl.innerHTML = "";
  say();
}

function showAnswers() {
  answersEl.innerHTML = "";
  for (const n of answerOptions(target)) {
    const b = document.createElement("button");
    b.className = "count-answer";
    b.textContent = String(n);
    b.addEventListener("click", () => tapAnswer(b, n));
    answersEl.appendChild(b);
  }
}

function countItem(item, intoBasket) {
  if (!running || answered || item.classList.contains("counted")) return;
  counted++;
  item.classList.add("counted");
  if (intoBasket) {
    flyInto(item, basket, { scale: 0.25 });
    basketTag.textContent = String(counted);
    flash(basket, "happy", 420);
  } else {
    item.insertAdjacentHTML("beforeend", `<span class="count-tag">${counted}</span>`);
  }
  Sound.pop();
  if (counted === target) {
    Sound.say([String(counted), "How many?"], { rate: 1.05 });
    showAnswers();
  } else {
    Sound.speak(String(counted), { rate: 1.05 });
  }
}

function tapAnswer(btn, n) {
  if (!running || answered) return;
  if (n === target) {
    answered = true;
    Sound.success();
    later(() => Sound.speak(target + "! That's right!"), 200);
    awardStars(1, { message: target + "!" });
    later(newRound, 2200);
  } else {
    btn.classList.add("wrong");
    setTimeout(() => btn.classList.remove("wrong"), 450);
    freeze(); // silence + a short pause: mistakes earn no sounds
  }
}

hearBtn.addEventListener("click", () => {
  Sound.click();
  if (theme) say();
});

export default {
  start() {
    running = true;
    later(newRound);
  },
  stop() {
    running = false;
    area.innerHTML = "";
  },
  hint() {
    // still counting: glow the next one to count; then glow the answer
    const next = area.querySelector(".count-item:not(.counted)");
    glow(next || [...answersEl.children].find((b) => Number(b.textContent) === target));
  },
};
