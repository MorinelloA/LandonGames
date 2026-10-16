// Copies the vocabulary pictures listed in js/art/icons.js out of a local
// checkout of Microsoft's Fluent Emoji (Flat style, MIT licence) into
// vendor/fluent-emoji-flat/, checking that each one is a plain drawing.
//
//   node tools/vendor-icons.mjs <fluentui-emoji checkout>   copy the pictures
//   node tools/vendor-icons.mjs --check                     check vendor/ matches icons.js
//
// A sparse checkout of just the Flat pictures is enough (about 11 MB):
//
//   git clone --filter=blob:none --no-checkout --depth 1 https://github.com/microsoft/fluentui-emoji.git
//   cd fluentui-emoji
//   git sparse-checkout init --no-cone
//   (put these four lines in .git/info/sparse-checkout)
//     /LICENSE
//     /assets/*/metadata.json
//     /assets/*/Flat/*
//     /assets/*/Default/Flat/*
//   git checkout
//
// Pictures with skin tones come from their Default folder.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { ICONS } from "../js/art/icons.js";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const OUT = join(ROOT, "vendor", "fluent-emoji-flat");
const SIZE = 256; // intrinsic size, so Safari never rasterizes from 32 px

const bare = (s) => s.replace(/️/g, "");

// Anything that could reach outside the picture, or run.
const FORBIDDEN = [/<script/i, /<foreignObject/i, /<image/i, /\bon\w+=/i, /href\s*=\s*["'](?!#)/i, /url\(\s*['"]?(?!#)/i, /@import/i];

function clean(svg, id) {
  for (const bad of FORBIDDEN) {
    if (bad.test(svg)) throw new Error(`${id}: refuses ${bad}`);
  }
  if (!/^<svg[^>]*viewBox="[^"]+"/.test(svg.trim())) throw new Error(`${id}: no viewBox on the root`);
  return svg.trim()
    .replace(/^<svg([^>]*?)\swidth="[^"]*"/, `<svg$1 width="${SIZE}"`)
    .replace(/^<svg([^>]*?)\sheight="[^"]*"/, `<svg$1 height="${SIZE}"`) + "\n";
}

async function check() {
  const want = Object.keys(ICONS).map((id) => id + ".svg").sort();
  const have = existsSync(OUT) ? (await readdir(OUT)).filter((f) => f.endsWith(".svg")).sort() : [];
  const missing = want.filter((f) => !have.includes(f));
  const extra = have.filter((f) => !want.includes(f));
  for (const f of missing) console.log("missing " + f);
  for (const f of extra) console.log("not in icons.js " + f);
  if (missing.length || extra.length) return 1;
  console.log(`${want.length} icons, all present`);
  return 0;
}

async function vendor(src) {
  const assets = join(src, "assets");
  const byGlyph = new Map();
  for (const name of await readdir(assets)) {
    const meta = join(assets, name, "metadata.json");
    if (!existsSync(meta)) continue;
    const { glyph } = JSON.parse(await readFile(meta, "utf8"));
    if (glyph) byGlyph.set(bare(glyph), name);
  }

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  const rows = [];
  for (const [id, emoji] of Object.entries(ICONS)) {
    const name = byGlyph.get(bare(emoji));
    if (!name) throw new Error(`${id}: no Fluent picture for ${emoji}`);
    const dir = [join(assets, name, "Flat"), join(assets, name, "Default", "Flat")].find(existsSync);
    if (!dir) throw new Error(`${id}: ${name} has no Flat picture`);
    const file = (await readdir(dir)).find((f) => f.endsWith(".svg"));
    const svg = clean(await readFile(join(dir, file), "utf8"), id);
    await writeFile(join(OUT, id + ".svg"), svg);
    rows.push(`| ${id} | ${name} | ${file} |`);
  }

  const license = await readFile(join(src, "LICENSE"), "utf8");
  await writeFile(join(OUT, "LICENSE"), license.split("\n").map((l) => l.replace(/^ {4}/, "")).join("\n").trim() + "\n");
  let commit = "unknown";
  try {
    commit = execFileSync("git", ["-C", src, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch (_) {}
  await writeFile(join(OUT, "SOURCE.md"), [
    "# Fluent Emoji (Flat)",
    "",
    "Copied by `tools/vendor-icons.mjs` from https://github.com/microsoft/fluentui-emoji",
    `at commit ${commit}. MIT licence (see LICENSE). Each file's root size is set to`,
    `${SIZE} px; nothing else is changed.`,
    "",
    "| File | Fluent picture | Original file |",
    "|---|---|---|",
    ...rows,
    "",
  ].join("\n"));
  console.log(`Copied ${rows.length} icons from ${commit.slice(0, 7)}`);
  return 0;
}

const arg = process.argv[2];
if (arg === "--check") process.exitCode = await check();
else if (arg) process.exitCode = await vendor(arg);
else {
  console.log("Usage: node tools/vendor-icons.mjs <fluentui-emoji checkout> | --check");
  process.exitCode = 1;
}
