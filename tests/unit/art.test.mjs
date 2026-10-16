// Every piece of art is a self-contained SVG string: well formed, nothing
// that runs or reaches outside except the vendored icons, and no id used
// twice. Run against every pose, mood, place, scene and card.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../helpers.mjs";
import { ICONS, iconUrl } from "../../js/art/icons.js";
import { catSvg } from "../../js/art/mascot.js";
import { MOODS, POSES, faceSvg, personSvg } from "../../js/art/people.js";
import { PLACES, backdropSvg } from "../../js/art/backdrops.js";
import { SCENES, storyScene } from "../../js/art/scenes.js";
import { CARD_GAMES, cardSvg } from "../../js/art/cards.js";
import { spriteSvg } from "../../js/art/ui.js";
import { STORIES } from "../../js/logic/feelings.js";

const ICON_BASE = iconUrl("dog").replace(/dog\.svg$/, "");

function checkSvg(name, s) {
  assert.ok(s.startsWith("<svg"), `${name} starts with <svg`);
  assert.ok(!/<script|<foreignObject|\son\w+=|@import/i.test(s), `${name} has something that runs`);
  // tags balance
  const stack = [];
  for (const m of s.matchAll(/<(\/?)([a-zA-Z]+)[^>]*?(\/?)>/g)) {
    const [, close, tag, self] = m;
    if (self) continue;
    if (close) assert.equal(stack.pop(), tag, `${name}: </${tag}> closes the wrong tag`);
    else stack.push(tag);
  }
  assert.deepEqual(stack, [], `${name}: unclosed ${stack.join(", ")}`);
  // links go only to the vendored icons or to ids inside the same picture
  for (const [, href] of s.matchAll(/href="([^"]*)"/g)) {
    assert.ok(href.startsWith("#") || href.startsWith(ICON_BASE), `${name} links to ${href}`);
  }
  const ids = [...s.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, `${name} repeats an id`);
  for (const [, ref] of s.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.includes(ref), `${name} uses #${ref} without defining it`);
}

test("every vendored icon is on disk", () => {
  for (const id of Object.keys(ICONS)) {
    assert.ok(existsSync(join(ROOT, "vendor", "fluent-emoji-flat", id + ".svg")), `${id}.svg`);
  }
});

test("the cat, in every pose", () => {
  for (const pose of ["sit", "wave", "cheer", "point", "peek"]) {
    checkSvg(`cat ${pose}`, catSvg({ pose }));
    checkSvg(`cat ${pose} flipped`, catSvg({ pose, flip: true }));
  }
});

test("every face and pose", () => {
  for (const who of ["boy", "girl", "grandma"]) {
    for (const mood of MOODS) checkSvg(`${who} ${mood}`, faceSvg({ who, mood }));
    for (const pose of Object.keys(POSES)) checkSvg(`${who} ${pose}`, personSvg({ who, pose }));
  }
});

test("each feeling looks different from the others", () => {
  for (const who of ["boy", "girl", "grandma"]) {
    const faces = MOODS.map((mood) => faceSvg({ who, mood }));
    assert.equal(new Set(faces).size, MOODS.length, who);
  }
});

test("every place", () => {
  for (const name of Object.keys(PLACES)) checkSvg(`place ${name}`, backdropSvg(name));
});

test("every Feelings story has its scene, with one main character drawn neutral", () => {
  const neutralMouth = "M-9 -213Q0 -211 9 -213";
  const count = (s) => s.split(neutralMouth).length - 1;
  assert.deepEqual(Object.keys(SCENES).sort(), STORIES.map((s) => s.id).sort());
  for (const story of STORIES) {
    const scene = SCENES[story.id];
    assert.equal(scene.cast.filter((c) => c.lead).length, 1, story.id);
    assert.equal(scene.cast.find((c) => c.lead).who, story.who, `${story.id}: the main character is the ${story.who}`);
    const plain = storyScene(story.id);
    checkSvg(`scene ${story.id}`, plain);
    assert.equal(count(plain), scene.cast.length, `${story.id}: everyone starts neutral`);
    const answered = storyScene(story.id, story.answer);
    assert.equal(count(answered), scene.cast.length - 1, `${story.id}: only the main character changes`);
  }
});

test("every menu card and the interface icons", () => {
  for (const game of CARD_GAMES) checkSvg(`card ${game}`, cardSvg(game));
  assert.equal(CARD_GAMES.length, 12);
  const sprite = spriteSvg();
  assert.ok(sprite.includes('id="i-home"') && sprite.includes('id="i-help"'));
});
