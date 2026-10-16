// A jigsaw piece's outline as SVG path data, for a piece whose square is
// (0, 0) to (P, P). Tabs stick out up to MARGIN x P past the square, so a
// piece's picture needs that much room on every side. The knob is the same
// read from either end, so a tab and the hole beside it always match.

export const MARGIN = 0.27;

// the knob along an edge, as (along, out) fractions of the edge
const KNOB = [
  ["L", [0.36, 0]],
  ["C", [0.4, 0], [0.4, 0.07], [0.37, 0.11]],
  ["C", [0.3, 0.2], [0.42, 0.26], [0.5, 0.26]],
  ["C", [0.58, 0.26], [0.7, 0.2], [0.63, 0.11]],
  ["C", [0.6, 0.07], [0.6, 0], [0.64, 0]],
  ["L", [1, 0]],
];

const r = (n) => Math.round(n * 100) / 100;

// one edge from corner a to corner b; `out` is the outward normal; `kind`
// is 0 (flat), 1 (tab) or -1 (hole)
function edge(a, b, out, kind, P) {
  if (kind === 0) return `L${r(b[0])} ${r(b[1])}`;
  const pt = ([u, v]) => {
    const x = a[0] + (b[0] - a[0]) * u + out[0] * v * kind * P;
    const y = a[1] + (b[1] - a[1]) * u + out[1] * v * kind * P;
    return `${r(x)} ${r(y)}`;
  };
  return KNOB.map(([cmd, ...pts]) => cmd + pts.map(pt).join(" ")).join("");
}

export function piecePath(P, { top, right, bottom, left }) {
  return `M0 0` +
    edge([0, 0], [P, 0], [0, -1], top, P) +
    edge([P, 0], [P, P], [1, 0], right, P) +
    edge([P, P], [0, P], [0, 1], bottom, P) +
    edge([0, P], [0, 0], [-1, 0], left, P) + "Z";
}
