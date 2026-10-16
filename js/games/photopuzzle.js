// Picture Puzzle: the jigsaw on family photos. The photos live in the
// site's own /photos folder, made by tools/photos.py from the originals in
// photos-src/ (see the README). photos/manifest.json lists each photo with
// a small square thumbnail and the point the puzzle's square is cut around.
// Pick a photo from the wall, then build it.
import * as Sound from "../core/sound.js";
import { createPuzzle, loadImage } from "./puzzle-core.js";
import { backdropSvg } from "../art/backdrops.js";

const screen = document.getElementById("screen-photopuzzle");
const pickerEl = document.getElementById("photo-picker");
const thumbsEl = document.getElementById("photo-thumbs");
const emptyEl = document.getElementById("photo-empty");
const backBtn = document.getElementById("photo-back");

const puzzle = createPuzzle({
  screenEl: screen,
  levelEl: document.getElementById("title-badge"),
  storageKey: "landon-photo-level",
  onComplete: () => showPicker(), // back to the photo wall after each win
});

let photoList = null; // read once per page load
let drawn = false;

// Version 2 manifests come from tools/photos.py; a plain array of file
// names (the old format) still works, minus thumbnails and focus points.
async function discover() {
  if (photoList) return photoList;
  try {
    const r = await fetch("photos/manifest.json", { cache: "no-cache" });
    const data = r.ok ? await r.json() : [];
    const entries = Array.isArray(data)
      ? data.map((f) => ({ src: f, thumb: f, focus: [0.5, 0.5] }))
      : data.photos || [];
    photoList = entries.map((e) => ({
      src: "photos/" + e.src,
      thumb: "photos/" + (e.thumb || e.src),
      focus: e.focus || [0.5, 0.5],
    }));
  } catch (_) {
    photoList = [];
  }
  return photoList;
}

// the photo's square around its focus point: the same square as its thumbnail
function drawPhoto(photo) {
  return async (ctx, S) => {
    const img = await loadImage(photo.src);
    const w = img.naturalWidth, h = img.naturalHeight, s = Math.min(w, h);
    const left = Math.min(Math.max(photo.focus[0] * w - s / 2, 0), w - s);
    const top = Math.min(Math.max(photo.focus[1] * h - s / 2, 0), h - s);
    ctx.drawImage(img, left, top, s, s, 0, 0, S, S);
  };
}

async function showPicker() {
  puzzle.clear();
  puzzle.show(false);
  backBtn.classList.add("hidden");
  pickerEl.classList.remove("hidden");
  const photos = await discover();
  thumbsEl.innerHTML = "";
  emptyEl.classList.toggle("hidden", photos.length > 0);
  photos.forEach((photo, i) => {
    const thumb = document.createElement("button");
    thumb.className = "photo-thumb";
    thumb.setAttribute("aria-label", "photo " + (i + 1));
    thumb.style.setProperty("--tilt", ((i * 37) % 9) - 4 + "deg"); // pinned up a little crooked
    const img = document.createElement("img");
    img.src = photo.thumb;
    img.alt = "";
    img.width = img.height = 138;
    img.decoding = "async";
    img.draggable = false;
    img.onerror = () => thumb.remove(); // a missing photo just isn't offered
    thumb.appendChild(img);
    thumb.addEventListener("click", () => startPuzzle(photo));
    thumbsEl.appendChild(thumb);
  });
}

async function startPuzzle(photo) {
  Sound.click();
  pickerEl.classList.add("hidden");
  backBtn.classList.remove("hidden");
  puzzle.show(true);
  try {
    await puzzle.build(drawPhoto(photo));
  } catch (_) {
    showPicker(); // the photo didn't load: back to the wall
  }
}

backBtn.addEventListener("click", () => {
  Sound.click();
  showPicker();
});

export default {
  start() {
    if (!drawn) {
      screen.querySelector(".backdrop").innerHTML = backdropSvg("living");
      drawn = true;
    }
    puzzle.running = true;
    puzzle.renderLevel();
    showPicker();
  },
  stop() {
    puzzle.running = false;
    puzzle.clear();
  },
  hint() {
    if (pickerEl.classList.contains("hidden")) puzzle.hint();
    else Sound.speak("Pick a photo!");
  },
};
