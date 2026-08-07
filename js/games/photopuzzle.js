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
    const exts = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "JPG", "HEIC"];
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

  /* ---- HEIC support ----
     iPhone photos come as .heic, which only Safari decodes natively.
     Everywhere else, lazy-load the vendored heic-to converter (libheif)
     and turn the photo into a JPEG blob the browser can show. Converted
     URLs are cached so each photo converts at most once per page load. */
  let heicLib = null;
  function loadHeicLib() {
    if (typeof HeicTo === "function") return Promise.resolve();
    if (!heicLib) {
      heicLib = new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = "js/lib/heic-to.js";
        s.onload = res;
        s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    return heicLib;
  }

  // conversions run one at a time — converting a whole gallery in parallel
  // overwhelms both the connection and the wasm decoder
  let convertChain = Promise.resolve();
  function convertHeic(url) {
    const job = convertChain.then(() =>
      loadHeicLib()
        .then(() => fetch(url))
        .then((r) => r.blob())
        .then((blob) => HeicTo({ blob, type: "image/jpeg", quality: 0.92 }))
        .then((out) => URL.createObjectURL(Array.isArray(out) ? out[0] : out))
    );
    convertChain = job.catch(() => {}); // a failed job must not stall the queue
    return job;
  }

  const heicCache = new Map();
  function displayableUrl(url) {
    if (!/\.hei[cf]$/i.test(url)) return Promise.resolve(url);
    if (!heicCache.has(url)) {
      heicCache.set(url, new Promise((res) => {
        const probe = new Image();
        probe.onload = () => res(url); // this browser decodes HEIC natively
        probe.onerror = () => {
          convertHeic(url)
            .then(res)
            .catch(() => { heicCache.delete(url); res(null); }); // failed — retry next time
        };
        probe.src = url;
      }));
    }
    return heicCache.get(url);
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
      thumbsEl.appendChild(thumb);
      displayableUrl(url).then((disp) => {
        if (!disp) { thumb.remove(); return; } // undecodable photo — skip it
        thumb.style.backgroundImage = `url(${disp})`;
        thumb.addEventListener("click", () => startPuzzle(disp));
      });
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
