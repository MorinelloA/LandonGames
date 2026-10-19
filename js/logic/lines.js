// Every line the Game Room says out loud, in one place. The games build
// their speech from these, and tools/voice.mjs records each line in
// allLines() as a clip in voice/, so the narrator never meets a line it
// hasn't recorded. A test fails if one is missing.
import { WORDS } from "./words.js";
import { MOODS, STORIES, question } from "./feelings.js";
import { THEMES, MIN_COUNT, MAX_COUNT } from "./counting.js";
import { MAX_LEVEL, levelMax } from "./math.js";
import { ANIMALS } from "./memory.js";
import { SONGS } from "./music.js";
import { LETTERS, LOWERCASE, DIGITS } from "./trace.js";
import { spokenPrompts } from "./sortit.js";

export const HELP = "Help please";
export const LEVEL_UP = "Level up!";
export const HOW_MANY = "How many?";
export const FOUND_CHEESE = "You found the cheese! Great job!";
export const FOUND_ANIMALS = "You found all the animals! Amazing!";
export const WHOLE_PICTURE = "You built the whole picture! Amazing!";
export const PICK_PHOTO = "Pick a photo!";
export const TAP_BARS = "Tap the bars to make music!";
export const CUT_LINE = "Cut along the line!";

/** @param {{ plural: string }} theme */
export const countThe = (theme) => "Count the " + theme.plural + "!";
/** @param {number} n */
export const number = (n) => String(n);
/** @param {number} n */
export const countRight = (n) => n + "! That's right!";
/** @param {string} feeling */
export const feelingRight = (feeling) => feeling + "! That's right!";
/** @param {string} word */
export const greatJob = (word) => word + "! Great job!";
/** @param {{ name: string }} song */
export const letsPlay = (song) => "Let's play " + song.name + "! Follow the glowing bar.";

/** Trace It's prompt: mode is "abc", "lower" or "num". @param {string} mode @param {string} char */
export function traceThe(mode, char) {
  const kind = mode === "num" ? "number " : mode === "lower" ? "little letter " : "big letter ";
  return "Trace the " + kind + char;
}
/** @param {string} char */
export const niceTracing = (char) => char + "! Nice tracing!";

// Math Bubbles reads each problem a word at a time, in the order it's
// written: 3 + 4 = ? is "3", "plus", "4", "equals what?"
/** @type {Record<string, string>} */
export const SIGN_WORDS = { "+": "plus", "−": "minus", "×": "times" };
export const EQUALS_WHAT = "equals what?";
/** @param {{ a: number, op: string, b: number }} problem */
export const readProblem = (problem) => [number(problem.a), SIGN_WORDS[problem.op], number(problem.b), EQUALS_WHAT];

// Everything the games can say, built from the same data they use.
export function allLines() {
  const lines = [HELP, LEVEL_UP, HOW_MANY, FOUND_CHEESE, FOUND_ANIMALS, WHOLE_PICTURE, PICK_PHOTO, TAP_BARS, CUT_LINE];
  for (const story of STORIES) lines.push(story.text, question(story));
  for (const mood of MOODS) lines.push(feelingRight(mood));
  for (const theme of THEMES) lines.push(countThe(theme));
  for (let n = 1; n <= MAX_COUNT; n++) lines.push(number(n));
  for (let n = MIN_COUNT; n <= MAX_COUNT; n++) lines.push(countRight(n));
  for (let n = 1; n <= levelMax(MAX_LEVEL); n++) lines.push(number(n));
  lines.push(...Object.values(SIGN_WORDS), EQUALS_WHAT);
  for (const word of WORDS) lines.push(word, greatJob(word));
  for (const animal of ANIMALS) lines.push(animal.name);
  for (const song of Object.values(SONGS)) lines.push(letsPlay(song));
  for (const [mode, set] of /** @type {[string, object][]} */ ([["abc", LETTERS], ["lower", LOWERCASE], ["num", DIGITS]])) {
    for (const char of Object.keys(set)) lines.push(traceThe(mode, char), niceTracing(char));
  }
  lines.push(...spokenPrompts());
  return [...new Set(lines)];
}
