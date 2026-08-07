/* ===== App shell: navigation, stars, celebration, confetti ===== */
const App = (() => {
  const games = {};           // registered by each game file: { start(), stop() }
  let currentGame = null;

  const starTotalEl = document.getElementById("star-total");
  let stars = parseInt(localStorage.getItem("landon-stars") || "0", 10);

  function renderStars() {
    starTotalEl.textContent = stars;
  }

  function awardStars(n, { celebrate = true, message = null } = {}) {
    stars += n;
    localStorage.setItem("landon-stars", String(stars));
    renderStars();
    Sound.star();
    if (celebrate) {
      showCelebration(message || pickPraise());
      confettiBurst();
    }
  }

  const praise = ["Great job! 🌟", "You did it! 🎉", "Awesome! ⭐", "Way to go! 🙌", "Super! 🚀", "Amazing! 🌈"];
  function pickPraise() {
    return praise[Math.floor(Math.random() * praise.length)];
  }

  const celebrationEl = document.getElementById("celebration");
  const celebrationText = document.getElementById("celebration-text");
  function showCelebration(text) {
    celebrationText.textContent = text;
    celebrationEl.classList.remove("hidden");
    // restart the CSS animation
    celebrationText.style.animation = "none";
    void celebrationText.offsetWidth;
    celebrationText.style.animation = "";
    clearTimeout(showCelebration._t);
    showCelebration._t = setTimeout(() => celebrationEl.classList.add("hidden"), 1700);
  }

  /* ---- Freeze: the quiet pause after a wrong answer ----
     No sound, no animation — just a few seconds where nothing responds.
     Sounds are the reward, so mistakes earn silence and a short wait. */
  const freezeEl = document.getElementById("freeze-overlay");
  let frozen = false;
  function freeze(ms = 3000, onDone = null) {
    if (frozen) return;
    frozen = true;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    freezeEl.classList.remove("hidden");
    setTimeout(() => {
      frozen = false;
      freezeEl.classList.add("hidden");
      if (onDone) onDone();
    }, ms);
  }

  const confettiLayer = document.getElementById("confetti-layer");
  const confettiEmoji = ["🎉", "⭐", "🌟", "💛", "💙", "💜", "🧡", "✨"];
  function confettiBurst(count = 24) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "confetti";
      el.textContent = confettiEmoji[Math.floor(Math.random() * confettiEmoji.length)];
      el.style.left = Math.random() * 100 + "vw";
      el.style.animationDuration = 1.6 + Math.random() * 1.6 + "s";
      el.style.animationDelay = Math.random() * 0.4 + "s";
      el.style.fontSize = 18 + Math.random() * 20 + "px";
      confettiLayer.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    }
  }

  /* ---- Navigation ---- */
  const homeBtn = document.getElementById("home-btn");
  const helpBtn = document.getElementById("help-btn");

  function show(screenId) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    document.getElementById("screen-" + screenId).classList.add("active");
    homeBtn.classList.toggle("hidden", screenId === "menu");
    helpBtn.classList.toggle("hidden", screenId === "menu");
  }

  function openGame(name) {
    if (!games[name]) return;
    Sound.ensure();
    Sound.click();
    if (currentGame && games[currentGame].stop) games[currentGame].stop();
    currentGame = name;
    show(name);
    games[name].start();
  }

  function goHome() {
    Sound.click();
    if (currentGame && games[currentGame].stop) games[currentGame].stop();
    currentGame = null;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    show("menu");
  }

  document.querySelectorAll(".game-card").forEach((card) => {
    card.addEventListener("click", () => openGame(card.dataset.game));
  });
  homeBtn.addEventListener("click", goHome);

  /* ---- Help: asking is ALWAYS rewarded, never penalized ----
     Speaks a 2-word request out loud (modeling his AAC goal), then the
     current game gives a genuine hint. */
  helpBtn.addEventListener("click", () => {
    Sound.ensure();
    Sound.speak("Help please");
    if (currentGame && games[currentGame].hint) games[currentGame].hint();
  });

  /* ---- Music toggle ---- */
  const musicBtn = document.getElementById("music-btn");
  musicBtn.classList.add("off");
  musicBtn.addEventListener("click", () => {
    const on = !Sound.musicOn;
    Sound.setMusic(on);
    musicBtn.classList.toggle("off", !on);
  });

  /* ---- Shuffle helper ---- */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ---- Best-effort landscape lock ----
     iPad Safari doesn't allow locking from the browser (the CSS rotate
     overlay covers portrait instead), but browsers that support the
     Screen Orientation API will honor this. */
  function tryLockLandscape() {
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock("landscape").catch(() => {});
      }
    } catch (_) {}
  }
  tryLockLandscape();
  window.addEventListener("pointerdown", tryLockLandscape, { once: true });

  renderStars();

  return { games, awardStars, showCelebration, confettiBurst, shuffle, goHome, freeze,
           get frozen() { return frozen; } };
})();
