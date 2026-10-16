// Sound engine: effects and music are synthesized; the narrator's lines are
// recorded clips (voice/). Sounds are the reward, so there is deliberately
// NO sound for a wrong answer: mistakes get silence and a short freeze (see
// freeze.js).

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

/* ---- The narrator ----
   Every line the games say is a recorded clip in voice/ (made by
   tools/voice.mjs from js/logic/lines.js), played through the same
   AudioContext as the sound effects, so the two can't take the iPad's
   audio session from each other. A line without a clip falls back to the
   iPad's speech synthesis; a test makes sure that never happens.

     speak(text)  one line, replacing whatever is being said
     say(lines)   several in a row (a story, then its question)
     after(text)  a line after the ones already going; { max } caps how many wait
                  (not "then": a module exporting then() looks like a promise to await import())
     hush()       stop it all (the quiet pause, leaving a game)

   Each start waits a beat (350 ms) so a sound effect played at the same
   moment rings out first, and that's when the clips get fetched and decoded. */
const GAP = 180;  // ms between lines in a row
const KEEP = 40;  // decoded clips kept for reuse (an iPad mini's memory is small)
let manifestReady = null;
const buffers = new Map(); // clip file → AudioBuffer, least recently used first
const loading = new Map(); // clip file → its decode in flight
let queue = [];      // lines waiting: { text, drop }, drop meaning a newer after(…, { max }) may replace it
let busy = false;    // a line is playing, or about to
let run = 0;         // bumped by every replace and hush, which retires older work
let startTimer = null;
let source = null;   // the clip playing now
let voiceBus = null;

function loadManifest() {
  if (!manifestReady) {
    manifestReady = fetch("voice/manifest.json")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  return manifestReady;
}

// The decoded clip for a line, or null when it has none.
async function clipFor(line) {
  const m = await loadManifest();
  const file = m && m.lines && m.lines[line];
  if (!file) return null;
  if (buffers.has(file)) {
    const buf = buffers.get(file);
    buffers.delete(file);
    buffers.set(file, buf);
    return buf;
  }
  if (!loading.has(file)) {
    loading.set(file, fetch("voice/" + file)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(file))))
      .then((data) => new Promise((ok, fail) => ensure().decodeAudioData(data, ok, fail)))
      .then((buf) => {
        buffers.set(file, buf);
        if (buffers.size > KEEP) buffers.delete(buffers.keys().next().value);
        return buf;
      })
      .finally(() => loading.delete(file)));
  }
  return loading.get(file);
}

function voiceOut() {
  const ac = ensure();
  if (!voiceBus || voiceBus.context !== ac) {
    voiceBus = ac.createGain();
    voiceBus.connect(ac.destination);
  }
  return voiceBus;
}

async function next(r) {
  if (r !== run) return;
  const item = queue.shift();
  if (!item) {
    busy = false;
    return;
  }
  const line = item.text;
  const buf = await clipFor(line).catch(() => null);
  if (r !== run) return;
  if (!buf) {
    fallback(line, () => next(r));
    return;
  }
  const src = ensure().createBufferSource();
  src.buffer = buf;
  src.connect(voiceOut());
  src.onended = () => {
    if (source === src) source = null;
    if (r === run) setTimeout(() => next(r), GAP);
  };
  source = src;
  src.start();
}

export function say(lines, { delay = 350 } = {}) {
  stop();
  const r = run;
  queue = lines.map((text) => ({ text, drop: false }));
  busy = true;
  for (const line of lines) clipFor(line).catch(() => {});
  startTimer = setTimeout(() => next(r), delay);
}

export function speak(text, opts) {
  say([text], opts);
}

export function after(text, { max = Infinity } = {}) {
  if (!busy) return say([text]);
  // only lines added with a cap make way, oldest first (a quick count skips ahead, its prompt stays)
  for (let waiting = queue.filter((q) => q.drop); waiting.length >= max; waiting.shift()) {
    queue.splice(queue.indexOf(waiting[0]), 1);
  }
  queue.push({ text, drop: max !== Infinity });
  clipFor(text).catch(() => {});
}

export function hush() {
  stop();
}

function stop() {
  run++;
  clearTimeout(startTimer);
  queue = [];
  busy = false;
  if (source) {
    source.onended = null;
    try { source.stop(); } catch (_) {}
    source = null;
  }
  // cancel() on an IDLE synthesizer is a known iOS wedge (speaking gets
  // stuck true forever), so only cancel when something is actually queued
  if (speechBusy()) window.speechSynthesis.cancel();
}

// The fallback: one line in the iPad's built-in voice, then carry on.
let utterance = null; // Safari collects unreferenced utterances mid-speech
function fallback(line, done) {
  if (!("speechSynthesis" in window)) return done();
  const u = new SpeechSynthesisUtterance(line);
  u.rate = 0.95;
  u.pitch = 1.1;
  u.lang = "en-US";
  u.onend = u.onerror = () => {
    // hand the audio session back to WebAudio (iOS)
    if (ctx && ctx.state !== "running") ctx.resume().catch(() => {});
    done();
  };
  utterance = u;
  window.speechSynthesis.speak(u);
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
  const under = source ? 0.45 : 1; // softer while the narrator talks
  if (f) tone(f, { type: "sine", dur: 0.5, gain: 0.05 * under });
  if (musicStep % 8 === 0) tone(N.C3, { type: "sine", dur: 1.4, gain: 0.04 * under });
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
