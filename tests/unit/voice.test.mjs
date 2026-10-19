// The narrator: every line the games can say has a recorded clip, every clip
// is a line the games still say, the clips stay small, and nothing speaks a
// line that isn't built in js/logic/lines.js (so it can't miss its clip).
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../helpers.mjs";
import { allLines } from "../../js/logic/lines.js";
import { problems, spokenForm } from "../../tools/voice.mjs";

const dir = join(ROOT, "voice");
const manifestFile = join(dir, "manifest.json");
const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, "utf8")) : null;

test("every line the games say has its clip, and every clip is a line", () => {
  assert.ok(manifest, "no voice/manifest.json: run node tools/voice.mjs build");
  assert.deepEqual(problems(allLines(), manifest, dir), [], "run node tools/voice.mjs build");
});

test("clips are named by their hash, and stay small", () => {
  let total = 0;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".mp3"))) {
    assert.match(f, /^[0-9a-f]{12}\.mp3$/);
    const size = statSync(join(dir, f)).size;
    assert.ok(size <= 120 * 1024, `voice/${f} is ${Math.round(size / 1024)} KB`);
    total += size;
  }
  assert.ok(total <= 6 * 1024 * 1024, `voice total ${(total / 1048576).toFixed(1)} MB`);
});

test("the games speak only lines built in lines.js", () => {
  const files = [join(ROOT, "js", "core", "app.js"), ...readdirSync(join(ROOT, "js", "games")).map((f) => join(ROOT, "js", "games", f))];
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    for (const [call, args] of src.matchAll(/Sound\.(?:speak|say|after)\(([^;]*)\)/g)) {
      assert.ok(!/["'`]|\s\+\s/.test(args.replace(/\{\s*max:\s*\d+\s*\}/, "")), `${file.split(/[\\/]/).pop()}: ${call}`);
    }
  }
});

test("letters and numbers go to the voice in a form it reads right", () => {
  assert.equal(spokenForm("Trace the little letter a"), "Trace the little letter A");
  assert.equal(spokenForm("Trace the big letter H"), "Trace the big letter H");
  assert.equal(spokenForm("h! Nice tracing!"), "Aitch! Nice tracing!");
  assert.equal(spokenForm("B! Nice tracing!"), "B! Nice tracing!");
  assert.equal(spokenForm("9"), "Nine.");
  assert.equal(spokenForm("17"), "Seventeen.");
  assert.equal(spokenForm("21"), "Twenty-one.");
  assert.equal(spokenForm("30"), "Thirty.");
  assert.equal(spokenForm("plus"), "plus");
  assert.equal(spokenForm("equals what?"), "equals what?");
  assert.equal(spokenForm("3! That's right!"), "Three! That's right!");
  assert.equal(spokenForm("Trace the number 0"), "Trace the number zero");
  assert.equal(spokenForm("apple! Great job!"), "apple! Great job!");
});
