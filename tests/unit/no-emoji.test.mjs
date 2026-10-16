// Everything on screen is drawn: no emoji in the page, the styles or the
// code, so every device shows the same pictures. (js/art/icons.js names an
// emoji per icon only so tools/vendor-icons.mjs can find its picture.)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { ROOT } from "../helpers.mjs";

function files(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

const PICTOGRAPH = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{FE0F}]/u;

test("no emoji in the page, styles or code", () => {
  const checked = [join(ROOT, "index.html"), ...files(join(ROOT, "css")), ...files(join(ROOT, "js"))]
    .filter((f) => !f.endsWith(join("art", "icons.js")));
  const found = [];
  for (const f of checked) {
    readFileSync(f, "utf8").split("\n").forEach((line, i) => {
      if (PICTOGRAPH.test(line)) found.push(`${relative(ROOT, f)}:${i + 1}`);
    });
  }
  assert.deepEqual(found, []);
});
