/* ===== Music Maker: xylophone with follow-along songs ===== */
App.games.music = (() => {
  const xylo = document.getElementById("xylophone");
  const hintEl = document.getElementById("music-hint");
  const freeBtn = document.getElementById("music-free");

  const N = Sound.N;
  const keys = [
    { name: "C", freq: N.C4, color: "#ff8a8a" },
    { name: "D", freq: N.D4, color: "#ffb347" },
    { name: "E", freq: N.E4, color: "#ffd966" },
    { name: "F", freq: N.F4, color: "#90d4a3" },
    { name: "G", freq: N.G4, color: "#7ec8e3" },
    { name: "A", freq: N.A4, color: "#a0aef0" },
    { name: "B", freq: N.B4, color: "#c9a7eb" },
    { name: "C", freq: N.C5, color: "#f9a8c2" },
  ];

  // songs as key indexes (0 = C4 ... 7 = C5)
  const songs = {
    twinkle: [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0],
    mary: [2, 1, 0, 1, 2, 2, 2, 1, 1, 1, 2, 4, 4],
    hotcross: [2, 1, 0, 2, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 1, 0],
  };
  const songNames = {
    twinkle: "Twinkle Twinkle",
    mary: "Mary Had a Little Lamb",
    hotcross: "Hot Cross Buns",
  };

  let bars = [];
  let song = null;        // current follow-along song (array of key indexes)
  let songPos = 0;
  let running = false;

  function build() {
    xylo.innerHTML = "";
    bars = keys.map((k, i) => {
      const bar = document.createElement("button");
      bar.className = "xylo-bar";
      bar.textContent = k.name;
      bar.style.setProperty("--bar-color", k.color);
      bar.style.setProperty("--shrink", i * 4.5 + "%"); // classic xylophone taper
      bar.addEventListener("click", () => tapBar(i));
      xylo.appendChild(bar);
      return bar;
    });
  }

  function playKey(i) {
    const k = keys[i];
    Sound.tone(k.freq, { type: "triangle", dur: 0.5, gain: 0.28 });
    Sound.tone(k.freq * 2, { type: "sine", dur: 0.3, gain: 0.08 }); // sparkle overtone
    bars[i].classList.add("playing");
    setTimeout(() => bars[i].classList.remove("playing"), 250);
  }

  function tapBar(i) {
    if (!running) return;
    playKey(i);
    if (song) {
      if (i === song[songPos]) {
        bars[i].classList.remove("next-note");
        songPos++;
        if (songPos >= song.length) {
          song = null;
          clearSongButtons();
          setTimeout(() => {
            Sound.fanfare();
            App.awardStars(2, { message: "You played the song! 🎶" });
            hintEl.textContent = "Tap the bars to make music!";
          }, 400);
        } else {
          highlightNext();
        }
      }
      // wrong notes in follow-along are fine — free exploration, no penalty
    }
  }

  function highlightNext() {
    bars.forEach((b) => b.classList.remove("next-note"));
    bars[song[songPos]].classList.add("next-note");
  }

  function clearSongButtons() {
    document.querySelectorAll(".song-btn").forEach((b) => b.classList.remove("active-song"));
    bars.forEach((b) => b.classList.remove("next-note"));
  }

  function startSong(name, btn) {
    Sound.click();
    clearSongButtons();
    btn.classList.add("active-song");
    song = songs[name];
    songPos = 0;
    hintEl.textContent = "Follow the glowing bar to play " + songNames[name] + "!";
    highlightNext();
  }

  document.querySelectorAll(".song-btn").forEach((btn) => {
    btn.addEventListener("click", () => running && startSong(btn.dataset.song, btn));
  });

  freeBtn.addEventListener("click", () => {
    if (!running) return;
    Sound.click();
    song = null;
    clearSongButtons();
    hintEl.textContent = "Tap the bars to make music!";
  });

  return {
    start() {
      running = true;
      song = null;
      build();
      clearSongButtons();
      hintEl.textContent = "Tap the bars to make music!";
    },
    stop() {
      running = false;
      song = null;
    },
    hint() {
      if (song) {
        const bar = bars[song[songPos]];
        bar.classList.add("hint-glow");
        setTimeout(() => bar.classList.remove("hint-glow"), 2200);
      } else {
        Sound.speak("Tap the bars to make music!");
      }
    },
  };
})();
