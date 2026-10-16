// Feelings' stories. IEP ELA goal: identify a character's feeling from a
// field of 2-3 picture choices. Level 1 is happy or sad (a field of 2),
// level 2 adds angry, level 3 adds scared.
import { shuffle } from "../core/rng.js";

export const MOODS = ["happy", "sad", "angry", "scared"];

// `id` names the story's picture in js/art/scenes.js. `who` sets the
// pronoun in the question, and every story names its character. `alsoOk`
// feelings are a fair answer too (a knocked-down tower can make you sad,
// not just angry), so they're never offered as the wrong choice.
export const STORIES = [
  { id: "ice-cream", who: "boy", text: "The boy dropped his ice cream.", answer: "sad" },
  { id: "birthday", who: "girl", text: "It is the girl's birthday party!", answer: "happy" },
  { id: "new-toy", who: "boy", text: "The boy got a new toy!", answer: "happy" },
  { id: "teddy", who: "girl", text: "The girl's teddy bear ripped.", answer: "sad" },
  { id: "puppy", who: "boy", text: "The boy is playing with his puppy!", answer: "happy" },
  { id: "rain", who: "girl", text: "It is raining, so the girl can't play outside.", answer: "sad", alsoOk: ["angry"] },
  { id: "pizza", who: "boy", text: "The boy is eating his favorite pizza!", answer: "happy" },
  { id: "balloon", who: "girl", text: "The girl's balloon flew away.", answer: "sad" },
  { id: "swimming", who: "boy", text: "The boy gets to go swimming today!", answer: "happy" },
  { id: "cookies", who: "girl", text: "The girl's cookies are all gone.", answer: "sad" },
  { id: "train", who: "boy", text: "The boy is going on a train ride!", answer: "happy" },
  { id: "knee", who: "girl", text: "The girl fell down and hurt her knee.", answer: "sad" },
  { id: "tower", who: "boy", text: "Someone knocked down the boy's tower.", answer: "angry", alsoOk: ["sad"] },
  { id: "candy", who: "girl", text: "Her brother took the girl's candy.", answer: "angry", alsoOk: ["sad"] },
  { id: "clean-up", who: "boy", text: "The boy has to stop playing and clean up.", answer: "angry", alsoOk: ["sad"] },
  { id: "scribble", who: "girl", text: "Someone scribbled in the girl's book.", answer: "angry", alsoOk: ["sad"] },
  { id: "dog-bark", who: "boy", text: "A big dog barked at the boy.", answer: "scared" },
  { id: "thunder", who: "girl", text: "The girl hears very loud thunder.", answer: "scared" },
  { id: "dark", who: "boy", text: "The lights went out, and the boy is in the dark.", answer: "scared" },
  { id: "spider", who: "girl", text: "A big spider ran by the girl.", answer: "scared" },
  { id: "race", who: "boy", text: "The boy won the race!", answer: "happy" },
  { id: "grandma", who: "girl", text: "Grandma came to visit the girl!", answer: "happy" },
  { id: "game-off", who: "boy", text: "The boy's game turned off before he saved.", answer: "angry", alsoOk: ["sad"] },
  { id: "playground", who: "girl", text: "The girl is going to the playground!", answer: "happy" },
];

// which feelings are in play, and how many face choices are shown
export const LEVELS = [
  { pool: ["happy", "sad"], field: 2 },
  { pool: ["happy", "sad", "angry"], field: 3 },
  { pool: ["happy", "sad", "angry", "scared"], field: 3 },
];

export const CLEAN_TO_LEVEL_UP = 3;   // right first time, in a row
export const MISSES_TO_EASE_DOWN = 2; // wrong in a row

export function storiesFor(level) {
  const { pool } = LEVELS[level - 1];
  return STORIES.filter((s) => pool.includes(s.answer));
}

export function pronoun(story) {
  return story.who === "girl" ? "she" : "he";
}

export function question(story) {
  return "How does " + pronoun(story) + " feel?";
}

// The answer and up to field-1 other feelings in play, never one that's
// also a fair answer (so a story can show fewer faces than the field).
export function choicesFor(story, level, rand = Math.random) {
  const { pool, field } = LEVELS[level - 1];
  const fair = story.alsoOk || [];
  const others = pool.filter((f) => f !== story.answer && !fair.includes(f));
  return shuffle([story.answer, ...shuffle(others, rand).slice(0, field - 1)], rand);
}
