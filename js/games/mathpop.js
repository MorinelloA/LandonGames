/* ===== Math Bubbles: drag the right answer into the equation =====
   Level ladder follows Landon's IEP math goal (add/subtract within 20,
   answer field of 2-3 choices), with ceiling levels above it to grow into. */
App.games.mathpop = (() => {
  const problemEl = document.getElementById("math-problem");
  const area = document.getElementById("bubble-area");
  const levelEl = document.getElementById("math-level");
  const colors = ["#7ec8e3", "#f9a8c2", "#90d4a3", "#c9a7eb", "#ffb347"];

  const MAX_LEVEL = 6;
  let level = Math.min(MAX_LEVEL, Math.max(1, parseInt(localStorage.getItem("landon-math-level") || "1", 10)));
  let winStreak = 0;   // consecutive correct → level up at 4
  let missStreak = 0;  // consecutive wrong → level down at 2
  let solved = 0;
  let answer = 0;
  let running = false;

  function rnd(n) { return 1 + Math.floor(Math.random() * n); }

  // addition with the SUM capped (IEP: "sums or differences within 20")
  function addWithin(max) {
    const a = rnd(max - 1);
    const b = rnd(max - a);
    return [a, b, "+"];
  }

  function subWithin(max) {
    let a = rnd(max), b = rnd(max);
    if (b > a) [a, b] = [b, a];
    return [a, b, "−"];
  }

  // Levels 1-4 track the IEP objectives; 5-6 are room to grow.
  function generate() {
    switch (level) {
      case 1: return addWithin(10);
      case 2: return addWithin(10);
      case 3: return Math.random() < 0.5 ? addWithin(10) : subWithin(10);
      case 4: return Math.random() < 0.5 ? addWithin(20) : subWithin(20);
      case 5: return Math.random() < 0.5 ? addWithin(20) : subWithin(20);
      default:
        if (Math.random() < 0.5) { const a = rnd(5), b = rnd(5); return [a, b, "×"]; }
        return Math.random() < 0.5 ? addWithin(30) : subWithin(30);
    }
  }

  // how many answer bubbles at each level (IEP: field of 2, then 3)
  function bubbleCount() {
    return level === 1 ? 2 : level <= 4 ? 3 : 4;
  }

  function renderLevel() {
    levelEl.textContent = "Level " + level;
  }

  function saveLevel() {
    localStorage.setItem("landon-math-level", String(level));
    renderLevel();
  }

  function makeProblem() {
    const [a, b, op] = generate();
    answer = op === "+" ? a + b : op === "−" ? a - b : a * b;
    problemEl.innerHTML = `${a} ${op} ${b} = <span id="math-drop">?</span>`;
    spawnBubbles();
  }

  function wrongAnswers(count) {
    const set = new Set([answer]);
    const spread = Math.max(4, Math.round(answer * 0.3));
    const out = [];
    while (out.length < count) {
      const w = answer + Math.floor(Math.random() * (spread * 2 + 1)) - spread;
      if (w < 0 || set.has(w)) continue;
      set.add(w);
      out.push(w);
    }
    return out;
  }

  function dropSlot() {
    return document.getElementById("math-drop");
  }

  function spawnBubbles() {
    area.innerHTML = "";
    const count = bubbleCount();
    const values = App.shuffle([answer, ...wrongAnswers(count - 1)]);
    const W = area.clientWidth, H = area.clientHeight;
    const size = Math.max(90, Math.min(150, H * 0.34));
    const slots = App.shuffle(Array.from({ length: count }, (_, i) => i));
    values.forEach((v, i) => {
      const b = document.createElement("button");
      b.className = "bubble";
      b.textContent = v;
      b.style.setProperty("--size", size + "px");
      b.style.setProperty("--bubble-color", colors[i % colors.length]);
      const col = slots[i];
      const x = (W / count) * col + (W / count - size) * Math.random();
      const y = 20 + Math.random() * Math.max(20, H - size - 60);
      b.style.left = Math.max(0, x) + "px";
      b.style.top = y + "px";
      b.style.animationDelay = Math.random() * 2 + "s";
      b.dataset.value = v;
      // tap still works as a shortcut...
      b.addEventListener("click", () => resolveGuess(b, v));
      // ...but dragging into the equation is the main way to play
      Drag.enable(b, {
        canDrag: () => running,
        targets: () => [dropSlot()],
        onPickup: () => { Sound.click(); dropSlot().classList.add("armed"); },
        onDrop: (target) => {
          dropSlot().classList.remove("armed");
          if (!target) return false;
          resolveGuess(b, v);
          return v === answer;
        },
      });
      area.appendChild(b);
    });
  }

  function resolveGuess(b, v) {
    if (!running) return;
    if (v === answer) {
      Sound.pop();
      const slot = dropSlot();
      slot.textContent = v;
      slot.style.borderStyle = "solid";
      slot.style.color = "#3a3f58";
      b.classList.add("pop");
      solved++;
      missStreak = 0;
      winStreak++;
      if (winStreak >= 4 && level < MAX_LEVEL) {
        level++;
        winStreak = 0;
        saveLevel();
        App.awardStars(1, { message: "Level " + level + "! 🚀" });
        Sound.speak("Level up!");
      } else if (solved % 5 === 0) {
        App.awardStars(1);
      } else {
        Sound.success();
      }
      App.later(makeProblem, 900);
    } else {
      winStreak = 0;
      missStreak++;
      if (missStreak >= 2 && level > 1) {
        level--;
        missStreak = 0;
        saveLevel(); // ease back down quietly — no fuss
      }
      b.classList.add("wrong");
      setTimeout(() => b.classList.remove("wrong"), 450);
      App.freeze(); // silence + a short pause: mistakes earn no sounds
    }
  }

  return {
    start() {
      running = true;
      winStreak = 0;
      missStreak = 0;
      solved = 0;
      renderLevel();
      App.later(makeProblem);
    },
    stop() {
      running = false;
      area.innerHTML = "";
    },
    hint() {
      const right = [...area.querySelectorAll(".bubble")].find((b) => parseInt(b.dataset.value, 10) === answer);
      if (right) {
        right.classList.add("hint-glow");
        setTimeout(() => right.classList.remove("hint-glow"), 2200);
      }
    },
  };
})();
