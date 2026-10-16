// The Home Screen icon: the cat's face under the menu's bunting, on the
// menu's playroom wall. Drawn from the game's own art, flat like the rest;
// tools/make-icons.py renders it into icons/ at every size the page and
// manifest use.
import { cat } from "../js/art/mascot.js";
import { WORLD as W } from "../js/art/theme.js";
import { g, rect, circle, path, polygon, svg } from "../js/art/svg.js";

const S = 1024; // drawn in a 1024-unit square
const WALL = "#FDEBD6", SPOT = "#F8DCC0"; // the menu's wall and spots (js/art/backdrops.js)

// the cat's head in its own units runs x -67..67 and y -232.6 (ear tips)
// to -93 (chin); this centres it on cx, cy at the given width
function face(cx, cy, width) {
  return g({ transform: `translate(${cx} ${cy}) scale(${width / 134}) translate(0 162.8)` }, cat({ pose: "head" }));
}

// the menu's soft spots, scaled up so a few show at icon size
function spots(tile = 256, r = 24) {
  let out = "";
  for (let y = 0; y < S; y += tile) {
    for (let x = 0; x < S; x += tile) {
      out += circle(x + tile / 4, y + tile / 4, r, { fill: SPOT }) + circle(x + (3 * tile) / 4, y + (3 * tile) / 4, r, { fill: SPOT });
    }
  }
  return out;
}

// the menu's bunting across the top: one flag in each of its colours,
// hanging from a string that sags `sag` below y0 in the middle
function bunting(y0 = 44, sag = 50, w = 118, h = 112) {
  const colors = [W.red, W.yellow, W.blue, W.green, W.pink, W.purple, W.orange];
  const x0 = -40, x1 = S + 40; // the flags' span
  const yAt = (x) => y0 + sag * (1 - ((x - S / 2) / (x1 - S / 2)) ** 2);
  const gap = (x1 - x0 - colors.length * w) / (colors.length + 1);
  const flags = colors.map((fill, i) => {
    const x = x0 + gap + i * (w + gap);
    return polygon([[x, yAt(x) + 4], [x + w, yAt(x + w) + 4], [x + w / 2, yAt(x + w / 2) + h]], { fill });
  });
  // the same curve as a quadratic, running off both edges even when the
  // maskable icon shrinks it
  const a = -300, b = S + 300;
  const string = path(`M${a} ${yAt(a)}Q${S / 2} ${2 * yAt(S / 2) - yAt(a)} ${b} ${yAt(b)}`, { stroke: W.woodDeep, strokeWidth: 10, fill: "none" });
  return string + flags.join("");
}

/**
 * The icon as an <svg> `size` pixels square. `maskable` shrinks the bunting
 * and the cat into the middle 80%, the circle Android keeps; `small` is the
 * cat's face alone, bigger, for the 32 px browser-tab icon, where the flags
 * and spots would only be specks.
 */
export function appIconSvg({ size = S, maskable = false, small = false } = {}) {
  let art;
  if (small) art = face(512, 520, 800);
  else if (maskable) art = spots() + g({ transform: "translate(512 512) scale(0.8) translate(-512 -512)" }, bunting(), face(512, 598, 624));
  else art = spots() + bunting() + face(512, 598, 624);
  return svg(size, size, rect(0, 0, S, S, { fill: WALL }) + art, { viewBox: `0 0 ${S} ${S}`, label: "Landon's Game Room" });
}
