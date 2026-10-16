// Small motions shared by the games.
import { stageScale } from "./stage.js";

// Send an element (often one just dropped by a drag) into a target: it
// glides to the target's middle, shrinking and fading. Reduce Motion skips
// straight to gone.
export function flyInto(el, target, { scale = 0.3, ms = 380 } = {}) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    el.style.opacity = "0";
    return;
  }
  const a = el.getBoundingClientRect(), b = target.getBoundingClientRect();
  const s = stageScale() || 1;
  const dx = (b.left + b.width / 2 - (a.left + a.width / 2)) / s;
  const dy = (b.top + b.height / 2 - (a.top + a.height / 2)) / s;
  const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(el.style.transform || "");
  const [tx, ty] = m ? [Number(m[1]), Number(m[2])] : [0, 0];
  el.style.pointerEvents = "none";
  el.style.transition = `transform ${ms}ms ease-in, opacity ${ms}ms ease-in`;
  el.style.transform = `translate(${tx + dx}px, ${ty + dy}px) scale(${scale})`;
  el.style.opacity = "0";
}

// a one-off CSS class, removed when its animation would have finished
export function flash(el, cls, ms = 450) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), ms);
}
