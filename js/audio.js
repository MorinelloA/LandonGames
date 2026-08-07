/* ===== Sound engine: all sounds are synthesized, no files needed ===== */
const Sound = (() => {
  let ctx = null;
  let musicOn = false;
  let musicTimer = null;
  let musicStep = 0;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      // iOS parks the context in a non-standard "interrupted" state after
      // speech synthesis grabs the audio session — claw it back
      ctx.onstatechange = () => {
        if (ctx.state === "interrupted") ctx.resume();
      };
    }
    if (ctx.state !== "running") ctx.resume();
    return ctx;
  }

  // iOS: speech synthesis interrupts WebAudio, and after that tones die
  // silently until resume() runs inside a user gesture — so every tap is
  // a chance to bring the context back
  document.addEventListener("pointerdown", () => {
    if (ctx && ctx.state !== "running") ctx.resume();
  }, true);

  // Play one tone. Gentle envelopes everywhere: nothing harsh or startling.
  function tone(freq, { type = "sine", dur = 0.3, gain = 0.22, when = 0, slideTo = null } = {}) {
    const ac = ensure();
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  const N = {
    C3: 130.81, G3: 196.0, A3: 220.0, C4: 261.63, D4: 293.66, E4: 329.63,
    F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33,
    E5: 659.25, G5: 783.99, A5: 880.0, C6: 1046.5,
  };

  /* ---- Effects ---- */
  function pop() {
    tone(420, { type: "sine", dur: 0.16, gain: 0.3, slideTo: 950 });
  }

  function click() {
    tone(700, { type: "triangle", dur: 0.07, gain: 0.15 });
  }

  function flip() {
    tone(500, { type: "triangle", dur: 0.12, gain: 0.18, slideTo: 700 });
  }

  function success() {
    [N.C5, N.E5, N.G5].forEach((f, i) => tone(f, { type: "triangle", dur: 0.22, gain: 0.24, when: i * 0.09 }));
  }

  function fanfare() {
    [N.C5, N.E5, N.G5, N.C6].forEach((f, i) => tone(f, { type: "triangle", dur: 0.3, gain: 0.26, when: i * 0.13 }));
    [N.C4, N.G4].forEach((f, i) => tone(f, { type: "sine", dur: 0.5, gain: 0.14, when: i * 0.26 }));
  }

  // Deliberately NO sound for wrong answers: sounds are the reward.
  // Mistakes get silence and a short freeze (see App.freeze).

  function star() {
    tone(N.A5, { type: "sine", dur: 0.18, gain: 0.2 });
    tone(N.C6, { type: "sine", dur: 0.3, gain: 0.2, when: 0.1 });
  }

  /* ---- Speech (iPad's built-in voice) ----
     Speaking is deferred a beat: on iOS, starting speech interrupts
     WebAudio, so a tone played in the same tick as speak() would be
     silenced. The short delay lets sound effects ring out first. */
  function speak(text, { rate = 0.95, pitch = 1.1, delay = 350 } = {}) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    clearTimeout(speak._t);
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.pitch = pitch;
    u.lang = "en-US";
    // hand the audio session back to WebAudio when speech finishes (iOS)
    u.onend = u.onerror = () => {
      if (ctx && ctx.state !== "running") ctx.resume();
    };
    speak._t = setTimeout(() => window.speechSynthesis.speak(u), delay);
  }

  // stop current AND pending speech (freeze / leaving a game)
  function hush() {
    clearTimeout(speak._t);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  /* ---- Background music: soft pentatonic loop ---- */
  const melody = [
    N.C4, N.E4, N.G4, N.A4, N.G4, N.E4, N.D4, N.C4,
    N.E4, N.G4, N.A4, N.C5, N.A4, N.G4, N.E4, N.D4,
    N.C4, N.D4, N.E4, N.G4, N.E4, N.D4, N.C4, null,
    N.A3, N.C4, N.D4, N.E4, N.D4, N.C4, N.A3, null,
  ];

  function musicTick() {
    const f = melody[musicStep % melody.length];
    if (f) tone(f, { type: "sine", dur: 0.5, gain: 0.05 });
    if (musicStep % 8 === 0) tone(N.C3, { type: "sine", dur: 1.4, gain: 0.04 });
    musicStep++;
  }

  function setMusic(on) {
    musicOn = on;
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    if (on) {
      ensure();
      musicStep = 0;
      musicTick();
      musicTimer = setInterval(musicTick, 380);
    }
  }

  return { ensure, tone, N, pop, click, flip, success, fanfare, star, speak, hush, setMusic,
           get musicOn() { return musicOn; } };
})();
