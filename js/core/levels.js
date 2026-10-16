// A game's difficulty level, kept on the device under its old
// localStorage key (landon-math-level and friends) so progress survives.
// Storage can be missing or throw (private browsing); the level still works,
// it just isn't remembered.

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

export function createLevel({ key, min = 1, max, storage = null }) {
  const store = () => storage || globalThis.localStorage;
  let saved = NaN;
  try {
    saved = parseInt(store().getItem(key), 10);
  } catch (_) {}
  let value = Number.isFinite(saved) ? clamp(saved, min, max) : min;

  return {
    get value() { return value; },
    get min() { return min; },
    get max() { return max; },
    set(v) {
      value = clamp(v, min, max);
      try {
        store().setItem(key, String(value));
      } catch (_) {}
      return value;
    },
    up() { return this.set(value + 1); },
    down() { return this.set(value - 1); },
  };
}
