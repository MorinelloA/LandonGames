/* ===== Feelings: hear a little story, pick how the character feels =====
   IEP ELA goal: identify a character's feeling from a field of 2-3 picture
   choices. Level 1 = happy/sad (field of 2), level 2 adds angry, level 3
   adds scared. Drag the face onto the scene. Wrong → silence + freeze. */
App.games.feelings = (() => {
  const sceneEl = document.getElementById("feel-scene");
  const sentenceEl = document.getElementById("feel-sentence");
  const facesEl = document.getElementById("feel-faces");
  const levelEl = document.getElementById("feel-level");
  const hearBtn = document.getElementById("feel-hear");

  const FACES = { happy: "😊", sad: "😢", angry: "😠", scared: "😨" };

  // `who` sets the pronoun in the question, and every story names its
  // character. `alsoOk` feelings are a fair answer too (a knocked-down
  // tower can make you sad, not just angry), so they're never offered as
  // the wrong choice. Scenes show what happened, never how anyone feels.
  const SCENARIOS = [
    { who: "boy", scene: "👦🍦⬇️", text: "The boy dropped his ice cream.", answer: "sad" },
    { who: "girl", scene: "👧🎂🎈", text: "It is the girl's birthday party!", answer: "happy" },
    { who: "boy", scene: "👦🎁", text: "The boy got a new toy!", answer: "happy" },
    { who: "girl", scene: "👧🧸", text: "The girl's teddy bear ripped.", answer: "sad" },
    { who: "boy", scene: "👦🐶", text: "The boy is playing with his puppy!", answer: "happy" },
    { who: "girl", scene: "👧🌧️⚽", text: "It is raining, so the girl can't play outside.", answer: "sad", alsoOk: ["angry"] },
    { who: "boy", scene: "👦🍕", text: "The boy is eating his favorite pizza!", answer: "happy" },
    { who: "girl", scene: "👧🎈💨", text: "The girl's balloon flew away.", answer: "sad" },
    { who: "boy", scene: "👦🏊", text: "The boy gets to go swimming today!", answer: "happy" },
    { who: "girl", scene: "👧🍪", text: "The girl's cookies are all gone.", answer: "sad" },
    { who: "boy", scene: "👦🚂", text: "The boy is going on a train ride!", answer: "happy" },
    { who: "girl", scene: "👧🩹", text: "The girl fell down and hurt her knee.", answer: "sad" },
    { who: "boy", scene: "👦🧱💥", text: "Someone knocked down the boy's tower.", answer: "angry", alsoOk: ["sad"] },
    { who: "girl", scene: "👧🍭👦", text: "Her brother took the girl's candy.", answer: "angry", alsoOk: ["sad"] },
    { who: "boy", scene: "👦🧸🧺", text: "The boy has to stop playing and clean up.", answer: "angry", alsoOk: ["sad"] },
    { who: "girl", scene: "👧📕✏️", text: "Someone scribbled in the girl's book.", answer: "angry", alsoOk: ["sad"] },
    { who: "boy", scene: "👦🐕📢", text: "A big dog barked at the boy.", answer: "scared" },
    { who: "girl", scene: "👧⛈️", text: "The girl hears very loud thunder.", answer: "scared" },
    { who: "boy", scene: "👦🌑", text: "The lights went out, and the boy is in the dark.", answer: "scared" },
    { who: "girl", scene: "👧🕷️", text: "A big spider ran by the girl.", answer: "scared" },
    { who: "boy", scene: "👦🏆", text: "The boy won the race!", answer: "happy" },
    { who: "girl", scene: "👧👵", text: "Grandma came to visit the girl!", answer: "happy" },
    { who: "boy", scene: "👦🎮🔌", text: "The boy's game turned off before he saved.", answer: "angry", alsoOk: ["sad"] },
    { who: "girl", scene: "👧🛝", text: "The girl is going to the playground!", answer: "happy" },
  ];

  // which feelings are in play, and how many face choices are shown
  const LEVELS = [
    { pool: ["happy", "sad"], field: 2 },
    { pool: ["happy", "sad", "angry"], field: 3 },
    { pool: ["happy", "sad", "angry", "scared"], field: 3 },
  ];

  let level = Math.min(LEVELS.length, Math.max(1, parseInt(localStorage.getItem("landon-feelings-level") || "1", 10)));
  let cleanStreak = 0;
  let missStreak = 0;
  let deck = [];
  let current = null;
  let hadError = false;
  let running = false;

  function renderLevel() {
    levelEl.textContent = "Level " + level;
  }

  function saveLevel() {
    localStorage.setItem("landon-feelings-level", String(level));
    renderLevel();
  }

  function scenarioPool() {
    const pool = LEVELS[level - 1].pool;
    return SCENARIOS.filter((s) => pool.includes(s.answer));
  }

  // the story, then the question, queued so the question never cuts it off
  function speakScenario() {
    if (!current) return;
    const pronoun = current.who === "girl" ? "she" : "he";
    Sound.say([current.text, "How does " + pronoun + " feel?"]);
  }

  function makeRound() {
    if (deck.length === 0) deck = App.shuffle(scenarioPool());
    current = deck.pop();
    hadError = false;

    sceneEl.textContent = current.scene;
    sentenceEl.textContent = current.text;

    const { pool, field } = LEVELS[level - 1];
    const fair = current.alsoOk || [];
    const others = pool.filter((f) => f !== current.answer && !fair.includes(f));
    const choices = App.shuffle([current.answer, ...App.shuffle(others).slice(0, field - 1)]);

    facesEl.innerHTML = "";
    choices.forEach((feeling) => {
      const face = document.createElement("button");
      face.className = "feel-face";
      face.textContent = FACES[feeling];
      face.dataset.feeling = feeling;
      face.setAttribute("aria-label", feeling);
      face.addEventListener("click", () => resolve(face, feeling));
      Drag.enable(face, {
        canDrag: () => running,
        targets: () => [sceneEl],
        onPickup: () => Sound.click(),
        onDrop: (t) => {
          if (!t || !current) return false;
          const isRight = feeling === current.answer; // resolve() clears `current` on success
          resolve(face, feeling);
          return isRight;
        },
      });
      facesEl.appendChild(face);
    });

    speakScenario();
  }

  function resolve(face, feeling) {
    if (!running || !current) return;
    if (feeling === current.answer) {
      Sound.pop();
      face.classList.add("pop");
      Sound.speak(feeling + "! That's right!");
      missStreak = 0;
      if (!hadError) {
        cleanStreak++;
        if (cleanStreak >= 3 && level < LEVELS.length) {
          level++;
          cleanStreak = 0;
          deck = [];
          saveLevel();
          App.awardStars(1, { message: "Level " + level + "! 🚀" });
        } else {
          App.awardStars(1, { celebrate: false });
          Sound.success();
        }
      } else {
        cleanStreak = 0;
        Sound.success();
      }
      current = null;
      App.later(makeRound, 1800);
    } else {
      hadError = true;
      cleanStreak = 0;
      missStreak++;
      if (missStreak >= 2 && level > 1) {
        level--;
        missStreak = 0;
        deck = [];
        saveLevel(); // quietly give him a breather
      }
      face.classList.add("wrong");
      setTimeout(() => face.classList.remove("wrong"), 450);
      App.freeze(); // silence + a short pause: mistakes earn no sounds
    }
  }

  hearBtn.addEventListener("click", () => {
    Sound.click();
    speakScenario();
  });

  return {
    start() {
      running = true;
      cleanStreak = 0;
      missStreak = 0;
      deck = [];
      renderLevel();
      App.later(makeRound);
    },
    stop() {
      running = false;
    },
    hint() {
      if (!current) return;
      const right = [...facesEl.children].find((f) => f.dataset.feeling === current.answer);
      if (right) {
        right.classList.add("hint-glow");
        setTimeout(() => right.classList.remove("hint-glow"), 2200);
      }
    },
  };
})();
