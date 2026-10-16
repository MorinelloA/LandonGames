# Landon's Game Room

Twelve games for an iPad, each tied to one of Landon's IEP goals. It's plain HTML, CSS and JavaScript modules with no build step. All sound is synthesized in the browser, every picture is drawn in code or vendored, and it plays offline once installed to the Home Screen. It lives at <https://landonarcher.com/games/>.

## The games

| Game | What it teaches |
|---|---|
| Math Bubbles | Addition, subtraction and, at the top level, multiplication: drag the bubble with the answer into the sum, under the sea. Levels 1 to 4 follow the IEP math goal (2 answer choices with sums within 10, up to 3 choices within 20); 5 and 6 are room to grow. Four right in a row levels up, two misses ease back down. |
| Word Builder | Spelling and reading: drag the letter blocks into the slots; the iPad says the word. Words grow from 3 to 6 letters, and decoy letters join at the top levels. |
| Animal Match | Memory: the pairs game; each animal says its name when flipped. |
| Copy Cat | Working memory: the cat plays a growing pattern on four pads (each its own colour and shape), then it's his turn. A mistake just replays the pattern. |
| Counting Time | Counting: drag each thing into the basket to count it aloud, then pick how many. The numbers appear once everything is counted. |
| Music Maker | Music: a xylophone to play freely, plus follow-the-glowing-bar songs. |
| Puzzle Builder | Spatial reasoning: a jigsaw of a busy scene. The grid grows from 2x2 to 6x6 after clean solves and shrinks after hard ones. |
| Picture Puzzle | The same jigsaw on family photos, picked from a photo wall (see "Family photos"). |
| Cheese Maze | Planning: drag the mouse through the garden maze to the cheese. Each win unlocks a bigger maze. |
| Sort It! | IEP speech goal: find things by class ("Find the animal"), function ("Which one cuts?") and feature ("Which one is cold?") from a field of 3, spoken aloud, and drag the right one into the bin. No wrong choice is ever also right. |
| Feelings | IEP ELA goal: hear a little story, see it drawn with the character's face neutral, and drag the face that shows how they feel onto the story. Level 1 is happy or sad; level 2 adds angry, level 3 adds scared. |
| Trace It | IEP OT goals: trace capitals, little letters and numbers dot to dot in school stroke order on handwriting lines, or cut along a wavy line. |

Stars earned in every game add up in the top-right corner. Stars and each game's level are saved on the device.

## Design notes

- **Sounds are the reward.** Right answers earn pops, chimes and spoken praise. Wrong answers earn silence and a quiet three-second pause (a still hourglass); there's never a buzzer, a game over or time pressure. Puzzles, tracing and Animal Match never pause: trial and error is how they're played.
- **Help** is in every game. It says "Help please" out loud (modelling his AAC two-word request), and the game gives a real hint while the cat points to it. Asking is never penalized.
- **The cat** waves on the menu, cheers right answers and points during hints. It never reacts to a mistake.
- **Calm and clear:** big touch targets, warm flat colours, no flashing. Reduce Motion turns off the confetti, bobbing and flying star.
- Drag is the main way to play; tapping works too.
- The music button in the top-right plays gentle background music (off by default).

## Run it

Any static server works, but `tools/devserver.py` sends no-cache headers (so edits show on reload) and the right types for JavaScript modules:

```bash
python tools/devserver.py 8642
```

Then open <http://localhost:8642/>. To try it on an iPad on the same network, add `--lan` and open the address it prints. Offline play only runs on the real site, or locally with `?sw` (unregister it afterwards, or it will keep serving the old files).

## Test it

Node 22 or later; nothing to install.

```bash
node --test "tests/**/*.test.mjs"
```

The tests check the games' rules against the IEP levels (math ranges, one right answer in Sort It, Feelings stories, maze and tracing data, jigsaw cuts), that every picture is well-formed SVG, that the CSS colours match `js/art/theme.js`, that no emoji are left in the page or code, and that everything ships: the service worker's file list, the page's links and the photo sizes.

Type checks run in editors through `jsconfig.json`, capped at ES2021 so APIs newer than Safari 15 show up as errors. From the command line:

```bash
npx -p typescript tsc -p jsconfig.json
```

`tools/art-sheet.html` shows every piece of art on one page: the cat, every face and pose, the places, the 24 Feelings scenes, the menu cards, bins and pads, and the app icon. `tools/content-sheet.html` lists everything the games ask and what counts as right, for a teacher or therapist to check: Sort It's prompts, the Feelings stories, the word and math levels, Counting's themes and Trace It's stroke order. Open either through the dev server (for example <http://localhost:8642/tools/content-sheet.html>); to share the content sheet, print it or save it as a PDF. `docs/ipad-checklist.md` lists what only a real iPad can show.

## Deploy it

1. Restamp the service worker. It keeps every file under a version made from their contents, so any change gets installed fresh:

   ```bash
   node tools/stamp-sw.mjs
   ```

   `node tools/stamp-sw.mjs --check` fails if you forgot, and so does the ship test.

2. Commit. The site build copies this folder as it is, so uncommitted changes would be published too (the build warns when there are any).

3. Publish from `C:\Repos\LandonArcher\cloudflare` with `npm run deploy`. Its `build.mjs` copies `index.html`, `sw.js`, `manifest.webmanifest` and the `css`, `js`, `fonts`, `vendor`, `icons` and `photos` folders to `/games/`, checks the stamp, and asks search engines not to index the photos. Then run `check-site.ps1` there.

The minimum is iPadOS 15 (Safari 15). Games lay out on a 1133 x 640 stage (iPad mini landscape, under the top bar), scaled to fit any screen.

## Family photos

1. Put the original photos in `photos-src/` (any names; `.jpg`, `.png`, `.webp` and iPhone `.heic` all work). That folder is git-ignored, so the originals never reach the site or the repo.
2. Double-click `tools/photos.bat` (or run `python tools/photos.py`). It needs Pillow, plus `pillow-heif` for HEIC: `pip install pillow pillow-heif`.
3. Restamp, commit and publish as above.

The tool writes small JPEGs (longest side 1600 px, no location or camera data), 320 px thumbnails for the photo wall, and `photos/manifest.json`. Each puzzle is a square cut from the photo: the middle of landscape photos, a little above the middle of portrait ones. If a square misses someone's face, list the photo in `tools/photo-focus.json` with where the square should centre (x and y as fractions, for example `"IMG_8210": [0.5, 0.59]`) and run the tool again.

The photos can be opened by anyone who knows their address (they're kept out of search results), so only add ones you're happy to have on the web.

## How it fits together

| Path | What's there |
|---|---|
| `js/main.js` | starts the app and registers the service worker |
| `js/core/` | the shell: navigation, the stage, sound and speech, drag and drop, stars and celebrations, the quiet pause, per-visit timers, levels, the cat in the corner |
| `js/logic/` | each game's rules and data, with no DOM, so the tests can run them |
| `js/games/` | one controller per game; `registry.js` lists them in menu order |
| `js/art/` | the storybook look, drawn as SVG in code: `theme.js` (colours), `people.js` (the story characters), `mascot.js` (the cat), `backdrops.js` (places), `scenes.js` (the Feelings stories), `cards.js` (menu cards), `gameart.js`, `props.js`, `jigsaw.js`, `ui.js` (interface icons), `icons.js` (the vocabulary pictures) |
| `vendor/fluent-emoji-flat/` | the vocabulary pictures, copied by `tools/vendor-icons.mjs` |
| `fonts/` | Fredoka |
| `css/style.css` | the page's styles; its colours mirror `js/art/theme.js` |
| `sw.js`, `tools/stamp-sw.mjs` | offline play |
| `tools/photos.py` | the photo pipeline |
| `tools/app-icon.js`, `tools/make-icons.py` | the Home Screen icon |

The vocabulary pictures are Microsoft's Fluent Emoji in the Flat style. To add one, give it a name and its emoji in `js/art/icons.js`, then copy it in from a local checkout of [fluentui-emoji](https://github.com/microsoft/fluentui-emoji) (the steps are at the top of the tool):

```bash
node tools/vendor-icons.mjs <path to the fluentui-emoji checkout>
```

`node tools/vendor-icons.mjs --check` confirms every icon in the table is there.

## The app icon

The Home Screen icon is the cat's face under the menu's bunting, on the menu's wall. `tools/app-icon.js` draws it from the game's own art, and `tools/make-icons.py` renders it into `icons/` at every size `index.html` and `manifest.webmanifest` use: 180, 192 and 512 px, a maskable 512 for Android, and a 32 px browser-tab icon of the face alone. To change it, edit `tools/app-icon.js`, run the script (needs `pip install playwright pillow` and `python -m playwright install chromium`), then restamp, commit the PNGs and publish:

```bash
python tools/make-icons.py --preview
```

`--preview` also writes `tools/preview.png` (not committed): the icon at Home Screen size on a light and a dark wallpaper. The art sheet shows it too.

iOS caches the icon hard: delete the Home Screen shortcut and add it again to see a new one.

## Notes for tonyt908.com

The screenshots and walkthrough video of the game on tonyt908.com come from `tools/capture_screens.py` and `tools/record_walkthroughs.py` in `C:\Repos\tonyt908`, run against this repo's dev server on port 8642. They find their way through the game by the things below, so renaming or reshaping one breaks them with no error here; change those tools along with it.

- The service worker stays off on 127.0.0.1 (`js/main.js`), so the tools always get the files on disk.
- Menu: `.game-card[data-game=…]`, and `#home-btn` to go back to it.
- Copy Cat: `#simon-start`; the four `.simon-pad` buttons, in pad order, have the `lit` class while lit; `#title-badge` reads "Pattern N"; `#simon-says` starts with "Your turn!" when the player's turn comes. The screenshot is timed to the first pad, which lights 700 ms after Start.
- Math Bubbles: `#math-problem` holds the two numbers, the sign (+, − or ×) and a "?" until it's answered; `.bubble[data-value]`, where tapping a bubble answers; `#math-drop`.
- Cheese Maze: `#maze-board`, whose inline width is the board's and whose paths sit inside a 14 px frame (`PAD` in `js/games/maze.js`); its walls stay the first `<path>` in its SVG, with `M x y H…` for a cell's top wall and `M x y V…` for its left wall; `#title-badge` reads "Level N"; `SIZES` and `solve` exported from `js/logic/maze.js`.
- Feelings: `STORIES` exported from `js/logic/feelings.js`; `#feel-sentence` shows a story's `text` exactly; `.face-card[data-feeling=…]`; `#feel-drop`.

## Licences

The vocabulary pictures are Fluent Emoji, © Microsoft, MIT licence (`vendor/fluent-emoji-flat/LICENSE`). Fredoka is under the SIL Open Font License (`fonts/OFL.txt`).
