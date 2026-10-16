// Draws every piece of art on one page (tools/art-sheet.html).
import { catSvg } from "../js/art/mascot.js";
import { MOODS, POSES, faceSvg, personSvg } from "../js/art/people.js";
import { PLACES, backdropSvg } from "../js/art/backdrops.js";
import { storyScene } from "../js/art/scenes.js";
import { STORIES } from "../js/logic/feelings.js";

const sheet = document.getElementById("sheet");

function section(title, cells, cls = "") {
  const h = document.createElement("h2");
  h.textContent = title;
  const row = document.createElement("div");
  row.className = "row " + cls;
  for (const [label, html] of cells) {
    const c = document.createElement("div");
    c.className = "cell";
    c.innerHTML = html + `<div>${label}</div>`;
    row.appendChild(c);
  }
  sheet.append(h, row);
}

const sections = [];
export function add(title, cells, cls) {
  sections.push([title, cells, cls]);
}

add("The cat", ["sit", "wave", "cheer", "point", "peek"].map((pose) => [pose, catSvg({ pose, size: 200 })]));
for (const who of ["boy", "girl", "grandma"]) {
  add(`Faces: ${who}`, MOODS.map((mood) => [mood, faceSvg({ who, mood, size: 120 })]));
}
add("Poses", Object.keys(POSES).map((pose) => [pose, personSvg({ who: pose.startsWith("sit") ? "girl" : "boy", pose, size: 220 })]));
add("Grandma", [["stand", personSvg({ who: "grandma", size: 220 })], ["handsOut", personSvg({ who: "grandma", pose: "handsOut", size: 220 })]]);

// the dashed box is the stage; everything outside it is bleed
const outline = '<rect x="0" y="0" width="1133" height="640" fill="none" stroke="#4A3426" stroke-width="4" stroke-dasharray="18 12"/>';
add("Places", Object.keys(PLACES).map((name) => [name, backdropSvg(name).replace(/<\/svg>$/, outline + "</svg>")]), "wide");
add("Feelings stories", STORIES.map((s) => [`${s.id} (${s.answer})`, storyScene(s.id).replace(/<\/svg>$/, outline + "</svg>")]), "wide");

// later sections register themselves from art-sheet-*.js as the art grows
for (const [title, cells, cls] of sections) section(title, cells, cls);
