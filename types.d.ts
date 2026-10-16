// Ambient types for editor checking (jsconfig.json). Nothing here ships.
// lib is capped at ES2021 so newer-than-Safari-15 built-ins (.at(),
// Object.hasOwn) show up as errors.

interface Window {
  webkitAudioContext?: typeof AudioContext;
  /** Debug and test handle: the games, openGame() and goHome(). */
  __lg?: any;
}
