// The cat who guides every game: an orange tabby, always friendly. It waves
// on the menu, cheers right answers and points during hints. It never
// reacts to a mistake — mistakes stay quiet.
//
// Drawn sitting, facing us, with its feet on the ground at (0, 0); about
// 230 units tall.
import { CAT } from "./theme.js";
import { g, path, circle, ellipse, svg } from "./svg.js";

const limb = (x1, y1, x2, y2, w = 22, color = CAT.fur) =>
  path(`M${x1} ${y1}L${x2} ${y2}`, { stroke: color, strokeWidth: w, strokeLinecap: "round", fill: "none" });

function eyes(mood) {
  if (mood === "joy") {
    // happy closed eyes: little arches
    const arch = (x) => path(`M${x - 9} -150Q${x} -162 ${x + 9} -150`, { stroke: CAT.eye, strokeWidth: 5, strokeLinecap: "round", fill: "none" });
    return arch(-24) + arch(24);
  }
  const look = mood === "curious" ? 4 : 0;
  const eye = (x) =>
    ellipse(x + look, -152, 7, 9, { fill: CAT.eye }) +
    circle(x + look + 2.5, -155.5, 2.6, { fill: "#FFFFFF" });
  return eye(-24) + eye(24);
}

function mouth(mood) {
  if (mood === "joy") {
    return path("M-13 -129Q0 -112 13 -129Z", { fill: "#B5523F" }) +
      path("M-6 -121Q0 -117 6 -121", { stroke: "#F28E8E", strokeWidth: 4, strokeLinecap: "round", fill: "none" });
  }
  return path("M-10 -128Q-5 -121 0 -128Q5 -121 10 -128", { stroke: CAT.eye, strokeWidth: 3, strokeLinecap: "round", fill: "none" });
}

function head(mood) {
  const ear = (s) => g({},
    path(`M${s * 58} -170L${s * 50} -228Q${s * 48} -236 ${s * 40} -230L${s * 12} -200Z`, { fill: CAT.fur }),
    path(`M${s * 47} -180L${s * 44} -214L${s * 24} -197Z`, { fill: CAT.ear }),
  );
  const stripe = (x1, y1, x2, y2) => path(`M${x1} ${y1}L${x2} ${y2}`, { stroke: CAT.stripe, strokeWidth: 6, strokeLinecap: "round" });
  const whisker = (s, dy) => path(`M${s * 34} ${-130 + dy}L${s * 62} ${-136 + dy * 2}`, { stroke: CAT.furDeep, strokeWidth: 2.5, strokeLinecap: "round" });
  return g({},
    ear(-1), ear(1),
    ellipse(0, -150, 66, 57, { fill: CAT.fur }),
    stripe(-14, -205, -9, -188), stripe(0, -207, 0, -189), stripe(14, -205, 9, -188),
    stripe(-64, -158, -50, -156), stripe(64, -158, 50, -156),
    ellipse(0, -128, 32, 21, { fill: CAT.cream }),
    ellipse(-44, -132, 10, 6, { fill: CAT.ear, opacity: 0.7 }),
    ellipse(44, -132, 10, 6, { fill: CAT.ear, opacity: 0.7 }),
    eyes(mood),
    path("M-6 -139Q0 -133 6 -139Q0 -143 -6 -139Z", { fill: CAT.nose }),
    mouth(mood),
    whisker(-1, 0), whisker(-1, 8), whisker(1, 0), whisker(1, 8),
  );
}

// pose: sit | wave | cheer | point | peek;  mood: happy | joy | curious
export function cat({ pose = "sit", mood = "" } = {}) {
  mood = mood || (pose === "cheer" ? "joy" : "happy");
  if (pose === "peek") {
    // just the head and two paws, for peeking over an edge at y = -100
    return g({}, head(mood),
      ellipse(-34, -98, 17, 11, { fill: CAT.cream }), ellipse(34, -98, 17, 11, { fill: CAT.cream }));
  }
  const tail = path("M44 -18Q96 -20 92 -70Q90 -96 72 -104", { stroke: CAT.fur, strokeWidth: 15, strokeLinecap: "round", fill: "none" }) +
    path("M84 -92Q78 -101 72 -104", { stroke: CAT.stripe, strokeWidth: 15, strokeLinecap: "round", fill: "none" });
  const body = g({},
    ellipse(0, -60, 56, 60, { fill: CAT.fur }),
    path("M-48 -78Q-40 -72 -28 -76", { stroke: CAT.stripe, strokeWidth: 6, strokeLinecap: "round", fill: "none" }),
    path("M48 -78Q40 -72 28 -76", { stroke: CAT.stripe, strokeWidth: 6, strokeLinecap: "round", fill: "none" }),
    ellipse(0, -50, 33, 40, { fill: CAT.cream }),
    ellipse(-36, -10, 26, 13, { fill: CAT.fur }),
    ellipse(36, -10, 26, 13, { fill: CAT.fur }),
  );
  const paw = (x, y) => ellipse(x, y, 13, 11, { fill: CAT.cream });
  let arms;
  if (pose === "wave") {
    arms = limb(-26, -80, -22, -14) + paw(-20, -10) + limb(34, -86, 66, -150) + paw(68, -156) +
      path("M84 -176q8 6 6 16M92 -160q8 2 10 10", { stroke: CAT.furDeep, strokeWidth: 3.5, strokeLinecap: "round", fill: "none" });
  } else if (pose === "cheer") {
    arms = limb(-34, -86, -70, -150) + paw(-72, -156) + limb(34, -86, 70, -150) + paw(72, -156);
  } else if (pose === "point") {
    arms = limb(-26, -80, -22, -14) + paw(-20, -10) + limb(34, -84, 92, -96) + paw(98, -97);
  } else {
    arms = limb(-22, -80, -18, -14) + paw(-18, -10) + limb(22, -80, 18, -14) + paw(18, -10);
  }
  return g({}, tail, body, arms, head(mood));
}

// the cat as its own <svg>, `size` units tall; `flip` turns it to face left
export function catSvg({ pose = "sit", mood = "", size = 120, label = "", flip = false } = {}) {
  const peek = pose === "peek";
  const box = peek ? "-80 -240 160 150" : "-115 -240 230 248";
  const [, , bw, bh] = box.split(" ").map(Number);
  const art = flip ? g({ transform: "scale(-1 1)" }, cat({ pose, mood })) : cat({ pose, mood });
  return svg(Math.round((size * bw) / bh), size, art, { viewBox: box, label, cls: "cat-art" });
}
