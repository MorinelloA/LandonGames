// Math Bubbles: drag the bubble with the right answer into the sum, under
// the sea. Four right in a row levels up; two misses in a row ease back.
import * as Sound from "../core/sound.js";
import * as Drag from "../core/drag.js";
import { later } from "../core/session.js";
import { awardStars, praise } from "../core/rewards.js";
import { freeze } from "../core/freeze.js";
import { shuffle } from "../core/rng.js";
import { glow } from "../core/hint.js";
import { createLevel } from "../core/levels.js";
import { MAX_LEVEL, LEVEL_UP_STREAK, LEVEL_DOWN_MISSES, STAR_EVERY, generate, choices } from "../logic/math.js";
import { LEVEL_UP } from "../logic/lines.js";
import { backdropSvg } from "../art/backdrops.js";

const screen = document.getElementById("screen-mathpop");
const problemEl = document.getElementById("math-problem");
const area = document.getElementById("bubble-area");
const levelEl = document.getElementById("title-badge");
// deep enough that the white numbers stay easy to read
const COLORS = ["#3D96C2", "#D9628F", "#4E9F45", "#8A5CC7", "#D9772E"];
const AREA_W = 900, AREA_H = 470, SIZE = 150;

const level = createLevel({ key: "landon-math-level", max: MAX_LEVEL });
let winStreak = 0;  // right in a row
let missStreak = 0; // wrong in a row
let solved = 0;
let answer = 0;
let running = false;
let drawn = false;

function renderLevel() {
  levelEl.textContent = "Level " + level.value;
}

function dropSlot() {
  return document.getElementById("math-drop");
}

function makeProblem() {
  const problem = generate(level.value);
  answer = problem.answer;
  problemEl.innerHTML = `<span>${problem.a}</span><span class="op">${problem.op}</span><span>${problem.b}</span><span class="op">=</span><span id="math-drop">?</span>`;
  spawnBubbles(choices(problem, level.value));
}

// one bubble per column, at a random height, bobbing out of step
function spawnBubbles(values) {
  area.innerHTML = "";
  const count = values.length;
  const cols = shuffle(Array.from({ length: count }, (_, i) => i));
  values.forEach((v, i) => {
    const b = document.createElement("button");
    b.className = "bubble";
    b.dataset.value = String(v);
    b.setAttribute("aria-label", String(v));
    b.innerHTML = `<span class="bubble-inner" style="--c:${COLORS[i % COLORS.length]};animation-delay:${(-Math.random() * 3).toFixed(2)}s">${v}</span>`;
    const colW = AREA_W / count;
    b.style.left = Math.round(colW * cols[i] + (colW - SIZE) * Math.random()) + "px";
    b.style.top = Math.round(10 + Math.random() * (AREA_H - SIZE - 40)) + "px";
    // tap still works as a shortcut...
    b.addEventListener("click", () => resolveGuess(b, v));
    // ...but dragging into the sum is the main way to play
    Drag.enable(b, {
      canDrag: () => running,
      targets: () => [dropSlot()],
      onPickup: () => { Sound.click(); dropSlot().classList.add("armed"); },
      onEnd: () => dropSlot().classList.remove("armed"),
      onDrop: (target) => {
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
    slot.classList.add("solved");
    b.classList.add("pop");
    b.style.pointerEvents = "none";
    solved++;
    missStreak = 0;
    winStreak++;
    if (winStreak >= LEVEL_UP_STREAK && level.value < MAX_LEVEL) {
      level.up();
      winStreak = 0;
      renderLevel();
      awardStars(1, { message: "Level " + level.value + "!" });
      Sound.speak(LEVEL_UP);
    } else if (solved % STAR_EVERY === 0) {
      awardStars(1);
    } else {
      praise();
    }
    later(makeProblem, 1000);
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
    if (!drawn) {
      screen.querySelector(".backdrop").innerHTML = backdropSvg("sea");
      drawn = true;
    }
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
    glow([...area.querySelectorAll(".bubble-inner")].find((b) => Number(b.textContent) === answer));
  },
};
