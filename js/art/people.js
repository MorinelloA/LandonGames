// The story characters: a boy, a girl and a grandma. In story scenes their
// faces are neutral, so the story carries the feeling; the choice faces
// (and the character's face once the right one is picked) show happy, sad,
// angry or scared.
//
// Drawn facing us with feet at (0, 0), about 300 units tall. A pose is
// where the hands go; arms run straight from the shoulders to the hands.
import { PEOPLE } from "./theme.js";
import { g, path, circle, ellipse, svg } from "./svg.js";

export const MOODS = ["neutral", "happy", "sad", "angry", "scared"];

// hand positions for a standing figure; `sit` lowers the body 70 units
export const POSES = {
  stand: { l: [-56, -102], r: [56, -102] },
  hold: { l: [-20, -136], r: [20, -136] },         // something held in front
  holdUp: { l: [-26, -186], r: [26, -186] },       // held up high in front
  holdRight: { l: [-56, -102], r: [74, -126] },    // right hand out to the side
  reachUp: { l: [-56, -102], r: [58, -272] },
  reachDown: { l: [-56, -102], r: [70, -76] },
  point: { l: [-56, -102], r: [98, -168] },
  handsOut: { l: [-80, -122], r: [80, -122] },
  sit: { l: [-46, -70], r: [46, -70], sit: true },
  sitHold: { l: [-20, -96], r: [20, -96], sit: true },
  sitKnee: { l: [-30, -40], r: [-6, -40], sit: true },
};

const SIT_DROP = 70;

const limb = (x1, y1, x2, y2, w, color) =>
  path(`M${x1} ${y1}L${x2} ${y2}`, { stroke: color, strokeWidth: w, strokeLinecap: "round", fill: "none" });

/* ---- faces ---- */

function eyes(mood, look, c) {
  const [lx, ly] = look;
  if (mood === "happy") {
    const arc = (x) => path(`M${x - 8} -234Q${x} -244 ${x + 8} -234`, { stroke: c, strokeWidth: 4.5, strokeLinecap: "round", fill: "none" });
    return arc(-17) + arc(17);
  }
  if (mood === "scared") {
    const eye = (x) => circle(x, -236, 9.5, { fill: "#FFFFFF" }) + circle(x + lx, -235 + ly, 4.5, { fill: c });
    return eye(-17) + eye(17);
  }
  const eye = (x) => ellipse(x + lx, -236 + ly, 5.2, 6.2, { fill: c }) + circle(x + lx + 1.8, -238.5 + ly, 1.6, { fill: "#FFFFFF" });
  return eye(-17) + eye(17);
}

function brows(mood, color) {
  const b = (d) => path(d, { stroke: color, strokeWidth: 4.5, strokeLinecap: "round", fill: "none" });
  switch (mood) {
    case "sad": return b("M-27 -251L-10 -257") + b("M27 -251L10 -257");      // inner ends up
    case "angry": return b("M-27 -259L-9 -250") + b("M27 -259L9 -250");      // inner ends down
    case "scared": return b("M-26 -258Q-18 -265 -9 -263") + b("M26 -258Q18 -265 9 -263");
    case "happy": return b("M-25 -255Q-17 -259 -9 -255") + b("M25 -255Q17 -259 9 -255");
    default: return b("M-25 -253Q-17 -256 -9 -253") + b("M25 -253Q17 -256 9 -253");
  }
}

function mouth(mood) {
  const m = PEOPLE.mouth;
  switch (mood) {
    case "happy":
      return path("M-17 -217Q0 -194 17 -217Z", { fill: m }) + path("M-8 -207Q0 -202 8 -207", { stroke: "#F28E8E", strokeWidth: 5, strokeLinecap: "round", fill: "none" });
    case "sad":
      return path("M-12 -207Q0 -219 12 -207", { stroke: m, strokeWidth: 4.5, strokeLinecap: "round", fill: "none" });
    case "angry":
      return path("M-13 -209Q0 -217 13 -209", { stroke: m, strokeWidth: 5, strokeLinecap: "round", fill: "none" });
    case "scared":
      return ellipse(0, -208, 7.5, 9.5, { fill: m });
    default:
      return path("M-9 -213Q0 -211 9 -213", { stroke: m, strokeWidth: 4, strokeLinecap: "round", fill: "none" });
  }
}

function extras(mood) {
  if (mood === "happy") return ellipse(-29, -219, 8, 5, { fill: PEOPLE.cheek, opacity: 0.75 }) + ellipse(29, -219, 8, 5, { fill: PEOPLE.cheek, opacity: 0.75 });
  if (mood === "sad") return path("M-21 -226Q-25 -216 -21 -211Q-17 -216 -21 -226Z", { fill: PEOPLE.tear });
  if (mood === "angry") return ellipse(-29, -220, 9, 5, { fill: "#EE7B6E", opacity: 0.55 }) + ellipse(29, -220, 9, 5, { fill: "#EE7B6E", opacity: 0.55 });
  return "";
}

/* ---- hair ---- */

function hairBack(who, c) {
  if (who === "girl") {
    return ellipse(0, -232, 57, 56, { fill: c.hair }) +
      circle(-58, -226, 20, { fill: c.hair }) + circle(58, -226, 20, { fill: c.hair });
  }
  return "";
}

function hairFront(who, c) {
  if (who === "girl") {
    return path("M-50 -238Q-52 -290 0 -290Q52 -290 50 -238Q46 -262 22 -266Q8 -254 -10 -266Q-38 -264 -50 -238Z", { fill: c.hair }) +
      circle(-44, -248, 6, { fill: "#F7CC4A" }) + circle(44, -248, 6, { fill: "#F7CC4A" });
  }
  if (who === "grandma") {
    return circle(0, -294, 19, { fill: c.hair }) +
      path("M-50 -240Q-54 -288 0 -288Q54 -288 50 -240Q44 -268 18 -270Q0 -262 -18 -270Q-44 -268 -50 -240Z", { fill: c.hair });
  }
  // boy: short hair with a little tuft
  return path("M-50 -244Q-52 -292 0 -292Q52 -292 50 -244Q40 -270 6 -270Q-30 -272 -50 -244Z", { fill: c.hair }) +
    path("M-6 -290Q4 -306 18 -298Q8 -294 6 -286Z", { fill: c.hair });
}

function glasses(who) {
  if (who !== "grandma") return "";
  const lens = (x) => circle(x, -236, 13, { fill: "none", stroke: "#7C6352", strokeWidth: 3.5 });
  return lens(-17) + lens(17) + path("M-4 -237Q0 -241 4 -237", { stroke: "#7C6352", strokeWidth: 3, fill: "none" });
}

export function head(who = "boy", mood = "neutral", look = [0, 0]) {
  const c = PEOPLE[who];
  return g({},
    hairBack(who, c),
    circle(-50, -232, 10, { fill: c.skin }), circle(50, -232, 10, { fill: c.skin }),
    ellipse(0, -236, 51, 49, { fill: c.skin }),
    hairFront(who, c),
    g({ "data-part": "face" }, brows(mood, who === "grandma" ? "#9C8E86" : c.hair),
      eyes(mood, look, PEOPLE.eyes), mouth(mood), extras(mood)),
    glasses(who),
  );
}

/* ---- the whole figure ---- */

function legs(who, c, sit) {
  if (sit) {
    return limb(-16, -34, -54, -14, 26, c.pants) + limb(16, -34, 54, -14, 26, c.pants) +
      ellipse(-64, -12, 18, 11, { fill: c.shoes }) + ellipse(64, -12, 18, 11, { fill: c.shoes });
  }
  return limb(-17, -100, -18, -16, 26, c.pants) + limb(17, -100, 18, -16, 26, c.pants) +
    ellipse(-21, -9, 20, 11, { fill: c.shoes }) + ellipse(21, -9, 20, 11, { fill: c.shoes });
}

function torso(who, c, dy) {
  const top = -190 + dy;
  if (who === "girl" || who === "grandma") {
    // a dress: a little top and a flared skirt
    const skirt = who === "grandma" ? c.pants : c.shirt;
    return path(`M-34 ${top}Q-44 ${top} -45 ${top + 14}L-48 ${top + 64}L-62 ${top + 108}Q-62 ${top + 118} -50 ${top + 118}L50 ${top + 118}Q62 ${top + 118} 62 ${top + 108}L48 ${top + 64}L45 ${top + 14}Q44 ${top} 34 ${top}Z`, { fill: skirt }) +
      path(`M-34 ${top}Q-44 ${top} -45 ${top + 14}L-47 ${top + 66}L47 ${top + 66}L45 ${top + 14}Q44 ${top} 34 ${top}Z`, { fill: c.shirt }) +
      path(`M-14 ${top}Q0 ${top + 14} 14 ${top}`, { stroke: c.shirtDeep, strokeWidth: 5, fill: "none", strokeLinecap: "round" });
  }
  return path(`M-36 ${top}Q-46 ${top} -47 ${top + 14}L-50 ${top + 86}Q-50 ${top + 98} -38 ${top + 98}L38 ${top + 98}Q50 ${top + 98} 50 ${top + 86}L47 ${top + 14}Q46 ${top} 36 ${top}Z`, { fill: c.shirt }) +
    path(`M-14 ${top}Q0 ${top + 14} 14 ${top}`, { stroke: c.shirtDeep, strokeWidth: 5, fill: "none", strokeLinecap: "round" });
}

// who: boy | girl | grandma;  mood: one of MOODS;  pose: a POSES name
// look: where the eyes point, e.g. [3, 3] for down and right
export function person({ who = "boy", mood = "neutral", pose = "stand", look = [0, 0] } = {}) {
  const c = PEOPLE[who];
  const p = POSES[pose] || POSES.stand;
  const dy = p.sit ? SIT_DROP : 0;
  const sh = -176 + dy; // shoulders
  const arm = (sx, [hx, hy]) => limb(sx, sh, hx, hy, 22, c.shirtDeep) + circle(hx, hy, 12, { fill: c.skin });
  // arms hanging down go behind the body; raised or reaching ones in front
  const behind = ([, hy]) => hy > sh + 40;
  const armL = arm(-40, p.l), armR = arm(40, p.r);
  return g({},
    ellipse(0, -4, p.sit ? 78 : 50, 9, { fill: "rgba(74,52,38,0.13)" }), // ground shadow
    legs(who, c, p.sit),
    behind(p.l) ? armL : "", behind(p.r) ? armR : "",
    torso(who, c, dy),
    g({ transform: `translate(0 ${dy})` }, head(who, mood, look)),
    behind(p.l) ? "" : armL, behind(p.r) ? "" : armR,
  );
}

// where a figure's hands are, for putting things in them
export function hands(pose = "stand") {
  const p = POSES[pose] || POSES.stand;
  return { left: p.l, right: p.r };
}

// a choice face: just the head, in a square
export function faceSvg({ who = "boy", mood = "happy", size = 120, label = "" } = {}) {
  return svg(size, size, head(who, mood), { viewBox: "-66 -306 132 132", label, cls: "face-art" });
}

export function personSvg({ who = "boy", mood = "neutral", pose = "stand", look = [0, 0], size = 300 } = {}) {
  return svg(Math.round(size * 0.8), size, person({ who, mood, pose, look }), { viewBox: "-120 -310 240 320", cls: "person-art" });
}
