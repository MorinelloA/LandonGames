// Randomness helpers. Each takes an optional `rand` (a function returning
// 0 <= x < 1) so the tests can pass a seeded one.

export function shuffle(arr, rand = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pick(arr, rand = Math.random) {
  return arr[Math.floor(rand() * arr.length)];
}

// n different items, never any in `exclude`
export function pickN(arr, n, exclude = [], rand = Math.random) {
  return shuffle(arr.filter((x) => !exclude.includes(x)), rand).slice(0, n);
}

// a whole number from 1 to n
export function upTo(n, rand = Math.random) {
  return 1 + Math.floor(rand() * n);
}
