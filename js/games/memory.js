// Animal Match: the classic pairs game; each animal says its name when
// flipped. Flipping a pair that doesn't match is how the game is played,
// not a mistake, so it never freezes — the cards just flip back quietly.
import * as Sound from "../core/sound.js";
import { later } from "../core/session.js";
import { awardStars, praise } from "../core/rewards.js";
import { shuffle } from "../core/rng.js";
import { glow } from "../core/hint.js";
import { ANIMALS } from "../logic/memory.js";
import { iconImg } from "../art/icons.js";
import { backdropSvg } from "../art/backdrops.js";
import { svg, ellipse, circle, g } from "../art/svg.js";

const screen = document.getElementById("screen-memory");
const grid = document.getElementById("memory-grid");

// a paw print for the card backs
const PAW = svg(84, 84, g({ fill: "#FFFFFF", opacity: 0.85 },
  ellipse(42, 54, 20, 17), circle(20, 34, 9), circle(34, 22, 9), circle(50, 22, 9), circle(64, 34, 9)));

let firstPick = null;
let locked = false;
let matched = 0;
let running = false;
let drawn = false;

function build() {
  matched = 0;
  firstPick = null;
  locked = false;
  grid.innerHTML = "";
  for (const c of shuffle(ANIMALS.flatMap((a) => [a, a]))) {
    const btn = document.createElement("button");
    btn.className = "mem-card";
    btn.dataset.name = c.name;
    btn.setAttribute("aria-label", "card");
    btn.innerHTML = `<span class="face back">${PAW}</span><span class="face front">${iconImg(c.name, 118)}</span>`;
    btn.addEventListener("click", () => tapCard(btn, c));
    grid.appendChild(btn);
  }
}

function tapCard(btn, c) {
  if (!running || locked || btn.classList.contains("flipped")) return;
  Sound.flip();
  Sound.tone(Sound.N[c.note], { type: "triangle", dur: 0.35, gain: 0.2 });
  btn.classList.add("flipped");
  btn.setAttribute("aria-label", c.name);
  Sound.speak(c.name);

  if (!firstPick) {
    firstPick = { btn, c };
    return;
  }

  if (firstPick.c.name === c.name) {
    // match!
    const a = firstPick.btn;
    firstPick = null;
    matched++;
    later(() => {
      a.classList.add("matched");
      btn.classList.add("matched");
      praise();
      if (matched === ANIMALS.length) {
        later(() => {
          Sound.fanfare();
          awardStars(3, { message: "You found them all!" });
          Sound.speak("You found all the animals! Amazing!");
          later(build, 2300);
        }, 600);
      }
    }, 450);
  } else {
    // not a match — a silent flip-back
    locked = true;
    const a = firstPick.btn;
    firstPick = null;
    later(() => {
      a.classList.remove("flipped");
      btn.classList.remove("flipped");
      locked = false;
    }, 1100);
  }
}

export default {
  start() {
    if (!drawn) {
      screen.querySelector(".backdrop").innerHTML = backdropSvg("bark");
      drawn = true;
    }
    running = true;
    build();
  },
  stop() {
    running = false;
  },
  hint() {
    const hidden = /** @type {HTMLElement[]} */ ([...grid.children]).filter(
      (c) => !c.classList.contains("flipped") && !c.classList.contains("matched")
    );
    if (firstPick) {
      // glow where the match for his flipped card is hiding
      glow(hidden.find((c) => c.dataset.name === firstPick.c.name));
      return;
    }
    // otherwise sneak a peek at one pair
    if (locked) return;
    const byName = {};
    hidden.forEach((c) => (byName[c.dataset.name] = byName[c.dataset.name] || []).push(c));
    const pair = Object.values(byName).find((p) => p.length === 2);
    if (!pair) return;
    locked = true;
    pair.forEach((c) => c.classList.add("flipped"));
    later(() => {
      pair.forEach((c) => c.classList.remove("flipped"));
      locked = false;
    }, 1300);
  },
};
