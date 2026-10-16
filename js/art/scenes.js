// The Feelings stories as pictures. Each scene shows what happened — a
// dropped ice cream, a knocked-down tower — with the character's face
// neutral, so the story carries the feeling. Once Landon picks the right
// face, the scene is drawn again with the character wearing it.
//
// Scenes use stage units (1133 x 640). The story happens on the left; the
// right side (from x = 760) is under the panel of faces to choose from.
import { person } from "./people.js";
import { backdropSvg, PLACES } from "./backdrops.js";
import { WORLD as W } from "./theme.js";
import { g, rect } from "./svg.js";
import {
  icon, table, iceCreamDropped, blocksFallen, book, emptyPlate, tvOff, lampOff,
  barkLines, stuffing, balloonAway,
} from "./props.js";

const SCALE = 1.15; // story characters are a little bigger than life-size art
const FEET = 592;   // where feet meet the floor or grass

const lead = (who, x, pose = "stand", look = [0, 0]) => ({ who, x, pose, look, lead: true });
// drawn props are made around (0, 0); this places and sizes them
const at = (x, y, s, art) => g({ transform: `translate(${x} ${y}) scale(${s})` }, art);
const extra = (who, x, pose = "stand", look = [0, 0], scale = 1) => ({ who, x, pose, look, scale });
// where a figure's hand ends up in the scene
const hand = (x, [hx, hy]) => [x + hx * SCALE, FEET + hy * SCALE];

// back: drawn behind the people; front: in front of them; dim: lights out
export const SCENES = {
  "ice-cream": { place: "park", cast: [lead("boy", 270, "stand", [3, 4])], front: () => at(450, 606, 1.6, iceCreamDropped(0, 0)) },
  birthday: {
    place: "party",
    cast: [lead("girl", 330, "stand", [0, 2])],
    back: () => icon("balloon", 560, 230, 110) + icon("balloon", 640, 290, 92, { rotate: 10 }) + icon("balloon", 120, 260, 96, { rotate: -8 }),
    front: () => table(330, 646, 330) + icon("cake", 330, 456, 140),
  },
  "new-toy": { place: "playroom", cast: [lead("boy", 330, "hold", [0, 3])], front: () => icon("gift", 330, 452, 128) },
  teddy: { place: "bedroom", cast: [lead("girl", 300, "hold", [0, 3])], front: () => icon("teddy", 300, 446, 132) + stuffing(330, 432) },
  puppy: {
    place: "park",
    cast: [lead("boy", 250, "reachDown", [3, 3])],
    front: () => icon("dog", 430, 540, 200, { flip: true }) + icon("ball", 590, 596, 66),
  },
  rain: {
    place: "rainy",
    cast: [lead("girl", 200, "holdRight", [5, -1])],
    front: () => icon("ball", ...hand(200, [74, -126]), 64),
  },
  pizza: { place: "kitchen", cast: [lead("boy", 280, "sitHold", [0, 3])], front: () => icon("pizza", 280, 480, 92, { rotate: -20 }) },
  balloon: {
    place: "park",
    cast: [lead("girl", 250, "reachUp", [3, -4])],
    back: () => balloonAway(500, 120, 110),
  },
  swimming: { place: "pool", cast: [lead("boy", 190, "stand", [4, 1])], front: () => icon("ball", 560, 548, 66) },
  cookies: { place: "kitchen", cast: [lead("girl", 220, "stand", [5, -2])], back: () => at(560, 262, 1.7, emptyPlate(0, 0)) },
  train: { place: "station", cast: [lead("boy", 230, "stand", [4, -1])], back: () => icon("train", 560, 392, 240) },
  knee: { place: "park", cast: [lead("girl", 320, "sitKnee", [2, 4])], front: () => icon("bandage", 360, 560, 44, { rotate: 24 }) },
  tower: { place: "playroom", cast: [lead("boy", 230, "stand", [4, 4])], front: () => at(480, 606, 1.25, blocksFallen(0, 0)) },
  candy: {
    place: "playroom",
    cast: [lead("girl", 210, "stand", [5, 0]), extra("boy", 480, "holdRight", [3, 0])],
    front: () => icon("lollipop", ...hand(480, [74, -126]), 74, { rotate: 12 }),
  },
  "clean-up": {
    place: "playroom",
    cast: [lead("boy", 240, "reachDown", [4, 4])],
    front: () => icon("car", 400, 552, 80) + icon("ball", 420, 604, 66) + icon("teddy", 500, 574, 88) + icon("basket", 640, 560, 130),
  },
  scribble: {
    place: "living",
    cast: [lead("girl", 220, "stand", [4, 4])],
    front: () => book(450, 610, { scribbled: true, w: 230 }) + icon("crayon", 600, 612, 60, { rotate: 30 }),
  },
  "dog-bark": {
    place: "bark",
    cast: [lead("boy", 210, "stand", [5, 0])],
    front: () => icon("dog", 540, 500, 290) + barkLines(372, 440, -1),
  },
  thunder: { place: "storm", cast: [lead("girl", 210, "stand", [5, -3])] },
  dark: { place: "dark", cast: [lead("boy", 300, "stand", [0, 0])], front: () => lampOff(520, 592), dim: 0.32 },
  spider: { place: "playroom", cast: [lead("girl", 250, "stand", [4, 5])], front: () => icon("spider", 480, 574, 150) },
  race: { place: "track", cast: [lead("boy", 300, "hold", [0, 2])], front: () => icon("trophy", 300, 446, 108) },
  grandma: { place: "doorway", cast: [lead("girl", 300, "stand", [5, 0]), extra("grandma", 610, "handsOut", [-4, 0], 1.14)] },
  "game-off": {
    place: "living",
    cast: [lead("boy", 200, "sitHold", [5, -2])],
    front: () => icon("video_game", 200, 486, 74) + tvOff(500, 604),
  },
  playground: { place: "playground", cast: [lead("girl", 250, "stand", [4, 0])] },
};

function figure({ who, x, pose, look, scale = 1 }, mood) {
  return g({ transform: `translate(${x} ${FEET}) scale(${SCALE * scale})` }, person({ who, mood, pose, look }));
}

// The whole scene as one <svg>, with the lead character wearing `mood`.
export function storyScene(id, mood = "neutral") {
  const s = SCENES[id];
  if (!s) throw new Error("No scene for " + id);
  const body = (s.back ? s.back() : "") +
    s.cast.map((c) => figure(c, c.lead ? mood : "neutral")).join("") +
    (s.front ? s.front() : "") +
    (s.dim ? rect(-400, -300, 2000, 1300, { fill: W.nightDeep, opacity: s.dim }) : "");
  return backdropSvg(() => PLACES[s.place]() + body);
}
