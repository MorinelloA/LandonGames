// The puzzle engine shared by Puzzle Builder and Picture Puzzle. No freeze
// in puzzle games: trial and error is part of puzzling. Wrong drops are
// still silent (sounds stay a success-only reward).
import * as Sound from "../core/sound.js";
import * as Drag from "../core/drag.js";
import { later } from "../core/session.js";
import { awardStars } from "../core/rewards.js";
import { shuffle } from "../core/rng.js";
import { glow } from "../core/hint.js";
import { createLevel } from "../core/levels.js";
import { MIN_SIZE, MAX_SIZE, nextSize } from "../logic/puzzle.js";

export function createPuzzle({ boardEl, trayEl, levelEl, storageKey, onComplete }) {
  const size = createLevel({ key: storageKey, min: MIN_SIZE, max: MAX_SIZE });
  let placed = 0;
  let errors = 0;
  let running = false;

  function renderLevel() {
    levelEl.textContent = size.value + " × " + size.value;
  }

  function build(imgUrl) {
    const n = size.value;
    placed = 0;
    errors = 0;
    renderLevel();

    const D = Math.min(window.innerHeight * 0.52, window.innerWidth * 0.42, 440);
    const P = Math.floor(D / n);
    boardEl.innerHTML = "";
    boardEl.style.gridTemplateColumns = `repeat(${n}, ${P}px)`;
    boardEl.style.gridTemplateRows = `repeat(${n}, ${P}px)`;

    for (let i = 0; i < n * n; i++) {
      const slot = document.createElement("div");
      slot.className = "puzzle-slot";
      slot.dataset.idx = String(i);
      boardEl.appendChild(slot);
    }

    trayEl.innerHTML = "";
    shuffle(Array.from({ length: n * n }, (_, i) => i)).forEach((i) => {
      const piece = document.createElement("button");
      piece.className = "puzzle-piece";
      piece.dataset.idx = String(i);
      piece.style.width = P + "px";
      piece.style.height = P + "px";
      piece.style.backgroundImage = `url(${imgUrl})`;
      piece.style.backgroundSize = `${P * n}px ${P * n}px`;
      piece.style.backgroundPosition = `-${(i % n) * P}px -${Math.floor(i / n) * P}px`;
      Drag.enable(piece, {
        canDrag: () => running,
        targets: () => [...boardEl.children].filter((s) => !s.classList.contains("filled")),
        onPickup: () => Sound.click(),
        onDrop: (target) => {
          if (!target) return false;
          const slot = /** @type {HTMLElement} */ (target);
          if (slot.dataset.idx === piece.dataset.idx) {
            slot.style.backgroundImage = piece.style.backgroundImage;
            slot.style.backgroundSize = piece.style.backgroundSize;
            slot.style.backgroundPosition = piece.style.backgroundPosition;
            slot.classList.add("filled");
            piece.remove();
            Sound.pop();
            placed++;
            if (placed === n * n) done();
            return true;
          }
          // wrong slot: silent snap-back, no freeze — puzzling is trial and error
          errors++;
          return false;
        },
      });
      trayEl.appendChild(piece);
    });
  }

  function done() {
    Sound.fanfare();
    awardStars(2, { message: "Puzzle done! 🧩" });
    Sound.speak("You built the whole picture! Amazing!");
    // a clean solve unlocks a bigger grid, a tough one shrinks it
    size.set(nextSize(size.value, errors));
    renderLevel();
    later(onComplete, 2400);
  }

  return {
    build,
    renderLevel,
    set running(v) { running = v; },
    get running() { return running; },
    hint() {
      // glow the slot where the first tray piece belongs, and the piece
      const piece = /** @type {HTMLElement} */ (trayEl.querySelector(".puzzle-piece"));
      if (!piece) return;
      const slot = /** @type {HTMLElement[]} */ ([...boardEl.children]).find((s) => s.dataset.idx === piece.dataset.idx);
      if (slot) {
        glow(piece);
        glow(slot);
      }
    },
  };
}
