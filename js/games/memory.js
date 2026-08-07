/* ===== Animal Match: memory pairs — each animal says its name ===== */
App.games.memory = (() => {
  const grid = document.getElementById("memory-grid");

  const animals = [
    ["dog", "🐶", Sound.N.C4], ["cat", "🐱", Sound.N.E4], ["cow", "🐮", Sound.N.G4],
    ["duck", "🦆", Sound.N.A4], ["lion", "🦁", Sound.N.C5], ["frog", "🐸", Sound.N.E5],
  ];

  let firstPick = null;
  let locked = false;
  let matched = 0;
  let running = false;

  function build() {
    matched = 0;
    firstPick = null;
    locked = false;
    grid.innerHTML = "";
    const cards = App.shuffle(
      animals.flatMap(([name, emoji, note]) => [
        { name, emoji, note }, { name, emoji, note },
      ])
    );
    cards.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "mem-card";
      btn.dataset.name = c.name;
      btn.innerHTML =
        `<span class="mem-face mem-back">❓</span>` +
        `<span class="mem-face mem-front">${c.emoji}</span>`;
      btn.addEventListener("click", () => tapCard(btn, c));
      grid.appendChild(btn);
    });
  }

  function tapCard(btn, c) {
    if (!running || locked || btn.classList.contains("flipped")) return;
    Sound.flip();
    Sound.tone(c.note, { type: "triangle", dur: 0.35, gain: 0.2 });
    btn.classList.add("flipped");
    Sound.speak(c.name);

    if (!firstPick) {
      firstPick = { btn, c };
      return;
    }

    if (firstPick.c.name === c.name) {
      // match!
      const a = firstPick.btn;
      firstPick = null;
      matched++;
      setTimeout(() => {
        a.classList.add("matched");
        btn.classList.add("matched");
        Sound.success();
        if (matched === animals.length) {
          setTimeout(() => {
            Sound.fanfare();
            App.awardStars(3, { message: "You found them all! 🏆" });
            Sound.speak("You found all the animals! Amazing!");
            setTimeout(() => running && build(), 2300);
          }, 600);
        }
      }, 450);
    } else {
      // not a match — flip both back gently
      locked = true;
      const a = firstPick.btn;
      firstPick = null;
      // no freeze here — flipping non-matching pairs is how a memory game
      // is played, not a mistake. Just a silent flip-back.
      setTimeout(() => {
        a.classList.remove("flipped");
        btn.classList.remove("flipped");
        locked = false;
      }, 1100);
    }
  }

  return {
    start() {
      running = true;
      build();
    },
    stop() {
      running = false;
    },
    hint() {
      const hidden = [...grid.children].filter(
        (c) => !c.classList.contains("flipped") && !c.classList.contains("matched")
      );
      if (firstPick) {
        // glow where the match for his flipped card is hiding
        const match = hidden.find((c) => c.dataset.name === firstPick.c.name);
        if (match) {
          match.classList.add("hint-glow");
          setTimeout(() => match.classList.remove("hint-glow"), 2200);
        }
        return;
      }
      // otherwise sneak a peek at one pair
      if (locked) return;
      const byName = {};
      hidden.forEach((c) => (byName[c.dataset.name] = byName[c.dataset.name] || []).push(c));
      const pair = Object.values(byName).find((p) => p.length === 2);
      if (!pair) return;
      locked = true;
      pair.forEach((c) => c.classList.add("flipped"));
      setTimeout(() => {
        pair.forEach((c) => c.classList.remove("flipped"));
        locked = false;
      }, 1300);
    },
  };
})();
