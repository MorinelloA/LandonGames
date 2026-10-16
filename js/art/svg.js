// Tiny helpers for writing SVG as strings. Every builder in js/art returns
// a self-contained string, so the same art works inline in the page, in
// the Node tests, and drawn into a canvas.

export function esc(text) {
  return String(text)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// SVG attributes that are camelCase in SVG itself, so they're kept as written
const CAMEL = new Set(["viewBox", "preserveAspectRatio", "gradientUnits", "gradientTransform",
  "patternUnits", "patternTransform", "clipPathUnits", "textLength", "lengthAdjust"]);

function attrs(a = {}) {
  let out = "";
  for (const [k, v] of Object.entries(a)) {
    if (v === undefined || v === null || v === false) continue;
    // strokeWidth → stroke-width, ariaLabel → aria-label
    const name = CAMEL.has(k) ? k : k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
    out += ` ${name}="${esc(typeof v === "number" ? round(v) : v)}"`;
  }
  return out;
}

function round(n) {
  return Math.round(n * 100) / 100;
}

export function el(tag, a, body = "") {
  return body === null ? `<${tag}${attrs(a)}/>` : `<${tag}${attrs(a)}>${body}</${tag}>`;
}

export const g = (a, ...body) => el("g", a, body.join(""));
export const rect = (x, y, w, h, a = {}) => el("rect", { x, y, width: w, height: h, ...a }, null);
export const circle = (cx, cy, r, a = {}) => el("circle", { cx, cy, r, ...a }, null);
export const ellipse = (cx, cy, rx, ry, a = {}) => el("ellipse", { cx, cy, rx, ry, ...a }, null);
export const path = (d, a = {}) => el("path", { d, ...a }, null);
export const polygon = (points, a = {}) => el("polygon", { points: points.map((p) => p.map(round).join(",")).join(" "), ...a }, null);
export const line = (x1, y1, x2, y2, a = {}) => el("line", { x1, y1, x2, y2, ...a }, null);
export const text = (x, y, str, a = {}) => el("text", { x, y, ...a }, esc(str));
export const image = (href, x, y, w, h, a = {}) => el("image", { href, x, y, width: w, height: h, ...a }, null);

export const translate = (x, y, s = 1, flip = false) =>
  `translate(${round(x)} ${round(y)})` + (s !== 1 || flip ? ` scale(${round(flip ? -s : s)} ${round(s)})` : "");

// A complete <svg>. `w`/`h` set its size; the viewBox defaults to the same.
export function svg(w, h, body, { viewBox = `0 0 ${w} ${h}`, cls = "", label = "", extra = {} } = {}) {
  return el("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: w,
    height: h,
    viewBox,
    class: cls || undefined,
    role: label ? "img" : undefined,
    ariaLabel: label || undefined,
    ariaHidden: label ? undefined : "true",
    focusable: "false",
    ...extra,
  }, body);
}

// ids for clip paths and the like, unique within the page
let next = 0;
export function uid(prefix = "a") {
  next += 1;
  return prefix + next.toString(36);
}

// a rounded-corner rectangle as a path (for clip paths and lids)
export function roundRect(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  return `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
}

// points of a star (n tips) around cx, cy
export function starPoints(cx, cy, outer, inner, n = 5, rotate = -90) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = ((rotate + (i * 180) / n) * Math.PI) / 180;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}
