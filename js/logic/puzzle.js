// Puzzle sizes for Puzzle Builder and Picture Puzzle: the grid grows from
// 2x2 to 6x6 after clean solves and shrinks back after hard ones. Wrong
// drops never freeze — puzzling is trial and error — but they're counted.
export const MIN_SIZE = 2;
export const MAX_SIZE = 6;

export function nextSize(n, errors, min = MIN_SIZE, max = MAX_SIZE) {
  if (errors <= 1 && n < max) return n + 1;
  if (errors >= n * n && n > min) return n - 1;
  return n;
}
