# Landon's Game Room

A website of educational games designed for an iPad. Everything is plain HTML/CSS/JavaScript —
no build step, no dependencies, and all sounds are generated in the browser (no audio files).

## The games

| Game | What it teaches |
|---|---|
| 🫧 Math Bubbles | Addition, subtraction & (at high levels) multiplication — drag the answer bubble into the equation. Levels 1–6 adapt automatically: four right in a row levels up, two misses in a row levels down. |
| 🔤 Word Builder | Spelling & reading — drag letters into their slots; the iPad speaks each word aloud. Levels 1–7 adapt: words grow from 3 to 6 letters and decoy letters appear; three perfect words levels up, a struggle levels down. |
| 🐾 Animal Match | Memory & focus — classic pairs game; each animal says its name when flipped |
| 🐱 Copy Cat | Working memory & attention — repeat the growing sound-and-light pattern (forgiving: mistakes just replay the pattern, never "game over") |
| 🐟 Counting Time | Counting & numbers — drag each item into the basket to count it out loud, then pick the total |
| 🎹 Music Maker | Music & pattern following — free-play xylophone plus follow-the-glowing-bar songs |
| 🧩 Puzzle Builder | Spatial reasoning — drag puzzle pieces to rebuild a busy emoji scene. The grid grows 2×2 → 6×6 after clean solves and shrinks back after hard ones. No freeze on wrong drops: puzzling is trial and error. |
| 🖼️ Picture Puzzle | Same puzzle game, but the pictures are your own family photos from the site's `photos/` folder (see below) — same photos on every device. |
| 🧀 Cheese Maze | Planning & problem solving — drag the mouse through the maze to the cheese. Each win unlocks a bigger maze (6 levels). |
| 🗂️ Sort It! | *IEP speech goal* — identify vocabulary by **feature** ("which one is cold?"), **function** ("which one cuts?"), and **class** ("find the animal") from a field of 3, spoken aloud; drag the right one into the bin. |
| 😊 Feelings | *IEP ELA goal* — hear a little story ("The boy dropped his ice cream"), then drag the right feeling face onto the scene. Level 1 is happy/sad (field of 2); levels 2–3 add angry and scared (field of 3). |
| ✏️ Trace It | *IEP OT goals* — finger-trace capital letters (🔠 ABC), lowercase letters (🔡 abc), and numbers 0–9 (🔢 123) dot-to-dot in proper stroke order, plus a ✂️ Cut mode for dragging scissors along a wavy line. Never freezes — motor practice is trial and error. |

Tapping still works everywhere as a fallback, but dragging is the primary way to play.
Stars earned in every game accumulate in the top-right corner and are saved on the device,
along with each game's difficulty level.

**🖐️ Help button** — visible in every game. Tapping it speaks *"Help please"* out loud
(modeling his AAC 2-word requesting goal) and gives a genuine hint: the right bubble glows,
the next letter glows, the maze lights the next few steps, Copy Cat replays its pattern, etc.
Asking for help is always free — never a freeze, never a penalty — so requesting help is
consistently a better strategy than getting frustrated.

**Math Bubbles and the IEP** — levels 1–4 follow his math goal exactly (2 answer choices
with sums within 10, up to 3 choices with sums/differences within 20). Levels 5–6 stay
available above that as room to grow.

## Design notes

- **Sounds are the reward.** Correct answers earn pops, chimes, cheers, and spoken praise. Wrong answers earn *silence* and a quiet ~3-second freeze (a plain ⏳ overlay blocks all input) — a mild inconvenience with zero entertainment value, then play resumes exactly where it was. There is never a buzzer, a game over, or time pressure.
  - Exception: flipping non-matching pairs in Animal Match doesn't freeze (that's how a memory game is played, not a mistake) — it's just a silent flip-back.
- Big touch targets, high contrast, calm pastel palette, no flashing effects.
- Respects the iPad's "Reduce Motion" accessibility setting.
- The 🎵 button in the top-right toggles gentle background music (off by default).

## Adding family photos for Picture Puzzle

Put photos in the `photos/` folder named `1.jpg`, `2.jpg`, `3.jpg`, … (up to 30 —
`.png`, `.jpeg`, `.webp`, `.gif` also work), then re-upload the site. The game finds
them automatically on every device. Photos are cropped to a centered square, so keep
faces near the middle. To use your own filenames instead, list them in
`photos/manifest.json` — see `photos/README.txt` for details.

## Putting it on the iPad

The easiest free option is **Netlify Drop**:

1. Go to https://app.netlify.com/drop
2. Drag the whole `LandonGames` folder onto the page
3. It gives you a link — open that link in Safari on the iPad

Then on the iPad, make it feel like a real app:

1. Open the link in Safari
2. Tap the Share button → **Add to Home Screen**
3. It gets its own icon (the gold star) and opens full-screen with no browser bars

(GitHub Pages works just as well if you prefer: push this folder to a repo and enable Pages.)

## The app icon

The home screen icon lives in `icons/` and is already committed — nothing to do
unless you want to change how it looks. iOS caches it hard, so if you ever swap it,
delete the home screen shortcut and re-add it to see the new one.

To change the art, edit the palette constants at the top of `tools/make-icons.py`
and re-run it (needs `pip install pillow numpy` — the site itself still has no
dependencies), then commit the regenerated PNGs:

```bash
python tools/make-icons.py --preview
```

`--preview` also writes `tools/preview.png`, showing the icon at every size with
iOS's rounded-square mask applied.

## Testing on a computer

Any static file server works, e.g.:

```bash
python -m http.server 8642
```

Then open http://localhost:8642
