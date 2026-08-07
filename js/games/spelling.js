/* ===== Word Builder: drag letters into slots to spell the word ===== */
App.games.spelling = (() => {
  const pictureEl = document.getElementById("spell-picture");
  const slotsEl = document.getElementById("spell-slots");
  const lettersEl = document.getElementById("spell-letters");
  const hearBtn = document.getElementById("spell-hear");
  const levelEl = document.getElementById("spell-level");

  const words = [
    ["cat", "🐱"], ["dog", "🐶"], ["sun", "☀️"], ["bee", "🐝"], ["cow", "🐮"],
    ["pig", "🐷"], ["fox", "🦊"], ["owl", "🦉"], ["bus", "🚌"], ["car", "🚗"],
    ["hat", "🎩"], ["egg", "🥚"], ["ant", "🐜"], ["cup", "☕"], ["key", "🔑"],
    ["star", "⭐"], ["fish", "🐟"], ["frog", "🐸"], ["cake", "🎂"], ["milk", "🥛"],
    ["ball", "⚽"], ["duck", "🦆"], ["bear", "🐻"], ["lion", "🦁"], ["moon", "🌙"],
    ["tree", "🌳"], ["boat", "⛵"], ["bird", "🐦"], ["corn", "🌽"], ["ring", "💍"],
    ["apple", "🍎"], ["pizza", "🍕"], ["robot", "🤖"], ["train", "🚂"], ["house", "🏠"],
    ["snake", "🐍"], ["sheep", "🐑"], ["mouse", "🐭"], ["grape", "🍇"], ["tiger", "🐯"],
    ["whale", "🐳"], ["zebra", "🦓"], ["bread", "🍞"], ["cloud", "☁️"], ["heart", "❤️"],
    ["rabbit", "🐰"], ["monkey", "🐵"], ["banana", "🍌"], ["orange", "🍊"], ["cookie", "🍪"],
    ["flower", "🌸"], ["turtle", "🐢"], ["dragon", "🐉"], ["rocket", "🚀"], ["cherry", "🍒"],
  ];

  // level → which word lengths he sees, plus extra decoy letters at the top levels
  const LEVELS = [
    { lengths: [3], decoys: 0 },        // 1
    { lengths: [3, 4], decoys: 0 },     // 2
    { lengths: [4], decoys: 0 },        // 3
    { lengths: [4, 5], decoys: 0 },     // 4
    { lengths: [5], decoys: 1 },        // 5
    { lengths: [5, 6], decoys: 1 },     // 6
    { lengths: [6], decoys: 2 },        // 7
  ];

  let level = Math.min(LEVELS.length, Math.max(1, parseInt(localStorage.getItem("landon-word-level") || "1", 10)));
  let cleanStreak = 0;   // words finished without any mistakes
  let deck = [];
  let word = "";
  let filled = [];       // letter placed in each slot (or null)
  let errors = 0;        // mistakes on the current word
  let running = false;

  function renderLevel() {
    levelEl.textContent = "Level " + level;
  }

  function saveLevel() {
    localStorage.setItem("landon-word-level", String(level));
    renderLevel();
  }

  function wordPool() {
    const lengths = LEVELS[level - 1].lengths;
    return words.filter(([w]) => lengths.includes(w.length));
  }

  function nextWord() {
    if (deck.length === 0) deck = App.shuffle(wordPool());
    const [w, emoji] = deck.pop();
    word = w;
    filled = Array(word.length).fill(null);
    errors = 0;
    pictureEl.textContent = emoji;

    slotsEl.innerHTML = "";
    for (let i = 0; i < word.length; i++) {
      const s = document.createElement("div");
      s.className = "spell-slot";
      s.dataset.idx = i;
      slotsEl.appendChild(s);
    }

    // the word's letters plus decoys, shuffled
    const tiles = word.split("");
    const decoys = LEVELS[level - 1].decoys;
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    while (tiles.length < word.length + decoys) {
      const ch = alphabet[Math.floor(Math.random() * 26)];
      if (!word.includes(ch)) tiles.push(ch);
    }

    lettersEl.innerHTML = "";
    App.shuffle(tiles).forEach((ch) => {
      const t = document.createElement("button");
      t.className = "letter-tile";
      t.textContent = ch;
      // tap fills the next empty slot (if this letter belongs there)
      t.addEventListener("click", () => {
        const next = filled.indexOf(null);
        if (next !== -1) placeLetter(t, ch, next);
      });
      // drag onto any empty slot
      Drag.enable(t, {
        canDrag: () => running && !t.classList.contains("used"),
        targets: () => [...slotsEl.children].filter((s) => !s.classList.contains("filled")),
        onPickup: () => Sound.click(),
        onDrop: (slot) => {
          if (!slot) return false;
          return placeLetter(t, ch, parseInt(slot.dataset.idx, 10));
        },
      });
      lettersEl.appendChild(t);
    });

    Sound.speak(word);
  }

  function placeLetter(tile, ch, idx) {
    if (!running || tile.classList.contains("used") || filled[idx] !== null) return false;
    if (ch === word[idx]) {
      Sound.click();
      tile.classList.add("used");
      filled[idx] = ch;
      const slot = slotsEl.children[idx];
      slot.textContent = ch;
      slot.classList.add("filled");
      if (!filled.includes(null)) wordDone();
      return true;
    }
    errors++;
    tile.classList.add("wrong");
    setTimeout(() => tile.classList.remove("wrong"), 450);
    App.freeze(); // silence + a short pause: mistakes earn no sounds
    return false;
  }

  function wordDone() {
    Sound.success();
    setTimeout(() => Sound.speak(word + "! Great job!"), 250);

    // adapt: three perfect words in a row → harder; a really tough word → easier
    if (errors === 0) {
      cleanStreak++;
      if (cleanStreak >= 3 && level < LEVELS.length) {
        level++;
        cleanStreak = 0;
        deck = [];
        saveLevel();
        App.awardStars(2, { message: "Level " + level + "! 🚀" });
        Sound.speak("Level up!");
        setTimeout(() => running && nextWord(), 2100);
        return;
      }
    } else {
      cleanStreak = 0;
      if (errors >= 3 && level > 1) {
        level--;
        deck = [];
        saveLevel(); // quietly give him a breather
      }
    }
    App.awardStars(1, { message: word.toUpperCase() + "! 🌟" });
    setTimeout(() => running && nextWord(), 1900);
  }

  hearBtn.addEventListener("click", () => {
    Sound.click();
    if (word) Sound.speak(word);
  });

  return {
    start() {
      running = true;
      cleanStreak = 0;
      deck = [];
      renderLevel();
      nextWord();
    },
    stop() {
      running = false;
    },
    hint() {
      const next = filled.indexOf(null);
      if (next === -1) return;
      const tile = [...lettersEl.children].find(
        (t) => !t.classList.contains("used") && t.textContent === word[next]
      );
      if (tile) {
        tile.classList.add("hint-glow");
        setTimeout(() => tile.classList.remove("hint-glow"), 2200);
      }
    },
  };
})();
