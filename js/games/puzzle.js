/* ===== Puzzle engine shared by Puzzle Builder and Picture Puzzle =====
   No freeze in puzzle games: trial and error is part of puzzling.
   Wrong drops are still silent (sounds stay a success-only reward). */
const PuzzleCore = (() => {
  function create({ boardEl, trayEl, levelEl, storageKey, minN = 2, maxN = 6, onComplete }) {
    let n = Math.min(maxN, Math.max(minN, parseInt(localStorage.getItem(storageKey) || String(minN), 10)));
    let placed = 0;
    let errors = 0;
    let running = false;

    function renderLevel() {
      levelEl.textContent = n + " × " + n;
    }

    function save() {
      localStorage.setItem(storageKey, String(n));
      renderLevel();
    }

    function build(imgUrl) {
      placed = 0;
      errors = 0;
      renderLevel();

      const D = Math.min(window.innerHeight * 0.52, window.innerWidth * 0.42, 440);
      const P = Math.floor(D / n);
      boardEl.innerHTML = "";
      boardEl.style.gridTemplateColumns = `repeat(${n}, ${P}px)`;
      boardEl.style.gridTemplateRows = `repeat(${n}, ${P}px)`;

      for (let i = 0; i < n * n; i++) {
        const slot = document.createElement("div");
        slot.className = "puzzle-slot";
        slot.dataset.idx = i;
        boardEl.appendChild(slot);
      }

      trayEl.innerHTML = "";
      App.shuffle(Array.from({ length: n * n }, (_, i) => i)).forEach((i) => {
        const piece = document.createElement("button");
        piece.className = "puzzle-piece";
        piece.dataset.idx = i;
        piece.style.width = P + "px";
        piece.style.height = P + "px";
        piece.style.backgroundImage = `url(${imgUrl})`;
        piece.style.backgroundSize = `${P * n}px ${P * n}px`;
        piece.style.backgroundPosition = `-${(i % n) * P}px -${Math.floor(i / n) * P}px`;
        Drag.enable(piece, {
          canDrag: () => running,
          targets: () => [...boardEl.children].filter((s) => !s.classList.contains("filled")),
          onPickup: () => Sound.click(),
          onDrop: (slot) => {
            if (!slot) return false;
            if (slot.dataset.idx === piece.dataset.idx) {
              slot.style.backgroundImage = piece.style.backgroundImage;
              slot.style.backgroundSize = piece.style.backgroundSize;
              slot.style.backgroundPosition = piece.style.backgroundPosition;
              slot.classList.add("filled");
              piece.remove();
              Sound.pop();
              placed++;
              if (placed === n * n) done();
              return true;
            }
            // wrong slot: silent snap-back, no freeze — puzzling is trial and error
            errors++;
            return false;
          },
        });
        trayEl.appendChild(piece);
      });
    }

    function done() {
      Sound.fanfare();
      App.awardStars(2, { message: "Puzzle done! 🧩" });
      Sound.speak("You built the whole picture! Amazing!");
      // adapt: a clean solve unlocks a bigger grid, a tough one shrinks it
      if (errors <= 1 && n < maxN) n++;
      else if (errors >= n * n && n > minN) n--;
      save();
      App.later(onComplete, 2400);
    }

    return {
      build,
      renderLevel,
      set running(v) { running = v; },
      get running() { return running; },
      hint() {
        // glow the slot where the first tray piece belongs
        const piece = trayEl.querySelector(".puzzle-piece");
        if (!piece) return;
        const slot = [...boardEl.children].find((s) => s.dataset.idx === piece.dataset.idx);
        if (slot) {
          piece.classList.add("hint-glow");
          slot.classList.add("hint-glow");
          setTimeout(() => {
            piece.classList.remove("hint-glow");
            slot.classList.remove("hint-glow");
          }, 2200);
        }
      },
    };
  }

  return { create };
})();

/* ===== Scene painter for Puzzle Builder =====
   Full collage scenes rather than one central emoji, so every piece has
   distinct content to recognize — even on a 6x6 grid. */
const PuzzleScenes = (() => {
  const THEMES = [
    { bg: ["#d6ecff", "#e9ffd9"], focal: "🚜", items: ["🐄", "🐖", "🐓", "🌻", "🌾", "🐑", "🦆", "🐇", "🌽", "🍎"] },
    { bg: ["#dfe4ff", "#f7e2ff"], focal: "🚀", items: ["⭐", "🪐", "👩‍🚀", "🛸", "🌙", "☄️", "🌟", "🌍", "🔭", "👽"] },
    { bg: ["#d9f6ff", "#e6fff4"], focal: "🐳", items: ["🐠", "🐙", "🦀", "🐬", "🐚", "🦈", "🪸", "🐡", "🐢", "⛵"] },
    { bg: ["#e4ffe0", "#fff7d9"], focal: "🦁", items: ["🐒", "🦜", "🐍", "🌺", "🦋", "🐸", "🌴", "🐯", "🦒", "🐘"] },
    { bg: ["#fff0f5", "#fffbe0"], focal: "🍨", items: ["🍭", "🧁", "🍩", "🍪", "🍓", "🍰", "🍬", "🎂", "🍫", "🥞"] },
    { bg: ["#e8f4ff", "#ffeede"], focal: "🚂", items: ["🚗", "🚌", "🚁", "🚒", "🚓", "✈️", "🚲", "🚦", "⛽", "🛴"] },
  ];

  function makeScene() {
    const S = 600;
    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    const c = document.createElement("canvas");
    c.width = S;
    c.height = S;
    const g = c.getContext("2d");

    const grad = g.createLinearGradient(0, 0, S, S);
    grad.addColorStop(0, theme.bg[0]);
    grad.addColorStop(1, theme.bg[1]);
    g.fillStyle = grad;
    g.fillRect(0, 0, S, S);

    // soft colorful blobs so even emoji-free patches look distinct
    const blobColors = ["#ffffff", "#ffe9a8", "#ffd3e0", "#cdeffd", "#d8f8d8", "#eadcff"];
    for (let i = 0; i < 16; i++) {
      g.globalAlpha = 0.25 + Math.random() * 0.3;
      g.fillStyle = blobColors[Math.floor(Math.random() * blobColors.length)];
      g.beginPath();
      g.arc(Math.random() * S, Math.random() * S, S * (0.04 + Math.random() * 0.09), 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;

    g.textAlign = "center";
    g.textBaseline = "middle";

    // one item in EVERY cell of a jittered 6x6 grid (matching the biggest
    // puzzle size) — every piece is guaranteed recognizable content
    const GRID = 6;
    const cell = S / GRID;
    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        const emoji = theme.items[Math.floor(Math.random() * theme.items.length)];
        const size = cell * (0.6 + Math.random() * 0.35);
        const x = gx * cell + cell * (0.35 + Math.random() * 0.3);
        const y = gy * cell + cell * (0.35 + Math.random() * 0.3);
        g.save();
        g.translate(x, y);
        g.rotate((Math.random() - 0.5) * 0.8);
        g.font = size + "px serif";
        g.fillText(emoji, 0, 0);
        g.restore();
      }
    }

    g.font = S * 0.3 + "px serif";
    g.fillText(theme.focal, S / 2, S * 0.52);
    return c.toDataURL();
  }

  return { makeScene };
})();

/* ===== Puzzle Builder: emoji scenes ===== */
App.games.puzzle = (() => {
  const core = PuzzleCore.create({
    boardEl: document.getElementById("puzzle-board"),
    trayEl: document.getElementById("puzzle-tray"),
    levelEl: document.getElementById("puzzle-level"),
    storageKey: "landon-puzzle-level",
    onComplete: () => core.build(PuzzleScenes.makeScene()),
  });

  return {
    start() {
      core.running = true;
      core.renderLevel();
      App.later(() => core.build(PuzzleScenes.makeScene()));
    },
    stop() {
      core.running = false;
    },
    hint() {
      core.hint();
    },
  };
})();
