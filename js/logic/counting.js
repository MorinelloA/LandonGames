// Counting Time's rounds: 3 to 10 things to count, then three numbers to
// pick the total from.
import { shuffle } from "../core/rng.js";

export const THEMES = ["🐟", "⭐", "🍎", "🐞", "🎈", "🐢", "🌸", "🚀", "🦋", "🍪"];
export const MIN_COUNT = 3;
export const MAX_COUNT = 10;

export function newTarget(rand = Math.random) {
  return MIN_COUNT + Math.floor(rand() * (MAX_COUNT - MIN_COUNT + 1));
}

// the total and two numbers near it, all different, all from 1 to 12
export function answerOptions(target, rand = Math.random) {
  const options = new Set([target]);
  while (options.size < 3) {
    const w = target + Math.floor(rand() * 5) - 2;
    if (w >= 1 && w <= 12) options.add(w);
  }
  return shuffle([...options], rand);
}
