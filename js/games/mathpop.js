// Math Bubbles: drag the right answer into the equation. Four right in a
// row levels up; two misses in a row ease back down.
import * as Sound from "../core/sound.js";
import * as Drag from "../core/drag.js";
import { later } from "../core/session.js";
import { awardStars } from "../core/rewards.js";
import { freeze } from "../core/freeze.js";
import { shuffle } from "../core/rng.js";
import { glow } from "../core/hint.js";
import { createLevel } from "../core/levels.js";
import { MAX_LEVEL, LEVEL_UP_STREAK, LEVEL_DOWN_MISSES, STAR_EVERY, generate, choices } from "../logic/math.js";

const problemEl = document.getElementById("math-problem");
const area = document.getElementById("bubble-area");
const levelEl = document.getElementById("math-level");
const COLORS = ["#7ec8e3", "#f9a8c2", "#90d4a3", "#c9a7eb", "#ffb347"];

const level = createLevel({ key: "landon-math-level", max: MAX_LEVEL });
let winStreak = 0;  // right in a row
let missStreak = 0; // wrong in a row
let solved = 0;
let answer = 0;
let running = false;

function renderLevel() {
  levelEl.textContent = "Level " + level.value;
}

function dropSlot() {
  return document.getElementById("math-drop");
}

function makeProblem() {
  const problem = generate(level.value);
  answer = problem.answer;
  problemEl.innerHTML = `${problem.a} ${problem.op} ${problem.b} = <span id="math-drop">?</span>`;
  spawnBubbles(choices(problem, level.value));
}

function spawnBubbles(values) {
  area.innerHTML = "";
  const count = values.length;
  const W = area.clientWidth, H = area.clientHeight;
  const size = Math.max(90, Math.min(150, H * 0.34));
  const slots = shuffle(Array.from({ length: count }, (_, i) => i));
  values.forEach((v, i) => {
    const b = document.createElement("button");
    b.className = "bubble";
    b.textContent = String(v);
    b.style.setProperty("--size", size + "px");
    b.style.setProperty("--bubble-color", COLORS[i % COLORS.length]);
    const col = slots[i];
    const x = (W / count) * col + (W / count - size) * Math.random();
    const y = 20 + Math.random() * Math.max(20, H - size - 60);
    b.style.left = Math.max(0, x) + "px";
    b.style.top = y + "px";
    b.style.animationDelay = Math.random() * 2 + "s";
    b.dataset.value = String(v);
    // tap still works as a shortcut...
    b.addEventListener("click", () => resolveGuess(b, v));
    // ...but dragging into the equation is the main way to play
    Drag.enable(b, {
      canDrag: () => running,
      targets: () => [dropSlot()],
      onPickup: () => { Sound.click(); dropSlot().classList.add("armed"); },
      onDrop: (target) => {
        dropSlot().classList.remove("armed");
        if (!target) return false;
        resolveGuess(b, v);
        return v === answer;
      },
    });
    area.appendChild(b);
  });
}

function resolveGuess(b, v) {
  if (!running) return;
  if (v === answer) {
    Sound.pop();
    const slot = dropSlot();
    slot.textContent = String(v);
    slot.style.borderStyle = "solid";
    slot.style.color = "#3a3f58";
    b.classList.add("pop");
    solved++;
    missStreak = 0;
    winStreak++;
    if (winStreak >= LEVEL_UP_STREAK && level.value < MAX_LEVEL) {
      level.up();
      winStreak = 0;
      renderLevel();
      awardStars(1, { message: "Level " + level.value + "! 🚀" });
      Sound.speak("Level up!");
    } else if (solved % STAR_EVERY === 0) {
      awardStars(1);
    } else {
      Sound.success();
    }
    later(makeProblem, 900);
  } else {
    winStreak = 0;
    missStreak++;
    if (missStreak >= LEVEL_DOWN_MISSES && level.value > 1) {
      level.down(); // ease back down quietly — no fuss
      missStreak = 0;
      renderLevel();
    }
    b.classList.add("wrong");
    setTimeout(() => b.classList.remove("wrong"), 450);
    freeze(); // silence + a short pause: mistakes earn no sounds
  }
}

export default {
  start() {
    running = true;
    winStreak = 0;
    missStreak = 0;
    solved = 0;
    renderLevel();
    later(makeProblem);
  },
  stop() {
    running = false;
    area.innerHTML = "";
  },
  hint() {
    glow([...area.querySelectorAll(".bubble")].find((b) => Number(/** @type {HTMLElement} */ (b).dataset.value) === answer));
  },
};
