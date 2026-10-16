// Lists everything the games ask and what counts as right, straight from
// the games' own data (tools/content-sheet.html), for a teacher or
// therapist to check: Sort It's prompts, the Feelings stories, the word and
// math levels, Counting's themes and Trace It's stroke order.
import { CLASSES, FUNCTIONS, FUNCTION_DISTRACTORS, FEATURES, STAR_EVERY as SORT_STARS } from "../js/logic/sortit.js";
import { STORIES, LEVELS as FEEL_LEVELS, CLEAN_TO_LEVEL_UP as FEEL_UP, MISSES_TO_EASE_DOWN as FEEL_DOWN, question } from "../js/logic/feelings.js";
import { LEVELS as WORD_LEVELS, CLEAN_TO_LEVEL_UP as WORD_UP, ERRORS_TO_EASE_DOWN as WORD_DOWN, wordPool } from "../js/logic/words.js";
import { MAX_LEVEL, LEVEL_UP_STREAK, LEVEL_DOWN_MISSES, STAR_EVERY as MATH_STARS, levelMax, bubbleCount, generate } from "../js/logic/math.js";
import { THEMES, MIN_COUNT, MAX_COUNT } from "../js/logic/counting.js";
import { LETTERS, LOWERCASE, DIGITS } from "../js/logic/trace.js";
import { ICONS, iconUrl } from "../js/art/icons.js";
import { storyScene } from "../js/art/scenes.js";
import { faceSvg } from "../js/art/people.js";
import { NOTES, shade } from "../js/art/theme.js";
import { esc, g, path, circle, text, polygon, rect, svg } from "../js/art/svg.js";

const sheet = document.getElementById("sheet");
const toc = document.getElementById("toc");

const name = (id) => id.replace(/_/g, " ");
const p = (html) => `<p>${html}</p>`;
const h3 = (html) => `<h3>${html}</h3>`;
const none = `<span class="none">none</span>`;
// [1, 2, 3] → "1 to 3"
const levelSpan = (levels) => (levels.length === 1 ? String(levels[0]) : `${levels[0]} to ${levels[levels.length - 1]}`);

// a vocabulary picture and its name; things that are only ever ruled out
// needn't have a picture
function pic(id) {
  if (!(id in ICONS)) return `<span class="pic no-art">${esc(name(id))}</span>`;
  return `<span class="pic"><img src="${iconUrl(id)}" width="44" height="44" alt="">${esc(name(id))}</span>`;
}
const pics = (ids) => (ids.length ? `<div class="pics">${ids.map(pic).join("")}</div>` : none);

function table(head, rows) {
  const th = head.map((h) => `<th>${h}</th>`).join("");
  const tr = rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("");
  return `<table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}

function section(id, title, html) {
  sheet.insertAdjacentHTML("beforeend", `<h2 id="${id}">${esc(title)}</h2>${html}`);
  toc.insertAdjacentHTML("beforeend", `<a href="#${id}">${esc(title)}</a>`);
}

/* ---- Sort It! ---- */

const opposite = (f) => FEATURES.find((x) => x.name === f.opposite);
section("sortit", "Sort It!",
  p(`Three pictures, with the prompt on screen and spoken aloud. One picture is right; any other brings the quiet pause, so a wrong choice must never also be right. Rounds take turns: find by class, by what it's for, then by a feature. A star for every ${SORT_STARS} found.`) +
  h3("Find by class") +
  p("The right picture comes from the class; the two wrong ones come from two other classes.") +
  table(["Prompt", "Right answers"], Object.entries(CLASSES).map(([cls, items]) => [`Find the ${esc(cls)}!`, pics(items)])) +
  h3("Find by what it's for") +
  p("The wrong pictures come from a list of things none of the questions is about (below the table). Things that also answer a question are never offered as wrong ones, so they needn't have pictures.") +
  table(["Prompt", "Spoken", "Right answers", "Also right, so never offered"],
    FUNCTIONS.map((f) => [esc(f.prompt), f.say === f.prompt ? `<span class="none">the same</span>` : esc(f.say), pics(f.correct), pics(f.maybe)])) +
  p("The wrong pictures:") + pics(FUNCTION_DISTRACTORS) +
  h3("Find by feature") +
  p("Features come in opposite pairs, and the wrong pictures come only from the opposite, so they're never also right. Big and little things are drawn at their relative size.") +
  table(["Prompt", "Right answers", "Wrong choices"],
    FEATURES.filter((f) => f.ask !== false).map((f) => [`Which one is ${esc(f.name)}?`, pics(f.items), pics(opposite(f).items)])) +
  p(FEATURES.filter((f) => f.ask === false)
    .map((f) => `"${esc(f.name)}" is never asked; its pictures are only wrong choices for "${esc(f.opposite)}".`).join(" ")),
);

/* ---- Feelings ---- */

// the story's picture cropped to the stage, as the game shows it
function stageOnly(art) {
  return art.replace(/^<svg[^>]*>/, (tag) => tag
    .replace(/ width="[^"]*"/, ' width="1133"')
    .replace(/ height="[^"]*"/, ' height="640"')
    .replace(/viewBox="[^"]*"/, 'viewBox="0 0 1133 640"'));
}
const feelLevels = (s) => FEEL_LEVELS.map((l, i) => (l.pool.includes(s.answer) ? i + 1 : 0)).filter(Boolean);

section("feelings", "Feelings",
  p(`A short story is spoken, then the question. The picture shows what happened, with the character's face neutral; once the right face is dropped on the story, the character wears it. ${FEEL_UP} right first time in a row moves up a level; ${FEEL_DOWN} misses in a row move back down.`) +
  table(["Level", "Feelings in play", "Faces to choose from"],
    FEEL_LEVELS.map((l, i) => [String(i + 1), esc(l.pool.join(", ")), String(l.field)])) +
  p("A feeling that's also a fair answer to a story is never offered as a wrong choice, so that story can show fewer faces.") +
  table(["Picture", "Story, then question", "Right answer", "Also fair, so never offered", "Levels"],
    STORIES.map((s) => [
      `<div class="scene">${stageOnly(storyScene(s.id))}</div>`,
      `${esc(s.text)}<br><span class="soft">${esc(question(s))}</span>`,
      `<span class="face">${faceSvg({ who: s.who, mood: s.answer, size: 56 })}${esc(s.answer)}</span>`,
      s.alsoOk ? esc(s.alsoOk.join(", ")) : none,
      levelSpan(feelLevels(s)),
    ])),
);

/* ---- Word Builder ---- */

section("words", "Word Builder",
  p(`The picture is shown and the word spoken; the letter blocks are shuffled, never already in order. Extra letters that aren't in the word join at the top levels. ${WORD_UP} words in a row with no mistakes moves up a level; a word with ${WORD_DOWN} or more mistakes moves back down.`) +
  table(["Level", "Letters", "Extra letters", "Words"],
    WORD_LEVELS.map((l, i) => [String(i + 1), l.lengths.join(" or "), String(l.decoys), pics(wordPool(i + 1))])),
);

/* ---- Math Bubbles ---- */

// a fixed sample of a level's problems, so the table describes the
// generator itself rather than a copy of its rules
function sample(level, n = 3000) {
  let seed = 7919 * level;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: n }, () => generate(level, rand));
}
const OPS = { "+": "adding", "−": "taking away", "×": "times" };

section("math", "Math Bubbles",
  p(`Drag the bubble with the answer into the sum. The wrong answers are near the right one and stay within the level's numbers. ${LEVEL_UP_STREAK} right in a row moves up a level; ${LEVEL_DOWN_MISSES} misses in a row move back down. A star for every ${MATH_STARS} solved. Levels 1 to 4 follow the IEP math goal; 5 and 6 are room to grow.`) +
  table(["Level", "Problems", "Numbers up to", "Answer bubbles", "For example"],
    Array.from({ length: MAX_LEVEL }, (_, i) => {
      const level = i + 1;
      const problems = sample(level);
      const ops = Object.keys(OPS).filter((op) => problems.some((q) => q.op === op));
      // two of each kind, with different answers
      const examples = ops.flatMap((op) => {
        const mine = problems.filter((q) => q.op === op);
        return [mine[0], mine.find((q) => q.answer !== mine[0].answer)].filter(Boolean);
      });
      return [
        String(level),
        ops.map((op) => OPS[op]).join(", "),
        String(levelMax(level)),
        String(bubbleCount(level)),
        examples.map((q) => `${q.a} ${q.op} ${q.b} = ${q.answer}`).join("<br>"),
      ];
    })),
);

/* ---- Counting Time ---- */

section("counting", "Counting Time",
  p(`${MIN_COUNT} to ${MAX_COUNT} things to count, by dragging each into the basket or tapping it; each one is counted aloud. Once the last is counted, three numbers appear: the total and two near it.`) +
  table(["Things", "Prompt", "Place"],
    THEMES.map((t) => [pic(t.item), `Count the ${esc(t.plural)}!`, esc(t.place)])),
);

/* ---- Trace It ---- */

// the game's paper (js/games/trace.js) with its handwriting lines; each
// stroke in its own colour, with its number and an arrow where it starts
const RULE = "#A9CBEB";
const INKS = [NOTES[5], NOTES[0], NOTES[3], NOTES[6]].map((c) => shade(c, -0.2));
function glyph(strokes, lower) {
  const solid = (y) => path(`M-2 ${y}H102`, { stroke: RULE, strokeWidth: 0.9 });
  const dashed = (y) => path(`M-2 ${y}H102`, { stroke: RULE, strokeWidth: 0.9, strokeDasharray: "2.5 2" });
  const rules = lower
    ? solid(8) + dashed(35) + solid(80) + path("M-2 96H102", { stroke: RULE, strokeWidth: 0.6, opacity: 0.6 })
    : solid(10) + dashed(50) + solid(90);
  const ink = (i) => INKS[i % INKS.length];
  const lines = strokes.map((s, i) => path("M" + s.map((pt) => pt.join(" ")).join("L"), {
    fill: "none", stroke: ink(i), strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round", opacity: 0.7,
  })).join("");
  const placed = [];
  const marks = strokes.map((s, i) => {
    const [x0, y0] = s[0], [x2, y2] = s[1];
    const len = Math.hypot(x2 - x0, y2 - y0) || 1;
    const ux = (x2 - x0) / len, uy = (y2 - y0) / len;
    // where two strokes start together (the top of A), the later number
    // moves clear of the earlier one, along its own stroke
    let x = x0, y = y0;
    for (const [px, py] of placed) {
      const d = Math.hypot(x - px, y - py);
      if (d >= 12) continue;
      const [dx, dy] = d > 0.5 ? [(x - px) / d, (y - py) / d] : [ux, uy];
      x = px + dx * 12;
      y = py + dy * 12;
    }
    placed.push([x, y]);
    const ax = x + ux * 9, ay = y + uy * 9;
    const arrow = len < 8 ? "" // a dot (on i and j) needs no arrow
      : polygon([[ax + ux * 4, ay + uy * 4], [ax - uy * 3, ay + ux * 3], [ax + uy * 3, ay - ux * 3]], { fill: ink(i) });
    return arrow + circle(x, y, 5.5, { fill: ink(i), stroke: "#FFFFFF", strokeWidth: 1 }) +
      text(x, y + 2.6, String(i + 1), { textAnchor: "middle", fontSize: 7.5, fontWeight: 700, fill: "#FFFFFF", fontFamily: "Fredoka, sans-serif" });
  }).join("");
  return svg(132, 132, g({}, rect(-5, -5, 110, 110, { rx: 6, fill: "#FFFFFF" }), rules, lines, marks), { viewBox: "-6 -6 112 112" });
}
const glyphs = (set, lower) =>
  `<div class="glyphs">${Object.values(set).map((strokes) => `<div class="glyph">${glyph(strokes, lower)}</div>`).join("")}</div>`;

section("trace", "Trace It",
  p("Each stroke is in its own colour, and starts at its numbered dot going the way its arrow points. Where two strokes start at the same place, the second number sits a little way along its stroke. In the game, a finger has to reach each point along a stroke in turn, so straying off the path just doesn't move on. Capitals and numbers fill the space between the top and bottom lines. Little letters sit on the baseline and reach up to the dashed line; tall letters reach the top line, and tails drop below the baseline.") +
  h3("Capital letters") + glyphs(LETTERS, false) +
  h3("Little letters") + glyphs(LOWERCASE, true) +
  h3("Numbers") + glyphs(DIGITS, false) +
  p("Cut mode is a wavy line across the paper, different each time, cut from left to right."),
);
