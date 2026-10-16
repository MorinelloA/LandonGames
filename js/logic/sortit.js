// Sort It's vocabulary: find things by class ("Find the animal"), by
// function ("Which one cuts?") and by feature ("Which one is cold?").
// IEP speech goal: a field of 3, with the prompt spoken aloud. Exactly one
// choice is ever right: a wrong choice must never also answer the prompt,
// because picking it earns the freeze.
import { pick, pickN } from "../core/rng.js";

// Items are icon names (js/art/icons.js). `maybe` lists only ever say what
// must not be offered, so they needn't have pictures.

// ---- class: "Find the ___" — the other classes supply the wrong choices ----
export const CLASSES = {
  animal: ["dog", "cat", "cow", "pig", "lion", "frog", "elephant", "rabbit", "duck", "turtle"],
  food: ["apple", "pizza", "banana", "cookie", "carrot", "bread", "cheese", "grape", "corn", "strawberry"],
  clothes: ["shirt", "jeans", "socks", "sneaker", "cap", "gloves", "scarf", "dress"],
  "body part": ["nose", "ear", "eyes", "foot", "hand", "tooth", "arm", "lips"],
  vehicle: ["car", "bus", "train", "airplane", "bicycle", "helicopter", "boat", "fire_engine"],
};

// ---- function: "Which one do you use to ___?" ----
// `maybe` items answer the question too (you ride in a car), so they're
// never offered as the wrong choice
export const FUNCTIONS = [
  { prompt: "Which one cuts?", say: "Which one do you use to cut?", correct: ["scissors"], maybe: ["knife"] },
  { prompt: "Which one do you drink from?", say: "Which one do you drink from?", correct: ["cup", "milk", "juice"], maybe: ["baby_bottle", "soda_cup"] },
  { prompt: "Which one do you sleep in?", say: "Which one do you sleep in?", correct: ["bed"], maybe: ["couch", "tent"] },
  { prompt: "Which one do you write with?", say: "Which one do you write with?", correct: ["pencil", "crayon"], maybe: ["pen"] },
  { prompt: "Which one do you eat with?", say: "Which one do you eat with?", correct: ["fork_knife", "spoon"], maybe: ["chopsticks"] },
  { prompt: "Which one do you ride?", say: "Which one do you ride?", correct: ["bicycle", "scooter"], maybe: ["car", "bus", "train", "airplane", "boat", "helicopter", "fire_engine", "skateboard", "horse"] },
  { prompt: "Which one tells time?", say: "Which one tells the time?", correct: ["alarm_clock", "watch"], maybe: ["phone"] },
  { prompt: "Which one do you brush teeth with?", say: "Which one do you brush your teeth with?", correct: ["toothbrush"], maybe: [] },
  { prompt: "Which one do you wear on your feet?", say: "Which one do you wear on your feet?", correct: ["sneaker", "socks"], maybe: ["boot", "flip_flops"] },
  { prompt: "Which one opens a door?", say: "Which one opens a door?", correct: ["key"], maybe: [] },
  { prompt: "Which one takes pictures?", say: "Which one takes pictures?", correct: ["camera"], maybe: ["phone"] },
  { prompt: "Which one do you sweep with?", say: "Which one do you sweep with?", correct: ["broom"], maybe: [] },
];
// things none of the questions above is about
export const FUNCTION_DISTRACTORS = ["ball", "balloon", "teddy", "flower", "bell", "books", "hat", "kite", "drum", "sunglasses", "puzzle", "tree"];

// ---- feature: "Which one is ___?" ----
// The wrong choices come only from the opposite feature, so they can never
// also be right (a snail is little too). "dry" is only ever a wrong choice.
export const FEATURES = [
  { name: "cold", items: ["ice", "snowflake", "snowman", "ice_cream"], opposite: "hot" },
  { name: "hot", items: ["fire", "sun", "cup", "soup"], opposite: "cold" },
  { name: "fast", items: ["rocket", "race_car", "lightning", "leopard"], opposite: "slow" },
  { name: "slow", items: ["snail", "turtle", "sloth"], opposite: "fast" },
  { name: "big", items: ["elephant", "whale", "mountain", "dinosaur"], opposite: "little" },
  { name: "little", items: ["ant", "mouse", "ladybug", "shrimp"], opposite: "big" },
  { name: "wet", items: ["droplet", "rain_cloud", "wave", "bathtub"], opposite: "dry" },
  { name: "dry", items: ["cactus", "cookie", "teddy", "brick"], opposite: "wet", ask: false },
];

// For "big" and "little" the pictures are drawn at their real relative
// size, so the question can be seen as well as known.
export function sizeOf(item) {
  if (FEATURES.find((f) => f.name === "big").items.includes(item)) return "big";
  if (FEATURES.find((f) => f.name === "little").items.includes(item)) return "little";
  return "normal";
}

export const MODES = ["class", "function", "feature"];
export const STAR_EVERY = 4; // a star for every 4 found

// One round of the given mode. `answers` is everything that would be a
// right answer to the prompt; exactly one of `choices` is in it.
export function makeRound(mode, rand = Math.random) {
  if (mode === "class") {
    const names = Object.keys(CLASSES);
    const name = pick(names, rand);
    const correct = pick(CLASSES[name], rand);
    const others = pickN(names.filter((n) => n !== name), 2, [], rand);
    return {
      mode,
      prompt: "Find the " + name + "!",
      say: "Find the " + name,
      bin: "toybox",
      correct,
      answers: CLASSES[name],
      choices: [correct, ...others.map((n) => pick(CLASSES[n], rand))],
    };
  }
  if (mode === "function") {
    const f = pick(FUNCTIONS, rand);
    const correct = pick(f.correct, rand);
    const answers = [...f.correct, ...f.maybe];
    return {
      mode,
      prompt: f.prompt,
      say: f.say,
      bin: "toolbox",
      correct,
      answers,
      choices: [correct, ...pickN(FUNCTION_DISTRACTORS, 2, answers, rand)],
    };
  }
  const f = pick(FEATURES.filter((x) => x.ask !== false), rand);
  const correct = pick(f.items, rand);
  const opposite = FEATURES.find((x) => x.name === f.opposite);
  return {
    mode,
    prompt: "Which one is " + f.name + "?",
    say: "Which one is " + f.name + "?",
    bin: "basket",
    sized: f.name === "big" || f.name === "little",
    correct,
    answers: f.items,
    choices: [correct, ...pickN(opposite.items, 2, [], rand)],
  };
}
