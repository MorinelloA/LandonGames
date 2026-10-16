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

  const SCENARIOS = [
    { scene: "👦🍦⬇️", text: "The boy dropped his ice cream.", answer: "sad" },
    { scene: "👧🎂🎈", text: "It is the girl's birthday party!", answer: "happy" },
    { scene: "👦🎁", text: "The boy got a new toy!", answer: "happy" },
    { scene: "👧🧸💔", text: "The girl's teddy bear ripped.", answer: "sad" },
    { scene: "👦🐶", text: "The boy is playing with his puppy!", answer: "happy" },
    { scene: "👧🌧️⚽", text: "It is raining, so the girl can't play outside.", answer: "sad" },
    { scene: "👦🍕", text: "The boy is eating his favorite pizza!", answer: "happy" },
    { scene: "👧😢🎈", text: "The girl's balloon flew away.", answer: "sad" },
    { scene: "👦🏊", text: "The boy gets to go swimming today!", answer: "happy" },
    { scene: "👧🍪∅", text: "The cookies are all gone.", answer: "sad" },
    { scene: "👦🚂🎉", text: "The boy is going on a train ride!", answer: "happy" },
    { scene: "👧🤕", text: "The girl fell down and hurt her knee.", answer: "sad" },
    { scene: "👦🧱💥", text: "Someone knocked down the boy's tower.", answer: "angry" },
    { scene: "👧🍭❌", text: "Her brother took the girl's candy.", answer: "angry" },
    { scene: "👦🚗🙅", text: "The boy has to stop playing and clean up.", answer: "angry" },
    { scene: "👧📕✏️", text: "Someone scribbled in the girl's book.", answer: "angry" },
    { scene: "👦🐕📢", text: "A big dog barked at the boy.", answer: "scared" },
    { scene: "👧⛈️", text: "The thunder is very loud.", answer: "scared" },
    { scene: "👦🌑", text: "The lights went out and it is dark.", answer: "scared" },
    { scene: "👧🕷️", text: "A big spider ran by the girl.", answer: "scared" },
    { scene: "👦🏆", text: "The boy won the race!", answer: "happy" },
    { scene: "👧👵💝", text: "Grandma came to visit the girl!", answer: "happy" },
    { scene: "👦🎮🚫", text: "The boy's game turned off before he saved.", answer: "angry" },
    { scene: "👧🛝", text: "The girl is going to the playground!", answer: "happy" },
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

  function speakScenario() {
    if (!current) return;
    Sound.speak(current.text);
    const who = current.text.includes("girl") || current.text.includes("Grandma") ? "she" : "he";
    setTimeout(() => running && Sound.speak("How does " + who + " feel?"), 2200);
  }

  function makeRound() {
    if (deck.length === 0) deck = App.shuffle(scenarioPool());
    current = deck.pop();
    hadError = false;

    sceneEl.textContent = current.scene.replace("∅", "");
    sentenceEl.textContent = current.text;

    const { pool, field } = LEVELS[level - 1];
    const others = pool.filter((f) => f !== current.answer);
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
