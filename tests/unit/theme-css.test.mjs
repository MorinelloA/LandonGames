// css/style.css mirrors the page colours in js/art/theme.js, and text stays
// easy to read on the surfaces it sits on.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../helpers.mjs";
import { PAGE, ACCENT } from "../../js/art/theme.js";

const css = readFileSync(join(ROOT, "css", "style.css"), "utf8");
const root = css.slice(css.indexOf(":root {"), css.indexOf("}", css.indexOf(":root {")));
const cssVar = (name) => {
  const m = root.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`));
  return m && m[1].toUpperCase();
};
const kebab = (k) => k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const lin = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test("the page colours in CSS match theme.js", () => {
  for (const [k, v] of Object.entries(PAGE)) assert.equal(cssVar(kebab(k)), v.toUpperCase(), `--${kebab(k)}`);
  for (const [game, v] of Object.entries(ACCENT)) assert.equal(cssVar("accent-" + game), v.toUpperCase(), `--accent-${game}`);
});

test("text is easy to read on paper, cream and white", () => {
  for (const bg of [PAGE.paper, PAGE.cream, "#FFFFFF"]) {
    assert.ok(contrast(PAGE.ink, bg) >= 7, `ink on ${bg}: ${contrast(PAGE.ink, bg).toFixed(2)}`);
    assert.ok(contrast(PAGE.inkSoft, bg) >= 4.5, `soft ink on ${bg}: ${contrast(PAGE.inkSoft, bg).toFixed(2)}`);
  }
});
