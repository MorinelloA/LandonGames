// What ships: sw.js keeps every file the games load (so they play offline),
// the page's links resolve, and the photos stay small.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, normalize, relative } from "node:path";
import { ROOT } from "../helpers.mjs";
import { plan, stamped } from "../../tools/stamp-sw.mjs";
import { ICONS } from "../../js/art/icons.js";

const assets = new Set(plan().assets);
const rel = (p) => relative(ROOT, p).split("\\").join("/");

test("sw.js is stamped with the current files", () => {
  const src = readFileSync(join(ROOT, "sw.js"), "utf8");
  assert.equal(stamped(src, plan()), src, "run node tools/stamp-sw.mjs");
});

test("every file sw.js keeps exists", () => {
  for (const a of assets) if (a !== "./") assert.ok(existsSync(join(ROOT, a)), a);
});

test("every module the games load is kept offline", () => {
  const seen = new Set();
  const visit = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    assert.ok(assets.has(rel(file)), `${rel(file)} isn't in sw.js`);
    const src = readFileSync(file, "utf8");
    for (const [, spec] of src.matchAll(/(?:from|import\()\s*["'](\.[^"']+)["']/g)) {
      visit(normalize(join(dirname(file), spec)));
    }
  };
  visit(join(ROOT, "js", "main.js"));
  assert.ok(seen.size > 30, `only ${seen.size} modules found`);
});

test("every icon is kept offline", () => {
  for (const id of Object.keys(ICONS)) assert.ok(assets.has(`vendor/fluent-emoji-flat/${id}.svg`), id);
});

test("the page's links resolve", () => {
  const html = readFileSync(join(ROOT, "index.html"), "utf8");
  for (const [, url] of html.matchAll(/(?:href|src)="([^"#:]+)"/g)) {
    assert.ok(existsSync(join(ROOT, url)), url);
    assert.ok(assets.has(url), `${url} isn't in sw.js`);
  }
  const manifest = JSON.parse(readFileSync(join(ROOT, "manifest.webmanifest"), "utf8"));
  for (const icon of manifest.icons) assert.ok(assets.has(icon.src), icon.src);
});

// width and height from a JPEG's start-of-frame marker
function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc2) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
    i += 2 + len;
  }
  return [0, 0];
}

test("the photos are small, and every one is listed", () => {
  const dir = join(ROOT, "photos");
  const { photos } = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  let total = 0;
  const listed = new Set();
  for (const p of photos) {
    for (const [key, max, side] of [["src", 800 * 1024, 1600], ["thumb", 60 * 1024, 320]]) {
      const file = join(dir, p[key].split("?")[0]);
      listed.add(rel(file));
      assert.ok(existsSync(file), p[key]);
      const buf = readFileSync(file);
      total += buf.length;
      assert.ok(buf.length <= max, `${p[key]} is ${Math.round(buf.length / 1024)} KB`);
      const [w, h] = jpegSize(buf);
      assert.ok(Math.max(w, h) <= side && w > 0, `${p[key]} is ${w}x${h}`);
    }
  }
  assert.ok(total <= 10 * 1024 * 1024, `photos total ${(total / 1048576).toFixed(1)} MB`);
  const onDisk = [...readdirSync(dir), ...readdirSync(join(dir, "thumbs")).map((f) => "thumbs/" + f)]
    .filter((f) => !statSync(join(dir, f)).isDirectory() && f !== "manifest.json")
    .map((f) => "photos/" + f);
  for (const f of onDisk) assert.ok(listed.has(f), `${f} isn't in photos/manifest.json`);
});
