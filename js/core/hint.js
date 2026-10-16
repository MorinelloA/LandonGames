// Help always gets a real hint: the thing to use next glows for a moment.
export function glow(el, ms = 2200, cls = "hint-glow") {
  if (!el) return;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), ms);
}
