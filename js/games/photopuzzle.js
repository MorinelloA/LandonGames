/* ===== Picture Puzzle: the puzzle engine running on family photos =====
   Photos live in the site's own /photos folder, so they deploy with the
   site and show up on every device. Two ways to add them:
   1. Name them 1.jpg, 2.jpg, 3.jpg ... and drop them in /photos (easiest)
   2. Or keep a /photos/manifest.json listing any filenames you like
*/
App.games.photopuzzle = (() => {
  const pickerEl = document.getElementById("photo-picker");
  const thumbsEl = document.getElementById("photo-thumbs");
  const emptyEl = document.getElementById("photo-empty");
  const wrapEl = document.getElementById("photo-wrap");
  const backBtn = document.getElementById("photo-back");

  const core = PuzzleCore.create({
    boardEl: document.getElementById("photo-board"),
    trayEl: document.getElementById("photo-tray"),
    levelEl: document.getElementById("photo-level"),
    storageKey: "landon-photo-level",
    onComplete: () => showPicker(), // back to the photo gallery after each win
  });

  let photoList = null; // discovered once per page load

  async function discover() {
    if (photoList) return photoList;
    // a manifest wins if present...
    try {
      const r = await fetch("photos/manifest.json", { cache: "no-cache" });
      if (r.ok) {
        const names = await r.json();
        photoList = names.map((f) => "photos/" + f);
        return photoList;
      }
    } catch (_) {}
    // ...otherwise look for numbered files (1.jpg, 2.jpg, ...) and stop at
    // the first missing number, so we don't probe for photos that aren't there
    const exts = ["jpg", "jpeg", "png", "webp", "gif"];
    const found = [];
    for (let i = 1; i <= 30; i++) {
      const hits = await Promise.all(exts.map((e) =>
        fetch(`photos/${i}.${e}`, { method: "HEAD" }).then((r) => (r.ok ? `photos/${i}.${e}` : null)).catch(() => null)
      ));
      const hit = hits.find(Boolean);
      if (!hit) break;
      found.push(hit);
    }
    photoList = found;
    return photoList;
  }

  // photos aren't square — crop the middle into a square for the board
  function squareUrl(url) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(img.naturalWidth, img.naturalHeight);
        const c = document.createElement("canvas");
        c.width = c.height = 900;
        c.getContext("2d").drawImage(
          img,
          (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s,
          0, 0, 900, 900
        );
        res(c.toDataURL("image/jpeg", 0.9));
      };
      img.onerror = rej;
      img.src = url;
    });
  }

  async function showPicker() {
    wrapEl.classList.add("hidden");
    backBtn.classList.add("hidden");
    pickerEl.classList.remove("hidden");
    const photos = await discover();
    thumbsEl.innerHTML = "";
    emptyEl.classList.toggle("hidden", photos.length > 0);
    photos.forEach((url) => {
      const thumb = document.createElement("div");
      thumb.className = "photo-thumb";
      thumb.style.backgroundImage = `url(${url})`;
      thumb.addEventListener("click", () => startPuzzle(url));
      thumbsEl.appendChild(thumb);
    });
  }

  async function startPuzzle(url) {
    Sound.click();
    pickerEl.classList.add("hidden");
    wrapEl.classList.remove("hidden");
    backBtn.classList.remove("hidden");
    core.build(await squareUrl(url));
  }

  backBtn.addEventListener("click", () => {
    Sound.click();
    showPicker();
  });

  return {
    start() {
      core.running = true;
      core.renderLevel();
      showPicker();
    },
    stop() {
      core.running = false;
    },
    hint() {
      if (pickerEl.classList.contains("hidden")) core.hint();
      else Sound.speak("Pick a photo!");
    },
  };
})();
