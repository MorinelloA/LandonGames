// Counting Time: drag each thing into the basket (or tap it) to count it
// out loud, then pick how many there were.
import * as Sound from "../core/sound.js";
import * as Drag from "../core/drag.js";
import { later } from "../core/session.js";
import { awardStars } from "../core/rewards.js";
import { freeze } from "../core/freeze.js";
import { shuffle, pick } from "../core/rng.js";
import { glow } from "../core/hint.js";
import { THEMES, newTarget, answerOptions } from "../logic/counting.js";

const area = document.getElementById("count-area");
const answersEl = document.getElementById("count-answers");
const basket = document.getElementById("count-basket");
const basketTag = document.getElementById("basket-tag");

let target = 0;
let counted = 0;
let answered = false;
let running = false;

function newRound() {
  answered = false;
  counted = 0;
  basketTag.textContent = "0";
  target = newTarget();
  const emoji = pick(THEMES);

  area.querySelectorAll(".count-item").forEach((el) => el.remove());
  const W = area.clientWidth, H = area.clientHeight - 40; // keep clear of the answer row
  const cell = 110;
  const cols = Math.max(2, Math.floor(W / (cell * 1.3)));
  const rows = Math.max(2, Math.floor(H / (cell * 1.3)));
  const cells = shuffle(
    Array.from({ length: cols * rows }, (_, i) => i)
      .filter((i) => !(i % cols === 0 && Math.floor(i / cols) === rows - 1)) // keep the basket's corner free
  ).slice(0, target);

  cells.forEach((cellIdx) => {
    const cx = cellIdx % cols, cy = Math.floor(cellIdx / cols);
    const item = document.createElement("button");
    item.className = "count-item";
    item.textContent = emoji;
    item.style.left = cx * (W / cols) + Math.random() * Math.max(0, W / cols - cell) + "px";
    item.style.top = cy * (H / rows) + Math.random() * Math.max(0, H / rows - cell) + "px";
    // tap counts it in place...
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
  });

  // the numbers wait until everything is counted, so he counts first
  answersEl.innerHTML = "";
}

function showAnswers() {
  answersEl.innerHTML = "";
  answerOptions(target).forEach((n) => {
    const b = document.createElement("button");
    b.className = "count-answer";
    b.textContent = String(n);
    b.addEventListener("click", () => tapAnswer(b, n));
    answersEl.appendChild(b);
  });
}

function countItem(item, intoBasket) {
  if (!running || answered || item.classList.contains("counted")) return;
  counted++;
  item.classList.add("counted");
  if (intoBasket) {
    // shrink into the basket
    const br = basket.getBoundingClientRect();
    const ir = item.getBoundingClientRect();
    item.classList.add("in-basket");
    item.style.transform =
      `translate(${br.left + br.width / 2 - (ir.left + ir.width / 2)}px, ` +
      `${br.top + br.height / 2 - (ir.top + ir.height / 2)}px) scale(0.25)`;
    basketTag.textContent = String(counted);
    basket.style.animation = "countBounce 0.4s";
    setTimeout(() => { basket.style.animation = ""; }, 420);
  } else {
    const tag = document.createElement("span");
    tag.className = "count-tag";
    tag.textContent = String(counted);
    item.appendChild(tag);
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
    awardStars(1, { message: target + "! 🎉" });
    later(newRound, 2000);
  } else {
    btn.classList.add("wrong");
    setTimeout(() => btn.classList.remove("wrong"), 450);
    freeze(); // silence + a short pause: mistakes earn no sounds
  }
}

export default {
  start() {
    running = true;
    later(newRound);
  },
  stop() {
    running = false;
    area.querySelectorAll(".count-item").forEach((el) => el.remove());
  },
  hint() {
    // still counting: glow the next one to count; then glow the answer
    const next = area.querySelector(".count-item:not(.counted)");
    glow(next || [...answersEl.children].find((b) => Number(b.textContent) === target));
  },
};
