// The Game Room's narrator: every line the game says, recorded once with
// ElevenLabs and shipped as small MP3 clips that js/core/sound.js plays
// through Web Audio. The browser's speech synthesis is only a fallback.
//
//   node tools/voice.mjs list                   every line, and the character total (free)
//   node tools/voice.mjs voices                 the account's voices, to pick candidates (free)
//   node tools/voice.mjs audition <id> [<id>…]  the audition lines in each voice: .voice-cache/audition.html
//   node tools/voice.mjs build                  record any missing clip into voice/ and voice/manifest.json
//   node tools/voice.mjs check                  exit 1 if a line has no clip, or a clip no line (free)
//   node tools/voice.mjs transcribe             speech-to-text of every clip; lists any that don't say their line
//   node tools/voice.mjs retake                 new takes of those until one is heard right (then build again)
//
// The voice, model and settings live in tools/voice.json. The API key comes
// from $ELEVENLABS_API_KEY, else from the Off-Ramp pipeline's config
// (C:\Repos\off-ramp\pipeline\config.json, secrets.elevenlabs_api_key), the
// account the code-sys video used too. It is never printed or written down.
// Every paid request is cached in .voice-cache/ by a hash of the request and
// logged to .voice-cache/ledger.jsonl, so a rerun only pays for new or
// changed lines. Needs ffmpeg on the PATH.

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, appendFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = path.join(ROOT, 'tools', 'voice.json');
const CACHE = path.join(ROOT, '.voice-cache');
const OUT = path.join(ROOT, 'voice');
const MANIFEST = path.join(OUT, 'manifest.json');
const OFFRAMP_CONFIG = 'C:\\Repos\\off-ramp\\pipeline\\config.json';
const API = 'https://api.elevenlabs.io';

// How a raw take becomes a shipped clip: silence trimmed at both ends (so a
// story runs straight into its question), then one gain that brings the clip
// to the same loudness as every other (-16 LUFS), a limiter against peaks,
// mono at 64 kbps. Bump the version when the chain changes, so clips remake.
const FINISH = 'v2';
const TRIM = [
  'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.03',
  'areverse',
  'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.06',
  'areverse',
].join(',');
const TARGET = -16; // LUFS; for clips too short to gate, the same figure as mean level in dB

// Real lines from the games, covering each kind: a request, a story and its
// question, praise, counting, a word, a lone letter, a prompt.
const AUDITION = [
  'Help please',
  "The girl's balloon flew away.",
  'How does she feel?',
  "happy! That's right!",
  'Count the apples!',
  '1', '2', '3',
  'How many?',
  "3! That's right!",
  'rabbit',
  'rabbit! Great job!',
  'Trace the little letter a',
  "a! Nice tracing!",
  'Which one do you use to cut?',
  'You found the cheese! Great job!',
];

const config = () => JSON.parse(readFileSync(CONFIG, 'utf8'));
const sha = (value) => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');

function apiKey() {
  let key = (process.env.ELEVENLABS_API_KEY || '').trim();
  if (!key && existsSync(OFFRAMP_CONFIG)) {
    key = ((JSON.parse(readFileSync(OFFRAMP_CONFIG, 'utf8')).secrets || {}).elevenlabs_api_key || '').trim();
  }
  if (!key) throw new Error('No ElevenLabs key: set ELEVENLABS_API_KEY, or fill the Off-Ramp config secrets block.');
  return key;
}

function ledger(entry) {
  mkdirSync(CACHE, { recursive: true });
  appendFileSync(path.join(CACHE, 'ledger.jsonl'), JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n');
}

// One API call, retried on rate limits and server errors (as eleven.py does).
async function call(method, route, { query, json, form } = {}) {
  const url = new URL(API + route);
  for (const [k, v] of Object.entries(query || {})) url.searchParams.set(k, v);
  let last;
  for (let attempt = 0; attempt < 4; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        method,
        headers: { 'xi-api-key': apiKey(), ...(json ? { 'content-type': 'application/json' } : {}) },
        body: json ? JSON.stringify(json) : form,
      });
    } catch (err) {
      last = err;
    }
    if (res && res.ok) return res;
    if (res && ![429, 500, 502, 503, 504].includes(res.status)) {
      throw new Error(`${route} -> ${res.status}: ${(await res.text()).slice(0, 400)}`);
    }
    if (res) last = new Error(`${route} -> ${res.status}`);
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  throw new Error(`${route} failed after retries: ${last}`);
}

const UNDER_TWENTY = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
// zero to thirty: Counting goes to 10, Math Bubbles' problems to 30
const NUMBER_WORDS = [...UNDER_TWENTY, 'twenty', ...UNDER_TWENTY.slice(1, 10).map((w) => 'twenty-' + w), 'thirty'];
const NUMBER = /\b(30|[12][0-9]|[0-9])\b/g;
// Capitals that, alone before "! Nice tracing!", read as a word ("H!" as
// "Sh", "K!" as "Okay"), found by `transcribe`: sent spelled as said.
const LETTER_SAID = { A: 'Ay', H: 'Aitch', I: 'Eye', K: 'Kay', N: 'En', R: 'Ar', W: 'Double-you', Y: 'Why' };

// What the voice reads, when it isn't just the line. tools/voice.json can
// override any line ("spoken").
// - A lone lowercase letter reads as a word ("a" as "uh"), so it's sent as
//   a capital, which reads as the letter's name.
// - Numbers go as words: a bare "9" can come out as a mumble, and a
//   counted number on its own gets a full stop to say it plainly.
export function spokenForm(line, overrides = {}) {
  if (overrides[line]) return overrides[line];
  let s = line.replace(/(^|letter )([a-z])(?=!|$)/, (_, before, ch) => before + ch.toUpperCase());
  s = s.replace(/^([A-Z])(?=! Nice tracing!$)/, (ch) => LETTER_SAID[ch] || ch);
  s = s.replace(NUMBER, (n, _, at) => {
    const word = NUMBER_WORDS[Number(n)];
    return at === 0 ? word[0].toUpperCase() + word.slice(1) : word;
  });
  if (NUMBER_WORDS.includes(s.toLowerCase())) s += '.';
  return s;
}

function voiceFor(line, cfg) {
  return line === 'Help please' && cfg.help ? cfg.help : cfg.narrator;
}

// The request for one line, and the key it's cached and named by.
function request(line, voiceId, cfg) {
  const body = {
    text: spokenForm(line, cfg.spoken),
    model_id: cfg.model,
    voice_settings: cfg.settings,
    seed: cfg.seed + ((cfg.retakes || {})[line] || 0),
  };
  return { body, key: sha({ voiceId, format: cfg.format, body }).slice(0, 24) };
}

async function rawTake(line, voiceId, cfg) {
  const { body, key } = request(line, voiceId, cfg);
  const file = path.join(CACHE, 'tts', key + '.mp3');
  if (existsSync(file)) return { file, key, cached: true };
  const res = await call('POST', `/v1/text-to-speech/${voiceId}`, { query: { output_format: cfg.format }, json: body });
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  ledger({ kind: 'tts', voice: voiceId, chars: body.text.length, key });
  return { file, key, cached: false };
}

function ffmpeg(args) {
  const run = spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...args], { encoding: 'utf8' });
  if (run.status !== 0) throw new Error(`ffmpeg ${args.join(' ')}: ${run.stderr || run.error}`);
  return run.stderr;
}

// The clip's loudness. Integrated loudness gates out clips under about half a
// second (a lone "1" reads as -70 LUFS), so those fall back to mean level.
function loudness(wav) {
  const i = Number((ffmpeg(['-i', wav, '-af', 'ebur128=framelog=quiet', '-f', 'null', '-'])
    .match(/I:\s*(-?[\d.]+) LUFS/) || [])[1]);
  if (i > -50) return i;
  return Number((ffmpeg(['-i', wav, '-af', 'volumedetect', '-f', 'null', '-']).match(/mean_volume: (-?[\d.]+) dB/) || [])[1]);
}

function finish(rawFile, outFile) {
  mkdirSync(path.dirname(outFile), { recursive: true });
  const wav = outFile.replace(/\.mp3$/, '.wav');
  ffmpeg(['-loglevel', 'error', '-y', '-i', rawFile, '-af', TRIM, '-ac', '1', '-ar', '44100', wav]);
  const gain = Math.max(-12, Math.min(12, TARGET - loudness(wav)));
  ffmpeg(['-loglevel', 'error', '-y', '-i', wav, '-af', `volume=${gain.toFixed(2)}dB,alimiter=limit=0.84:level=false`,
    '-ac', '1', '-ar', '44100', '-b:a', '64k', outFile]);
  rmSync(wav);
}

// A finished clip for one line, in the voice its config says (or `voiceId`).
async function clip(line, cfg, voiceId = voiceFor(line, cfg).id) {
  const take = await rawTake(line, voiceId, cfg);
  const name = sha(take.key + FINISH).slice(0, 12) + '.mp3';
  const finished = path.join(CACHE, 'finished', name);
  if (!existsSync(finished)) finish(take.file, finished);
  return { name, file: finished, cached: take.cached };
}

async function lines() {
  const { allLines } = await import(pathToFileURL(path.join(ROOT, 'js', 'logic', 'lines.js')).href);
  return allLines();
}

// ---- commands ----

async function cmdList() {
  const all = await lines();
  for (const line of all) console.log(line);
  console.log(`\n${all.length} lines, ${all.reduce((n, l) => n + l.length, 0)} characters`);
}

async function cmdVoices() {
  const res = await call('GET', '/v1/voices');
  const { voices } = await res.json();
  for (const v of voices) {
    const labels = Object.entries(v.labels || {}).map(([k, val]) => `${k}: ${val}`).join(', ');
    console.log(`${v.voice_id}  ${v.name}  [${v.category}]  ${labels}`);
    if (v.description) console.log(`    ${v.description.replace(/\s+/g, ' ').slice(0, 160)}`);
  }
}

async function cmdAudition(ids) {
  if (!ids.length) throw new Error('usage: node tools/voice.mjs audition <voice id> [<voice id> …]');
  const cfg = config();
  const sections = [];
  let chars = 0;
  for (const id of ids) {
    const info = await (await call('GET', `/v1/voices/${id}`)).json();
    const cells = [];
    for (const line of AUDITION) {
      const c = await clip(line, cfg, id);
      if (!c.cached) chars += spokenForm(line, cfg.spoken).length;
      cells.push({ line, data: readFileSync(c.file).toString('base64') });
    }
    const labels = Object.values(info.labels || {}).join(' · ');
    sections.push({ id, name: info.name, labels, cells });
    console.log(`${info.name} (${id}): ${AUDITION.length} lines`);
  }
  writeFileSync(path.join(CACHE, 'audition.html'), auditionPage(sections, cfg));
  console.log(`\n${chars} characters billed this run; page: ${path.join(CACHE, 'audition.html')}`);
}

function auditionPage(sections, cfg) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const voiceBlocks = sections.map((s, i) => `
  <section>
    <h2><span class="n">${i + 1}</span> ${esc(s.name)}</h2>
    <p class="labels">${esc(s.labels)}</p>
    <button class="all" data-voice="${i}">Play all</button>
    <ol>${s.cells.map((c, j) => `
      <li><button data-voice="${i}" data-line="${j}" aria-label="Play">▶</button><span>${esc(c.line)}</span>
        <audio preload="auto" src="data:audio/mpeg;base64,${c.data}"></audio></li>`).join('')}
    </ol>
  </section>`).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Game Room voice audition</title>
<style>
  :root { color-scheme: light; --paper: #FFF6E9; --ink: #4A3426; --soft: #7C6352; --line: #E8D2B6; }
  body { margin: 0; padding: 24px 16px 48px; background: var(--paper); color: var(--ink); font: 16px/1.45 system-ui, sans-serif; }
  h1 { font-size: 1.5rem; margin: 0 0 4px; } .lead { color: var(--soft); margin: 0 0 20px; max-width: 60ch; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
  section { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 14px 16px; }
  h2 { font-size: 1.15rem; margin: 0; display: flex; gap: 8px; align-items: center; }
  .n { display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--ink); color: var(--paper); font-size: .85rem; }
  .labels { color: var(--soft); font-size: .85rem; margin: 2px 0 10px; }
  ol { list-style: none; padding: 0; margin: 10px 0 0; } li { display: flex; gap: 10px; align-items: center; padding: 3px 0; }
  button { font: inherit; border: 1px solid var(--line); background: var(--paper); color: var(--ink); border-radius: 999px; cursor: pointer; min-height: 32px; }
  li button { width: 32px; flex: none; } .all { padding: 4px 14px; font-weight: 600; } .playing { background: var(--ink); color: var(--paper); }
</style></head><body>
<h1>Game Room voice audition</h1>
<p class="lead">The same real lines from the games in each voice, finished the way they'll ship (trimmed, evened out, mono 64 kbps). Model ${esc(cfg.model)}, speed ${cfg.settings.speed}. "Play all" runs a voice's lines in order with a short gap, close to how the game strings them together.</p>
<div class="grid">${voiceBlocks}</div>
<script>
  let stop = null;
  function play(audio, btn) { return new Promise((done) => { audio.currentTime = 0; btn && btn.classList.add('playing');
    audio.onended = () => { btn && btn.classList.remove('playing'); done(); }; audio.play().catch(done); }); }
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    document.querySelectorAll('audio').forEach((a) => a.pause()); document.querySelectorAll('.playing').forEach((b) => b.classList.remove('playing'));
    const run = {}; stop = run;
    const section = document.querySelectorAll('section')[btn.dataset.voice];
    if (btn.classList.contains('all')) {
      for (const li of section.querySelectorAll('li')) { if (stop !== run) return; await play(li.querySelector('audio'), li.querySelector('button')); await new Promise((r) => setTimeout(r, 350)); }
    } else { const li = btn.closest('li'); await play(li.querySelector('audio'), btn); }
  });
</script></body></html>`;
}

async function cmdBuild() {
  const cfg = config();
  const all = await lines();
  const manifest = { voice: cfg.narrator, help: cfg.help || cfg.narrator, model: cfg.model, settings: cfg.settings,
    finish: FINISH, lines: {} };
  let made = 0, chars = 0;
  for (const line of all) {
    const c = await clip(line, cfg);
    if (!c.cached) { made++; chars += spokenForm(line, cfg.spoken).length; }
    manifest.lines[line] = c.name;
    const dest = path.join(OUT, c.name);
    if (!existsSync(dest)) { mkdirSync(OUT, { recursive: true }); writeFileSync(dest, readFileSync(c.file)); }
  }
  const keep = new Set(Object.values(manifest.lines));
  for (const f of existsSync(OUT) ? readdirSync(OUT) : []) {
    if (f.endsWith('.mp3') && !keep.has(f)) rmSync(path.join(OUT, f));
  }
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + '\n');
  console.log(`${all.length} lines, ${keep.size} clips; ${made} recorded now (${chars} characters billed)`);
}

// Every line has a clip on disk, and every clip is a current line.
export function problems(all, manifest, dir = OUT) {
  const out = [];
  const listed = manifest ? manifest.lines : {};
  for (const line of all) {
    if (!listed[line]) out.push(`no clip: ${line}`);
    else if (!existsSync(path.join(dir, listed[line]))) out.push(`missing file ${listed[line]}: ${line}`);
  }
  const current = new Set(all);
  for (const line of Object.keys(listed)) if (!current.has(line)) out.push(`clip for a line the game no longer says: ${line}`);
  const used = new Set(Object.values(listed));
  for (const f of existsSync(dir) ? readdirSync(dir) : []) {
    if (f.endsWith('.mp3') && !used.has(f)) out.push(`unlisted file: voice/${f}`);
  }
  return out;
}

async function cmdCheck() {
  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : null;
  const found = problems(await lines(), manifest);
  for (const p of found) console.log(p);
  if (found.length) process.exit(1);
  console.log('voice: every line has its clip');
}

// Words a transcript may write for what the line says: letter names, and
// homophones a short clip can't tell apart ("sun" or "son").
const SAME = [
  ['a', 'ay', 'eh'], ['b', 'bee', 'be'], ['c', 'see', 'sea'], ['d', 'dee'], ['e', 'ee'], ['f', 'eff'], ['g', 'gee'],
  ['h', 'aitch'], ['i', 'eye', 'aye'], ['j', 'jay'], ['k', 'kay'], ['l', 'el', 'elle'], ['m', 'em'], ['n', 'en'],
  ['o', 'oh'], ['p', 'pee', 'pea'], ['q', 'cue', 'queue'], ['r', 'ar', 'are'], ['s', 'ess'], ['t', 'tee', 'tea'],
  ['u', 'you'], ['v', 'vee'], ['w', 'doubleyou'], ['x', 'ex'], ['y', 'why'], ['z', 'zee', 'zed'],
  ['sun', 'son'], ['whale', 'wales', 'wail'], ['bear', 'bare'], ['ant', 'aunt'], ['four', 'for'], ['two', 'to', 'too'],
  ['eight', 'ate'],
];
const canon = new Map(SAME.flatMap((group) => group.map((word) => [word, group[0]])));

// Lower case, numbers as words, no punctuation, homophones folded together.
function normal(text) {
  return text.toLowerCase().replace(NUMBER, (n) => NUMBER_WORDS[Number(n)])
    .replace(/double[\s-]?you/g, 'doubleyou')
    .replace(/[^a-z' ]+/g, ' ').replace(/'/g, '').trim().split(/\s+/)
    .map((word) => canon.get(word) || word).join(' ');
}

async function heardIn(name) {
  const cached = path.join(CACHE, 'stt', name.replace('.mp3', '.json'));
  if (existsSync(cached)) return JSON.parse(readFileSync(cached, 'utf8')).text || '';
  const form = new FormData();
  form.append('file', new Blob([readFileSync(path.join(CACHE, 'finished', name))], { type: 'audio/mpeg' }), name);
  form.append('model_id', 'scribe_v1');
  form.append('language_code', 'en');
  form.append('tag_audio_events', 'false');
  const result = await (await call('POST', '/v1/speech-to-text', { form })).json();
  mkdirSync(path.dirname(cached), { recursive: true });
  writeFileSync(cached, JSON.stringify(result));
  ledger({ kind: 'stt', clip: name });
  return result.text || '';
}

const saysIt = (line, heard, cfg) => normal(heard) === normal(spokenForm(line, cfg.spoken));

async function flaggedLines(cfg) {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const flagged = [];
  for (const [line, name] of Object.entries(manifest.lines)) {
    const heard = await heardIn(name);
    if (!saysIt(line, heard, cfg)) flagged.push({ line, heard });
  }
  return { flagged, total: Object.keys(manifest.lines).length };
}

async function cmdTranscribe() {
  const { flagged, total } = await flaggedLines(config());
  for (const f of flagged) console.log(`${f.line}  →  heard "${f.heard}"`);
  console.log(`\n${total} clips checked, ${flagged.length} to listen to`);
}

// Every clip speech-to-text doesn't hear as its line gets new takes (a new
// seed each) until one is heard right; the seed that worked goes into
// tools/voice.json ("retakes"). Then rebuild. Lines still wrong are listed.
async function cmdRetake() {
  const cfg = config();
  const { flagged } = await flaggedLines(cfg);
  const stuck = [];
  for (const { line, heard } of flagged) {
    let fixed = false;
    for (let offset = 1; offset <= 4 && !fixed; offset++) {
      cfg.retakes[line] = ((JSON.parse(readFileSync(CONFIG, 'utf8')).retakes || {})[line] || 0) + offset;
      const c = await clip(line, cfg);
      const now = await heardIn(c.name);
      fixed = saysIt(line, now, cfg);
      console.log(`${fixed ? 'fixed' : 'still'}  ${line}  →  heard "${now}" (seed +${cfg.retakes[line]})`);
    }
    if (!fixed) {
      stuck.push(`${line}  (first heard "${heard}")`);
      delete cfg.retakes[line];
    }
  }
  writeFileSync(CONFIG, JSON.stringify(cfg, null, 2) + '\n');
  if (stuck.length) console.log(`\nStill not heard right, to listen to:\n${stuck.join('\n')}`);
  console.log(`\n${flagged.length - stuck.length} of ${flagged.length} fixed; now run: node tools/voice.mjs build`);
}

const [cmd, ...rest] = process.argv.slice(2);
const commands = { list: cmdList, voices: cmdVoices, audition: () => cmdAudition(rest), build: cmdBuild, check: cmdCheck,
  transcribe: cmdTranscribe, retake: cmdRetake };
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!commands[cmd]) {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(0, 11).join('\n'));
    process.exit(cmd ? 1 : 0);
  }
  commands[cmd]().catch((err) => { console.error(String(err.message || err)); process.exit(1); });
}
