// The quiet pause after a wrong answer. No sound, no animation — just a
// few seconds where nothing responds. Sounds are the reward, so mistakes
// earn silence and a short wait.
import * as Sound from "./sound.js";

const freezeEl = document.getElementById("freeze-overlay");
let frozen = false;

export function freeze(ms = 3000, onDone = null) {
  if (frozen) return;
  frozen = true;
  Sound.hush();
  freezeEl.classList.remove("hidden");
  setTimeout(() => {
    frozen = false;
    freezeEl.classList.add("hidden");
    if (onDone) onDone();
  }, ms);
}

export function isFrozen() {
  return frozen;
}
