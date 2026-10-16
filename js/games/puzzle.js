// Puzzle Builder: drag the jigsaw pieces to rebuild a busy picture. The
// grid grows from 2x2 to 6x6 after clean solves and shrinks after hard
// ones. Each picture is a place with a crowd of its things — farm animals,
// sea creatures, sweets — one in every cell of a 6x6 grid, so every piece
// has something to recognise, even at 6x6.
import { later } from "../core/session.js";
import { pick } from "../core/rng.js";
import { createPuzzle, loadImage } from "./puzzle-core.js";
import { PLACES, backdropSvg } from "../art/backdrops.js";
import { iconUrl } from "../art/icons.js";
import { svg } from "../art/svg.js";

const screen = document.getElementById("screen-puzzle");

const THEMES = [
  { place: "park", focal: "tractor", items: ["cow", "pig", "rooster", "sunflower", "rice", "sheep", "duck", "rabbit", "corn", "apple"] },
  { place: "space", focal: "rocket", items: ["star", "planet", "astronaut", "ufo", "moon", "comet", "glowing_star", "globe", "telescope", "alien"] },
  { place: "sea", focal: "spouting_whale", items: ["tropical_fish", "octopus", "crab", "dolphin", "shell", "shark", "coral", "blowfish", "turtle", "boat"] },
  { place: "park", focal: "lion", items: ["monkey", "parrot", "snake", "hibiscus", "butterfly", "frog", "palm", "tiger", "giraffe", "elephant"] },
  { place: "party", focal: "ice_cream_bowl", items: ["lollipop", "cupcake", "doughnut", "cookie", "strawberry", "shortcake", "candy", "cake", "chocolate", "pancakes"] },
  { place: "station", focal: "train", items: ["car", "bus", "helicopter", "fire_engine", "police_car", "airplane", "bicycle", "traffic_light", "fuel_pump", "scooter"] },
];

async function drawScene(ctx, S) {
  const theme = pick(THEMES);
  // the place, cropped to a square from the middle of the stage
  const square = svg(640, 640, PLACES[theme.place](), { viewBox: "246 0 640 640" });
  const url = URL.createObjectURL(new Blob([square], { type: "image/svg+xml" }));
  try {
    ctx.drawImage(await loadImage(url), 0, 0, S, S);
  } finally {
    URL.revokeObjectURL(url);
  }
  const ids = [...new Set([...theme.items, theme.focal])];
  const loaded = await Promise.all(ids.map((id) => loadImage(iconUrl(id))));
  const imgs = new Map(ids.map((id, i) => [id, loaded[i]]));
  const GRID = 6, cell = S / GRID;
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const size = cell * (0.62 + Math.random() * 0.3);
      ctx.save();
      ctx.translate(gx * cell + cell * (0.4 + Math.random() * 0.2), gy * cell + cell * (0.4 + Math.random() * 0.2));
      ctx.rotate((Math.random() - 0.5) * 0.7);
      ctx.drawImage(imgs.get(pick(theme.items)), -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }
  const big = S * 0.38;
  ctx.drawImage(imgs.get(theme.focal), (S - big) / 2, (S - big) / 2, big, big);
}

const puzzle = createPuzzle({
  screenEl: screen,
  levelEl: document.getElementById("title-badge"),
  storageKey: "landon-puzzle-level",
  onComplete: () => puzzle.build(drawScene),
});

let drawn = false;

export default {
  start() {
    if (!drawn) {
      screen.querySelector(".backdrop").innerHTML = backdropSvg("playroom");
      drawn = true;
    }
    puzzle.running = true;
    puzzle.renderLevel();
    later(() => puzzle.build(drawScene));
  },
  stop() {
    puzzle.running = false;
    puzzle.clear();
  },
  hint() {
    puzzle.hint();
  },
};
