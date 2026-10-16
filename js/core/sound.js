// Sound engine: every sound is synthesized, so there are no audio files.
// Sounds are the reward, so there is deliberately NO sound for a wrong
// answer: mistakes get silence and a short freeze (see freeze.js).

let ctx = null;
let musicOn = false;
let musicTimer = null;
let musicStep = 0;

// iOS hands the audio session to whichever of WebAudio / speech asks for
// it last, so never resume the context while speech is talking — that
// steals the session mid-utterance and can wedge BOTH until reload.
function speechBusy() {
  return "speechSynthesis" in window &&
         (window.speechSynthesis.speaking || window.speechSynthesis.pending);
}

export function ensure() {
  if (ctx && ctx.state === "closed") ctx = null; // iOS can kill it outright
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state !== "running" && !speechBusy()) ctx.resume().catch(() => {});
  return ctx;
}

// Every tap is a user gesture — the only time iOS reliably lets us
// revive audio. Unstick speech if iOS wedged it in "paused", and bring
// WebAudio back only when speech is idle.
document.addEventListener("pointerdown", () => {
  if ("speechSynthesis" in window && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
  if (ctx && ctx.state !== "running" && !speechBusy()) {
    ctx.resume().catch(() => {});
  }
}, true);

// Play one tone. Gentle envelopes everywhere: nothing harsh or startling.
export function tone(freq, { type = "sine", dur = 0.3, gain = 0.22, when = 0, slideTo = null } = {}) {
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

export const N = {
  C3: 130.81, G3: 196.0, A3: 220.0, C4: 261.63, D4: 293.66, E4: 329.63,
  F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33,
  E5: 659.25, G5: 783.99, A5: 880.0, C6: 1046.5,
};

/* ---- Effects ---- */
export function pop() {
  tone(420, { type: "sine", dur: 0.16, gain: 0.3, slideTo: 950 });
}

export function click() {
  tone(700, { type: "triangle", dur: 0.07, gain: 0.15 });
}

export function flip() {
  tone(500, { type: "triangle", dur: 0.12, gain: 0.18, slideTo: 700 });
}

export function success() {
  [N.C5, N.E5, N.G5].forEach((f, i) => tone(f, { type: "triangle", dur: 0.22, gain: 0.24, when: i * 0.09 }));
}

export function fanfare() {
  [N.C5, N.E5, N.G5, N.C6].forEach((f, i) => tone(f, { type: "triangle", dur: 0.3, gain: 0.26, when: i * 0.13 }));
  [N.C4, N.G4].forEach((f, i) => tone(f, { type: "sine", dur: 0.5, gain: 0.14, when: i * 0.26 }));
}

export function star() {
  tone(N.A5, { type: "sine", dur: 0.18, gain: 0.2 });
  tone(N.C6, { type: "sine", dur: 0.3, gain: 0.2, when: 0.1 });
}

/* ---- Speech (the iPad's built-in voice) ----
   Speaking is deferred a beat: on iOS, starting speech interrupts
   WebAudio, so a tone played in the same tick as speak() would be
   silenced. The short delay lets sound effects ring out first. */
let speakTimer = null;
let utterances = null; // Safari GCs unreferenced utterances mid-speech

export function speak(text, opts) {
  say([text], opts);
}

// Several lines in a row, each finishing before the next starts (a story,
// then its question). Queued in one go, so nothing cuts anything off.
export function say(lines, { rate = 0.95, pitch = 1.1, delay = 350 } = {}) {
  if (!("speechSynthesis" in window)) return;
  clearTimeout(speakTimer);
  // cancel() on an IDLE synthesizer is a known iOS wedge (speaking gets
  // stuck true forever) — only cancel when something is actually queued
  if (speechBusy()) window.speechSynthesis.cancel();
  const us = lines.map((text) => {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.pitch = pitch;
    u.lang = "en-US";
    return u;
  });
  // hand the audio session back to WebAudio when speech finishes (iOS)
  us[us.length - 1].onend = us[us.length - 1].onerror = () => {
    if (ctx && ctx.state !== "running") ctx.resume().catch(() => {});
  };
  utterances = us;
  speakTimer = setTimeout(() => utterances.forEach((u) => window.speechSynthesis.speak(u)), delay);
}

// stop current AND pending speech (freeze / leaving a game)
export function hush() {
  clearTimeout(speakTimer);
  if (speechBusy()) window.speechSynthesis.cancel();
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

export function setMusic(on) {
  musicOn = on;
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  if (on) {
    ensure();
    musicStep = 0;
    musicTick();
    musicTimer = setInterval(musicTick, 380);
  }
}

export function isMusicOn() {
  return musicOn;
}
