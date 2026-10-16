// Puzzle Builder: drag the pieces to rebuild a busy picture. The grid
// grows from 2x2 to 6x6 after clean solves and shrinks after hard ones.
import { later } from "../core/session.js";
import { pick } from "../core/rng.js";
import { createPuzzle } from "./puzzle-core.js";

/* Full collage scenes rather than one central emoji, so every piece has
   distinct content to recognize — even on a 6x6 grid. */
const THEMES = [
  { bg: ["#d6ecff", "#e9ffd9"], focal: "🚜", items: ["🐄", "🐖", "🐓", "🌻", "🌾", "🐑", "🦆", "🐇", "🌽", "🍎"] },
  { bg: ["#dfe4ff", "#f7e2ff"], focal: "🚀", items: ["⭐", "🪐", "👩‍🚀", "🛸", "🌙", "☄️", "🌟", "🌍", "🔭", "👽"] },
  { bg: ["#d9f6ff", "#e6fff4"], focal: "🐳", items: ["🐠", "🐙", "🦀", "🐬", "🐚", "🦈", "🪸", "🐡", "🐢", "⛵"] },
  { bg: ["#e4ffe0", "#fff7d9"], focal: "🦁", items: ["🐒", "🦜", "🐍", "🌺", "🦋", "🐸", "🌴", "🐯", "🦒", "🐘"] },
  { bg: ["#fff0f5", "#fffbe0"], focal: "🍨", items: ["🍭", "🧁", "🍩", "🍪", "🍓", "🍰", "🍬", "🎂", "🍫", "🥞"] },
  { bg: ["#e8f4ff", "#ffeede"], focal: "🚂", items: ["🚗", "🚌", "🚁", "🚒", "🚓", "✈️", "🚲", "🚦", "⛽", "🛴"] },
];

function makeScene() {
  const S = 600;
  const theme = pick(THEMES);
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const g = c.getContext("2d");

  const grad = g.createLinearGradient(0, 0, S, S);
  grad.addColorStop(0, theme.bg[0]);
  grad.addColorStop(1, theme.bg[1]);
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);

  // soft colorful blobs so even emoji-free patches look distinct
  const blobColors = ["#ffffff", "#ffe9a8", "#ffd3e0", "#cdeffd", "#d8f8d8", "#eadcff"];
  for (let i = 0; i < 16; i++) {
    g.globalAlpha = 0.25 + Math.random() * 0.3;
    g.fillStyle = pick(blobColors);
    g.beginPath();
    g.arc(Math.random() * S, Math.random() * S, S * (0.04 + Math.random() * 0.09), 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  g.textAlign = "center";
  g.textBaseline = "middle";

  // one item in EVERY cell of a jittered 6x6 grid (matching the biggest
  // puzzle size) — every piece is guaranteed recognizable content
  const GRID = 6;
  const cell = S / GRID;
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const size = cell * (0.6 + Math.random() * 0.35);
      const x = gx * cell + cell * (0.35 + Math.random() * 0.3);
      const y = gy * cell + cell * (0.35 + Math.random() * 0.3);
      g.save();
      g.translate(x, y);
      g.rotate((Math.random() - 0.5) * 0.8);
      g.font = size + "px serif";
      g.fillText(pick(theme.items), 0, 0);
      g.restore();
    }
  }

  g.font = S * 0.3 + "px serif";
  g.fillText(theme.focal, S / 2, S * 0.52);
  const url = c.toDataURL();
  c.width = c.height = 0; // let iPad Safari reclaim the canvas now
  return url;
}

const puzzle = createPuzzle({
  boardEl: document.getElementById("puzzle-board"),
  trayEl: document.getElementById("puzzle-tray"),
  levelEl: document.getElementById("title-badge"),
  storageKey: "landon-puzzle-level",
  onComplete: () => puzzle.build(makeScene()),
});

export default {
  start() {
    puzzle.running = true;
    puzzle.renderLevel();
    later(() => puzzle.build(makeScene()));
  },
  stop() {
    puzzle.running = false;
  },
  hint() {
    puzzle.hint();
  },
};
