// Touch-friendly drag and drop with pointer events (works on iPad Safari).
//
//   enable(el, {
//     canDrag: () => bool,        optional gate
//     targets: () => [elements],  possible drop targets
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

export function enable(el, opts) {
  el.style.touchAction = "none";
  el.addEventListener("pointerdown", down);

  function down(e) {
    if (opts.canDrag && !opts.canDrag()) return;
    if (!e.isPrimary) return;
    e.preventDefault();
    try { el.setPointerCapture(e.pointerId); } catch (_) {}

    const startX = e.clientX, startY = e.clientY;
    const scale = screenPerUnit() || 1;
    let moved = 0;
    let picked = false;

    const move = (ev) => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      moved = Math.max(moved, Math.hypot(dx, dy));
      if (!picked && moved > 8) {
        picked = true;
        el.classList.add("dragging");
        el.style.transition = "none"; // track the finger 1:1 — no easing lag
        if (opts.onPickup) opts.onPickup();
      }
      if (picked) el.style.transform = `translate(${dx / scale}px, ${dy / scale}px)`;
    };

    const up = (ev) => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      if (!picked) return; // it was a tap — let the click event do its thing

      el.classList.remove("dragging");
      // suppress the ghost click that follows a real drag
      const stop = (ce) => { ce.stopImmediatePropagation(); ce.preventDefault(); };
      el.addEventListener("click", stop, true);
      setTimeout(() => el.removeEventListener("click", stop, true), 350);

      // A cancelled pointer means iPadOS took the touch (a swipe from the
      // edge, Control Center), not that he let go here: never a drop.
      const cancelled = ev.type === "pointercancel";

      // find the drop target under the dragged element's center
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let target = null;
      for (const t of (!cancelled && opts.targets ? opts.targets() : [])) {
        const tr = t.getBoundingClientRect();
        if (cx >= tr.left && cx <= tr.right && cy >= tr.top && cy <= tr.bottom) {
          target = t;
          break;
        }
      }

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
