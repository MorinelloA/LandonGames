// The jigsaw engine shared by Puzzle Builder and Picture Puzzle. The
// picture is painted once onto a square canvas, then each piece is its own
// small canvas cut from it along a jigsaw outline; the board shows each
// slot's shape faintly. Pieces wait in the tray at a smaller size and grow
// to full size when picked up.
//
// No freeze in puzzle games: trial and error is part of puzzling. Wrong
// drops are still silent (sounds stay a success-only reward).
import * as Sound from "../core/sound.js";
import * as Drag from "../core/drag.js";
import { later } from "../core/session.js";
import { awardStars } from "../core/rewards.js";
import { shuffle } from "../core/rng.js";
import { glow } from "../core/hint.js";
import { createLevel } from "../core/levels.js";
import { stageScale } from "../core/stage.js";
import { MIN_SIZE, MAX_SIZE, nextSize } from "../logic/puzzle.js";
import { cutEdges } from "../logic/jigsaw.js";
import { piecePath, MARGIN } from "../art/jigsaw.js";
import { g, path, svg } from "../art/svg.js";

const BOARD = 480;                                  // the picture's size on the stage
const TRAY = { x: 590, y: 24, w: 360, h: 596 };     // where loose pieces wait
const STAGE_BOARD = { x: 64, y: 72 };

// free a canvas's memory now rather than at iPad Safari's next garbage collection
function release(c) {
  c.width = c.height = 0;
}

export function createPuzzle({ screenEl, levelEl, storageKey, onComplete }) {
  const size = createLevel({ key: storageKey, min: MIN_SIZE, max: MAX_SIZE });
  const boardEl = document.createElement("div");
  boardEl.className = "jig-board panel";
  boardEl.style.left = STAGE_BOARD.x - 16 + "px";
  boardEl.style.top = STAGE_BOARD.y - 16 + "px";
  const trayEl = document.createElement("div");
  trayEl.className = "jig-tray";
  screenEl.append(boardEl, trayEl);

  let placed = 0;
  let errors = 0;
  let running = false;
  let canvases = [];
  let buildId = 0;

  function renderLevel() {
    levelEl.textContent = size.value + " × " + size.value;
  }

  function clear() {
    canvases.forEach(release);
    canvases = [];
    boardEl.innerHTML = "";
    trayEl.innerHTML = "";
  }

  // draw(ctx, side) paints the picture onto a side x side canvas
  async function build(draw) {
    const id = ++buildId;
    const n = size.value;
    const P = BOARD / n;
    const M = MARGIN * P;
    const dpr = Math.min(2, window.devicePixelRatio || 1) * Math.max(0.5, stageScale());
    placed = 0;
    errors = 0;
    renderLevel();
    clear();

    const master = document.createElement("canvas");
    master.width = master.height = Math.round(BOARD * dpr);
    await draw(master.getContext("2d"), master.width);
    if (id !== buildId) { release(master); return; } // a newer puzzle started meanwhile

    const pieces = cutEdges(n);

    // the board: each slot's outline, and a drop target over each square
    boardEl.style.width = boardEl.style.height = BOARD + 32 + "px";
    boardEl.innerHTML = svg(BOARD + 32, BOARD + 32, g({ transform: "translate(16 16)" },
      ...pieces.map((p) => g({ transform: `translate(${p.x * P} ${p.y * P})` },
        path(piecePath(P, p), { fill: "#F6EEE2", stroke: "#DCCBB4", strokeWidth: 2.5, strokeDasharray: "7 6" }))),
    ), { cls: "jig-slots" });
    const slots = pieces.map((p) => {
      const s = document.createElement("div");
      s.className = "jig-slot";
      s.dataset.idx = String(p.y * n + p.x);
      s.style.left = 16 + p.x * P + "px";
      s.style.top = 16 + p.y * P + "px";
      s.style.width = s.style.height = P + "px";
      boardEl.appendChild(s);
      return s;
    });

    // the pieces, laid out on a grid in the tray, smaller than life
    const box = P + 2 * M;
    const cols = Math.max(1, Math.ceil(Math.sqrt((pieces.length * TRAY.w) / TRAY.h)));
    const rows = Math.ceil(pieces.length / cols);
    const cell = Math.min(TRAY.w / cols, TRAY.h / rows);
    const trayScale = Math.min(1, (cell * 0.98) / box);
    const order = shuffle(pieces);
    order.forEach((p, k) => {
      const c = document.createElement("canvas");
      c.width = c.height = Math.round(box * dpr);
      const ctx = c.getContext("2d");
      const shape = new Path2D(piecePath(P * dpr, p));
      ctx.translate(M * dpr, M * dpr);
      ctx.save();
      ctx.clip(shape);
      ctx.drawImage(master, -p.x * P * dpr, -p.y * P * dpr);
      ctx.restore();
      ctx.lineWidth = 2.5 * dpr;
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.stroke(shape);
      canvases.push(c);

      const piece = document.createElement("button");
      piece.className = "jig-piece";
      piece.dataset.idx = String(p.y * n + p.x);
      piece.setAttribute("aria-label", "puzzle piece");
      piece.style.width = piece.style.height = box + "px";
      piece.style.setProperty("--tray-scale", String(trayScale));
      const col = k % cols, row = Math.floor(k / cols);
      piece.style.left = col * cell + (cell - box) / 2 + Math.random() * 8 - 4 + "px";
      piece.style.top = row * cell + (cell - box) / 2 + Math.random() * 8 - 4 + "px";
      piece.appendChild(c);
      Drag.enable(piece, {
        canDrag: () => running && !piece.classList.contains("placed"),
        targets: () => slots.filter((s) => !s.classList.contains("filled")),
        onPickup: () => Sound.click(),
        onDrop: (target) => {
          if (!target) return false;
          const slot = /** @type {HTMLElement} */ (target);
          if (slot.dataset.idx !== piece.dataset.idx) {
            errors++; // wrong slot: a silent glide back — puzzling is trial and error
            return false;
          }
          slot.classList.add("filled");
          piece.classList.add("placed");
          piece.style.transform = "";
          piece.style.left = 16 + p.x * P - M + "px";
          piece.style.top = 16 + p.y * P - M + "px";
          boardEl.appendChild(piece);
          Sound.pop();
          placed++;
          if (placed === n * n) done();
          return true;
        },
      });
      trayEl.appendChild(piece);
    });
    release(master);
  }

  function done() {
    Sound.fanfare();
    awardStars(2, { message: "Puzzle done!" });
    Sound.speak("You built the whole picture! Amazing!");
    // a clean solve unlocks a bigger grid, a tough one shrinks it
    size.set(nextSize(size.value, errors));
    later(onComplete, 2600);
  }

  return {
    build,
    renderLevel,
    clear,
    show(on) {
      boardEl.classList.toggle("hidden", !on);
      trayEl.classList.toggle("hidden", !on);
    },
    set running(v) { running = v; },
    get running() { return running; },
    hint() {
      // glow the first loose piece and the slot it belongs in
      const piece = /** @type {HTMLElement} */ (trayEl.querySelector(".jig-piece"));
      if (!piece) return;
      glow(piece);
      glow(/** @type {HTMLElement} */ (boardEl.querySelector(`.jig-slot[data-idx="${piece.dataset.idx}"]`)));
    },
  };
}

// Load an image (a photo, an icon, or an SVG made into a Blob URL).
export function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}
