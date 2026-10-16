/* ===== Sort It!: identify vocabulary by feature, function, and class =====
   IEP speech goal: field of 3 choices, prompts spoken aloud.
   Drag the right item into the bin. Wrong choice → silence + freeze. */
App.games.sortit = (() => {
  const promptEl = document.getElementById("sort-prompt");
  const binEl = document.getElementById("sort-bin");
  const binLabelEl = document.getElementById("sort-bin-label");
  const cardsEl = document.getElementById("sort-cards");
  const hearBtn = document.getElementById("sort-hear");

  // ---- class: "Find the ___" — pools double as distractor sources ----
  const CLASSES = {
    animal: ["🐶", "🐱", "🐮", "🐷", "🦁", "🐸", "🐘", "🐰", "🦆", "🐢"],
    food: ["🍎", "🍕", "🍌", "🍪", "🥕", "🍞", "🧀", "🍇", "🌽", "🍓"],
    clothes: ["👕", "👖", "🧦", "👟", "🧢", "🧤", "🧣", "👗"],
    "body part": ["👃", "👂", "👀", "🦶", "🖐️", "🦷", "💪", "👄"],
    vehicle: ["🚗", "🚌", "🚂", "✈️", "🚲", "🚁", "⛵", "🚒"],
  };

  // ---- function: "Which one do you use to ___?" ----
  // `maybe` items answer the question too (you ride in a car), so they're
  // never offered as the wrong choice
  const FUNCTIONS = [
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
  const FUNCTION_DISTRACTORS = ["⚽", "🎈", "🧸", "🌸", "🔔", "📚", "🎩", "🪁", "🥁", "🕶️", "🧩", "🌳"];

  // ---- feature: "Which one is ___?" ----
  // The wrong choices come only from the opposite feature, so they can never
  // also be right (a snail is little too). "dry" is only ever a wrong choice.
  const FEATURES = [
    { name: "cold", items: ["🧊", "❄️", "⛄", "🍦"], opposite: "hot" },
    { name: "hot", items: ["🔥", "☀️", "☕", "🍲"], opposite: "cold" },
    { name: "fast", items: ["🚀", "🏎️", "⚡", "🐆"], opposite: "slow" },
    { name: "slow", items: ["🐌", "🐢", "🦥"], opposite: "fast" },
    { name: "big", items: ["🐘", "🐳", "🏔️", "🦕"], opposite: "little" },
    { name: "little", items: ["🐜", "🐭", "🐞", "🦐"], opposite: "big" },
    { name: "wet", items: ["💧", "🌧️", "🌊", "🛁"], opposite: "dry" },
    { name: "dry", items: ["🌵", "🍪", "🧸", "🧱"], opposite: "wet", ask: false },
  ];

  const MODES = ["class", "function", "feature"];
  let modeIdx = 0;
  let correctEmoji = "";
  let solved = 0;
  let running = false;
  let currentSay = "";

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function pickN(arr, n, exclude = []) {
    return App.shuffle(arr.filter((x) => !exclude.includes(x))).slice(0, n);
  }

  function makeRound() {
    const mode = MODES[modeIdx % MODES.length];
    modeIdx++;
    let promptText, binEmoji, choices;

    if (mode === "class") {
      const names = Object.keys(CLASSES);
      const name = pick(names);
      correctEmoji = pick(CLASSES[name]);
      const others = names.filter((n) => n !== name);
      const distractors = pickN(others, 2).map((n) => pick(CLASSES[n]));
      choices = [correctEmoji, ...distractors];
      promptText = "Find the " + name + "!";
      currentSay = "Find the " + name;
      binEmoji = "🗂️";
    } else if (mode === "function") {
      const f = pick(FUNCTIONS);
      correctEmoji = pick(f.correct);
      choices = [correctEmoji, ...pickN(FUNCTION_DISTRACTORS, 2, [...f.correct, ...f.maybe])];
      promptText = f.prompt;
      currentSay = f.say;
      binEmoji = "🧰";
    } else {
      const f = pick(FEATURES.filter((x) => x.ask !== false));
      correctEmoji = pick(f.items);
      const opposite = FEATURES.find((x) => x.name === f.opposite);
      choices = [correctEmoji, ...pickN(opposite.items, 2)];
      promptText = "Which one is " + f.name + "?";
      currentSay = "Which one is " + f.name + "?";
      binEmoji = "🧺";
    }

    promptEl.textContent = promptText;
    binEl.querySelector(".sort-bin-emoji").textContent = binEmoji;
    binLabelEl.textContent = promptText;

    cardsEl.innerHTML = "";
    App.shuffle(choices).forEach((emoji) => {
      const card = document.createElement("button");
      card.className = "sort-card";
      card.textContent = emoji;
      card.addEventListener("click", () => resolve(card, emoji));
      Drag.enable(card, {
        canDrag: () => running,
        targets: () => [binEl],
        onPickup: () => Sound.click(),
        onDrop: (t) => {
          if (!t) return false;
          resolve(card, emoji);
          return emoji === correctEmoji;
        },
      });
      cardsEl.appendChild(card);
    });

    Sound.speak(currentSay);
  }

  function resolve(card, emoji) {
    if (!running) return;
    if (emoji === correctEmoji) {
      Sound.pop();
      card.classList.add("pop");
      solved++;
      binEl.classList.add("sort-bin-happy");
      setTimeout(() => binEl.classList.remove("sort-bin-happy"), 500);
      if (solved % 4 === 0) {
        App.awardStars(1);
      } else {
        Sound.success();
      }
      App.later(makeRound, 1100);
    } else {
      card.classList.add("wrong");
      setTimeout(() => card.classList.remove("wrong"), 450);
      App.freeze(); // silence + a short pause: mistakes earn no sounds
    }
  }

  hearBtn.addEventListener("click", () => {
    Sound.click();
    if (currentSay) Sound.speak(currentSay);
  });

  return {
    start() {
      running = true;
      solved = 0;
      modeIdx = Math.floor(Math.random() * MODES.length);
      App.later(makeRound);
    },
    stop() {
      running = false;
    },
    hint() {
      const right = [...cardsEl.children].find((c) => c.textContent === correctEmoji);
      if (right) {
        right.classList.add("hint-glow");
        setTimeout(() => right.classList.remove("hint-glow"), 2200);
      }
    },
  };
})();
