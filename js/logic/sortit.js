// Sort It's vocabulary: find things by class ("Find the animal"), by
// function ("Which one cuts?") and by feature ("Which one is cold?").
// IEP speech goal: a field of 3, with the prompt spoken aloud. Exactly one
// choice is ever right: a wrong choice must never also answer the prompt,
// because picking it earns the freeze.
import { pick, pickN } from "../core/rng.js";

// ---- class: "Find the ___" — the other classes supply the wrong choices ----
export const CLASSES = {
  animal: ["🐶", "🐱", "🐮", "🐷", "🦁", "🐸", "🐘", "🐰", "🦆", "🐢"],
  food: ["🍎", "🍕", "🍌", "🍪", "🥕", "🍞", "🧀", "🍇", "🌽", "🍓"],
  clothes: ["👕", "👖", "🧦", "👟", "🧢", "🧤", "🧣", "👗"],
  "body part": ["👃", "👂", "👀", "🦶", "🖐️", "🦷", "💪", "👄"],
  vehicle: ["🚗", "🚌", "🚂", "✈️", "🚲", "🚁", "⛵", "🚒"],
};

// ---- function: "Which one do you use to ___?" ----
// `maybe` items answer the question too (you ride in a car), so they're
// never offered as the wrong choice
export const FUNCTIONS = [
  { prompt: "Which one cuts?", say: "Which one do you use to cut?", correct: ["✂️"], maybe: ["🔪"] },
  { prompt: "Which one do you drink from?", say: "Which one do you drink from?", correct: ["☕", "🥛", "🧃"], maybe: ["🍼", "🥤"] },
  { prompt: "Which one do you sleep in?", say: "Which one do you sleep in?", correct: ["🛏️"], maybe: ["🛋️", "⛺"] },
  { prompt: "Which one do you write with?", say: "Which one do you write with?", correct: ["✏️", "🖍️"], maybe: ["🖊️"] },
  { prompt: "Which one do you eat with?", say: "Which one do you eat with?", correct: ["🍴", "🥄"], maybe: ["🥢"] },
  { prompt: "Which one do you ride?", say: "Which one do you ride?", correct: ["🚲", "🛴"], maybe: ["🚗", "🚌", "🚂", "✈️", "⛵", "🚁", "🚒", "🛹", "🐴"] },
  { prompt: "Which one tells time?", say: "Which one tells the time?", correct: ["⏰", "⌚"], maybe: ["📱"] },
  { prompt: "Which one do you brush teeth with?", say: "Which one do you brush your teeth with?", correct: ["🪥"], maybe: [] },
  { prompt: "Which one do you wear on your feet?", say: "Which one do you wear on your feet?", correct: ["👟", "🧦"], maybe: ["👢", "🩴"] },
  { prompt: "Which one opens a door?", say: "Which one opens a door?", correct: ["🔑"], maybe: [] },
  { prompt: "Which one takes pictures?", say: "Which one takes pictures?", correct: ["📷"], maybe: ["📱"] },
  { prompt: "Which one do you sweep with?", say: "Which one do you sweep with?", correct: ["🧹"], maybe: [] },
];
// things none of the questions above is about
export const FUNCTION_DISTRACTORS = ["⚽", "🎈", "🧸", "🌸", "🔔", "📚", "🎩", "🪁", "🥁", "🕶️", "🧩", "🌳"];

// ---- feature: "Which one is ___?" ----
// The wrong choices come only from the opposite feature, so they can never
// also be right (a snail is little too). "dry" is only ever a wrong choice.
export const FEATURES = [
  { name: "cold", items: ["🧊", "❄️", "⛄", "🍦"], opposite: "hot" },
  { name: "hot", items: ["🔥", "☀️", "☕", "🍲"], opposite: "cold" },
  { name: "fast", items: ["🚀", "🏎️", "⚡", "🐆"], opposite: "slow" },
  { name: "slow", items: ["🐌", "🐢", "🦥"], opposite: "fast" },
  { name: "big", items: ["🐘", "🐳", "🏔️", "🦕"], opposite: "little" },
  { name: "little", items: ["🐜", "🐭", "🐞", "🦐"], opposite: "big" },
  { name: "wet", items: ["💧", "🌧️", "🌊", "🛁"], opposite: "dry" },
  { name: "dry", items: ["🌵", "🍪", "🧸", "🧱"], opposite: "wet", ask: false },
];

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
      bin: "🗂️",
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
      bin: "🧰",
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
    bin: "🧺",
    correct,
    answers: f.items,
    choices: [correct, ...pickN(opposite.items, 2, [], rand)],
  };
}
