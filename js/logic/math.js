// Math Bubbles' problems. The level ladder follows Landon's IEP math goal
// (add and subtract within 20, from a field of 2 to 3 answers), with two
// levels above it to grow into.
import { shuffle, upTo } from "../core/rng.js";

export const MAX_LEVEL = 6;
export const LEVEL_UP_STREAK = 4;   // right in a row to level up
export const LEVEL_DOWN_MISSES = 2; // wrong in a row to ease back down
export const STAR_EVERY = 5;        // a star for every 5 solved

// the biggest number a level's problems can make; wrong answers stay under
// it so they're never a giveaway (a 13 beside a level-1 answer of 9)
export function levelMax(level) {
  return level <= 3 ? 10 : level <= 5 ? 20 : 30;
}

// how many answer bubbles at each level (IEP: a field of 2, then 3)
export function bubbleCount(level) {
  return level === 1 ? 2 : level <= 4 ? 3 : 4;
}

// addition with the SUM capped (IEP: "sums or differences within 20")
function addWithin(max, rand) {
  const a = upTo(max - 1, rand);
  const b = upTo(max - a, rand);
  return { a, b, op: "+", answer: a + b };
}

function subWithin(max, rand) {
  let a = upTo(max, rand), b = upTo(max, rand);
  if (b > a) [a, b] = [b, a];
  return { a, b, op: "−", answer: a - b };
}

// Levels 1-4 track the IEP objectives; 5-6 are room to grow.
export function generate(level, rand = Math.random) {
  const coin = () => rand() < 0.5;
  switch (level) {
    case 1:
    case 2: return addWithin(10, rand);
    case 3: return coin() ? addWithin(10, rand) : subWithin(10, rand);
    case 4:
    case 5: return coin() ? addWithin(20, rand) : subWithin(20, rand);
    default: {
      if (coin()) {
        const a = upTo(5, rand), b = upTo(5, rand);
        return { a, b, op: "×", answer: a * b };
      }
      return coin() ? addWithin(30, rand) : subWithin(30, rand);
    }
  }
}

// believable wrong answers: near the right one, inside the level's range
export function wrongAnswers(answer, count, level, rand = Math.random) {
  const seen = new Set([answer]);
  const spread = Math.max(4, Math.round(answer * 0.3));
  const max = levelMax(level);
  const out = [];
  while (out.length < count) {
    const w = answer + Math.floor(rand() * (spread * 2 + 1)) - spread;
    if (w < 0 || w > max || seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  return out;
}

// the bubbles for a problem: the answer and its wrong answers, shuffled
export function choices(problem, level, rand = Math.random) {
  const wrong = wrongAnswers(problem.answer, bubbleCount(level) - 1, level, rand);
  return shuffle([problem.answer, ...wrong], rand);
}
