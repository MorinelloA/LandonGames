// Picture Puzzle: the puzzle engine running on family photos. The photos
// live in the site's own /photos folder, made by tools/photos.py from the
// originals in photos-src/ (see the README). photos/manifest.json lists
// each photo with a small square thumbnail and the point the puzzle's
// square is cropped around.
import * as Sound from "../core/sound.js";
import { createPuzzle } from "./puzzle-core.js";

const pickerEl = document.getElementById("photo-picker");
const thumbsEl = document.getElementById("photo-thumbs");
const emptyEl = document.getElementById("photo-empty");
const wrapEl = document.getElementById("photo-wrap");
const backBtn = document.getElementById("photo-back");

const puzzle = createPuzzle({
  boardEl: document.getElementById("photo-board"),
  trayEl: document.getElementById("photo-tray"),
  levelEl: document.getElementById("photo-level"),
  storageKey: "landon-photo-level",
  onComplete: () => showPicker(), // back to the photo gallery after each win
});

let photoList = null; // read once per page load

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

// the board is square: crop the photo's square around its focus point,
// the same square tools/photos.py used for the thumbnail
function squareUrl(photo) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight, s = Math.min(w, h);
      const left = Math.min(Math.max(photo.focus[0] * w - s / 2, 0), w - s);
      const top = Math.min(Math.max(photo.focus[1] * h - s / 2, 0), h - s);
      const c = document.createElement("canvas");
      c.width = c.height = 900;
      c.getContext("2d").drawImage(img, left, top, s, s, 0, 0, 900, 900);
      res(c.toDataURL("image/jpeg", 0.9));
      c.width = c.height = 0; // let iPad Safari reclaim the canvas now
    };
    img.onerror = rej;
    img.src = photo.src;
  });
}

async function showPicker() {
  wrapEl.classList.add("hidden");
  backBtn.classList.add("hidden");
  pickerEl.classList.remove("hidden");
  const photos = await discover();
  thumbsEl.innerHTML = "";
  emptyEl.classList.toggle("hidden", photos.length > 0);
  photos.forEach((photo) => {
    const thumb = document.createElement("button");
    thumb.className = "photo-thumb";
    const img = document.createElement("img");
    img.src = photo.thumb;
    img.alt = "";
    img.width = img.height = 160;
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
  wrapEl.classList.remove("hidden");
  backBtn.classList.remove("hidden");
  try {
    puzzle.build(await squareUrl(photo));
  } catch (_) {
    showPicker(); // the photo didn't load: back to the gallery
  }
}

backBtn.addEventListener("click", () => {
  Sound.click();
  showPicker();
});

export default {
  start() {
    puzzle.running = true;
    puzzle.renderLevel();
    showPicker();
  },
  stop() {
    puzzle.running = false;
  },
  hint() {
    if (pickerEl.classList.contains("hidden")) puzzle.hint();
    else Sound.speak("Pick a photo!");
  },
};
