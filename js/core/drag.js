// Touch-friendly drag and drop with pointer events (works on iPad Safari).
//
//   enable(el, {
//     canDrag: () => bool,        optional gate
//     targets: () => [elements],  possible drop targets
//     reach: 0,                   optional: how far (stage units) outside a target still lands on it
//     onDrop: (target) => bool,   return true if the drop was accepted
//     onPickup: () => {},         optional
//     onEnd: () => {},            optional: after any drag, dropped or not
//   })
//
// Small movements (8 px or less) are taps: the normal click event fires.

// Pointer movement is in screen pixels; elements on a scaled stage move in
// stage units, so the stage tells drag how big one unit is on screen.
let screenPerUnit = () => 1;
export function setScale(fn) {
  screenPerUnit = fn;
}

// Which box a drop at (x, y) lands on: the nearest one within `reach` of
// the point, or -1. At reach 0 the point has to be on a box, and where two
// boxes touch the first one wins.
/**
 * @param {number} x @param {number} y
 * @param {{ left: number, top: number, right: number, bottom: number }[]} boxes
 * @param {number} [reach]
 */
export function landing(x, y, boxes, reach = 0) {
  let best = -1, bestDist = Infinity;
  boxes.forEach((b, i) => {
    const dist = Math.hypot(Math.max(b.left - x, 0, x - b.right), Math.max(b.top - y, 0, y - b.bottom));
    if (dist <= reach && dist < bestDist) {
      best = i;
      bestDist = dist;
    }
  });
  return best;
}

export function enable(el, opts) {
  el.style.touchAction = "none";
  el.addEventListener("pointerdown", down);

  function down(e) {
    if (opts.canDrag && !opts.canDrag()) return;
    if (!e.isPrimary) return;
    e.preventDefault();
    try { el.setPointerCapture(e.pointerId); } catch (_) {}

    const startX = e.clientX, startY = e.clientY;
    let scale = screenPerUnit() || 1;
    let moved = 0;
    let picked = false;

    const move = (ev) => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      moved = Math.max(moved, Math.hypot(dx, dy));
      if (!picked && moved > 8) {
        picked = true;
        el.classList.add("dragging");
        el.style.transition = "none"; // track the finger 1:1 — no easing lag
        // an element's own CSS scale multiplies its translate, so take it out
        const own = parseFloat(getComputedStyle(el).scale);
        scale = (screenPerUnit() || 1) * (own > 0 ? own : 1);
        if (opts.onPickup) opts.onPickup();
      }
      if (picked) el.style.transform = `translate(${dx / scale}px, ${dy / scale}px)`;
    };

    const up = (ev) => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      if (!picked) return; // it was a tap — let the click event do its thing

      // suppress the ghost click that follows a real drag
      const stop = (ce) => { ce.stopImmediatePropagation(); ce.preventDefault(); };
      el.addEventListener("click", stop, true);
      setTimeout(() => el.removeEventListener("click", stop, true), 350);

      // A cancelled pointer means iPadOS took the touch (a swipe from the
      // edge, Control Center), not that he let go here: never a drop.
      const cancelled = ev.type === "pointercancel";

      // find the drop target under (or within reach of) the dragged
      // element's center, measured while it's still where the finger left it
      const r = el.getBoundingClientRect();
      el.classList.remove("dragging");
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const targets = !cancelled && opts.targets ? opts.targets() : [];
      const hit = landing(cx, cy, targets.map((t) => t.getBoundingClientRect()), (opts.reach || 0) * (screenPerUnit() || 1));
      const target = hit < 0 ? null : targets[hit];

      el.style.transition = "";
      if (opts.onEnd) opts.onEnd();
      const accepted = !cancelled && opts.onDrop ? opts.onDrop(target) === true : false;
      if (!accepted) {
        // glide gently back home
        el.style.transition = "transform 0.3s";
        el.style.transform = "";
        setTimeout(() => { el.style.transition = ""; }, 320);
      }
      // on an accepted drop the game decides what happens to the element
    };

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  }
}
