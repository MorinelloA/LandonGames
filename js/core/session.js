// A visit is one stay on one screen: opening a game, or going home, starts
// a new one. A game's pending steps (the next round, a rebuild, a spoken
// line) belong to the visit that scheduled them, so a step left over from
// an old visit never fires into a new one.

let visit = 0;

export function newVisit() {
  visit++;
}

export function later(fn, ms = 0) {
  const mine = visit;
  return setTimeout(() => {
    if (mine === visit) fn();
  }, ms);
}
