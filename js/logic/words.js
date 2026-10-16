// Word Builder's words and levels. Words grow from 3 to 6 letters, and
// decoy letters (never in the word) join at the top levels.
import { shuffle } from "../core/rng.js";

// each word's picture is the icon of the same name (js/art/icons.js)
export const WORDS = [
  "cat", "dog", "sun", "bee", "cow", "pig", "fox", "owl", "bus", "car",
  "hat", "egg", "ant", "cup", "key", "star", "fish", "frog", "cake", "milk",
  "ball", "duck", "bear", "lion", "moon", "tree", "boat", "bird", "corn", "ring",
  "apple", "pizza", "robot", "train", "house", "snake", "sheep", "mouse", "grape", "tiger",
  "whale", "zebra", "bread", "cloud", "heart", "rabbit", "monkey", "banana", "orange", "cookie",
  "flower", "turtle", "dragon", "rocket", "cherry",
];

// level → which word lengths he sees, plus decoy letters at the top levels
export const LEVELS = [
  { lengths: [3], decoys: 0 },        // 1
  { lengths: [3, 4], decoys: 0 },     // 2
  { lengths: [4], decoys: 0 },        // 3
  { lengths: [4, 5], decoys: 0 },     // 4
  { lengths: [5], decoys: 1 },        // 5
  { lengths: [5, 6], decoys: 1 },     // 6
  { lengths: [6], decoys: 2 },        // 7
];

export const CLEAN_TO_LEVEL_UP = 3;   // perfect words in a row
export const ERRORS_TO_EASE_DOWN = 3; // mistakes on one word

export function wordPool(level) {
  const { lengths } = LEVELS[level - 1];
  return WORDS.filter((w) => lengths.includes(w.length));
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

// The word's letters plus decoys, shuffled, and never dealt already
// spelling the word (1 time in 6 for a 3-letter word). Decoys aren't in
// the word, so they're skipped when checking the order.
export function deal(word, decoys, rand = Math.random) {
  const tiles = word.split("");
  while (tiles.length < word.length + decoys) {
    const ch = ALPHABET[Math.floor(rand() * 26)];
    if (!word.includes(ch) && !tiles.includes(ch)) tiles.push(ch);
  }
  let dealt = shuffle(tiles, rand);
  for (let tries = 0; tries < 20 && inOrder(dealt, word); tries++) {
    dealt = shuffle(tiles, rand);
  }
  return dealt;
}

export function inOrder(tiles, word) {
  return tiles.filter((ch) => word.includes(ch)).join("") === word;
}
