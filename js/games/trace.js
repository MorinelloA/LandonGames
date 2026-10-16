/* ===== Trace It: finger-trace letters, numbers, and cutting lines =====
   IEP OT goals: letter/number formation and cutting along a line.
   NO freeze in this game — motor practice is trial and error; straying
   off the path simply doesn't advance. Sounds only mark progress. */
App.games.trace = (() => {
  const stage = document.getElementById("trace-stage");
  const labelEl = document.getElementById("trace-label");
  const modeBtns = [...document.querySelectorAll(".trace-mode-btn")];

  // Stroke corner-points on a 100x100 grid (y down), in school stroke order.
  // Segments get subdivided into evenly spaced waypoints at runtime.
  const LETTERS = {
    A: [[[50, 10], [15, 90]], [[50, 10], [85, 90]], [[30, 60], [70, 60]]],
    B: [[[25, 10], [25, 90]], [[25, 10], [60, 10], [70, 20], [70, 40], [60, 50], [25, 50]], [[25, 50], [65, 50], [75, 60], [75, 80], [65, 90], [25, 90]]],
    C: [[[75, 25], [60, 12], [40, 12], [25, 25], [20, 50], [25, 75], [40, 88], [60, 88], [75, 75]]],
    D: [[[25, 10], [25, 90]], [[25, 10], [55, 12], [72, 30], [75, 50], [72, 70], [55, 88], [25, 90]]],
    E: [[[70, 10], [25, 10], [25, 90], [70, 90]], [[25, 50], [60, 50]]],
    F: [[[70, 10], [25, 10], [25, 90]], [[25, 50], [60, 50]]],
    G: [[[75, 25], [60, 12], [40, 12], [25, 25], [20, 50], [25, 75], [40, 88], [60, 88], [75, 75], [75, 55], [55, 55]]],
    H: [[[25, 10], [25, 90]], [[75, 10], [75, 90]], [[25, 50], [75, 50]]],
    I: [[[35, 10], [65, 10]], [[50, 10], [50, 90]], [[35, 90], [65, 90]]],
    J: [[[70, 10], [70, 70], [60, 88], [40, 88], [30, 75]]],
    K: [[[25, 10], [25, 90]], [[70, 10], [25, 50]], [[25, 50], [70, 90]]],
    L: [[[25, 10], [25, 90], [70, 90]]],
    M: [[[20, 90], [20, 10], [50, 55], [80, 10], [80, 90]]],
    N: [[[25, 90], [25, 10], [75, 90], [75, 10]]],
    O: [[[50, 10], [30, 15], [20, 35], [20, 65], [30, 85], [50, 90], [70, 85], [80, 65], [80, 35], [70, 15], [50, 10]]],
    P: [[[25, 10], [25, 90]], [[25, 10], [60, 10], [72, 22], [72, 38], [60, 50], [25, 50]]],
    Q: [[[50, 10], [30, 15], [20, 35], [20, 65], [30, 85], [50, 90], [70, 85], [80, 65], [80, 35], [70, 15], [50, 10]], [[60, 70], [82, 92]]],
    R: [[[25, 10], [25, 90]], [[25, 10], [60, 10], [72, 22], [72, 38], [60, 50], [25, 50]], [[25, 50], [70, 90]]],
    S: [[[75, 20], [55, 10], [35, 12], [25, 25], [35, 42], [65, 55], [75, 70], [65, 85], [40, 90], [25, 80]]],
    T: [[[15, 10], [85, 10]], [[50, 10], [50, 90]]],
    U: [[[25, 10], [25, 65], [35, 85], [50, 90], [65, 85], [75, 65], [75, 10]]],
    V: [[[20, 10], [50, 90], [80, 10]]],
    W: [[[15, 10], [32, 90], [50, 30], [68, 90], [85, 10]]],
    X: [[[20, 10], [80, 90]], [[80, 10], [20, 90]]],
    Y: [[[20, 10], [50, 50]], [[80, 10], [50, 50], [50, 90]]],
    Z: [[[20, 10], [80, 10], [20, 90], [80, 90]]],
  };

  // Lowercase sits on a baseline at y=80 with x-height starting at y=35;
  // ascenders reach y=8 and descenders drop to y=96.
  const LOWERCASE = {
    a: [[[66, 44], [56, 36], [43, 37], [34, 48], [33, 62], [40, 75], [53, 81], [66, 74]], [[66, 35], [66, 80]]],
    b: [[[30, 8], [30, 80]], [[30, 50], [42, 40], [56, 42], [65, 52], [65, 68], [56, 78], [42, 81], [30, 78]]],
    c: [[[67, 45], [57, 36], [44, 37], [35, 48], [34, 63], [42, 76], [55, 81], [67, 73]]],
    d: [[[66, 44], [56, 36], [43, 37], [34, 48], [33, 62], [40, 75], [53, 81], [66, 74]], [[66, 8], [66, 80]]],
    e: [[[34, 60], [67, 60], [66, 48], [56, 37], [43, 38], [34, 50], [34, 64], [42, 77], [56, 81], [67, 73]]],
    f: [[[64, 16], [54, 8], [43, 12], [39, 26], [39, 80]], [[26, 38], [56, 38]]],
    g: [[[66, 44], [56, 36], [43, 37], [34, 48], [33, 62], [40, 75], [53, 81], [66, 74]], [[66, 35], [66, 88], [58, 95], [45, 96], [36, 91]]],
    h: [[[30, 8], [30, 80]], [[30, 50], [40, 38], [54, 37], [64, 47], [64, 80]]],
    i: [[[50, 35], [50, 80]], [[50, 18], [50, 22]]],
    j: [[[55, 35], [55, 88], [47, 95], [36, 94], [30, 88]], [[55, 18], [55, 22]]],
    k: [[[30, 8], [30, 80]], [[62, 37], [30, 62]], [[41, 54], [64, 80]]],
    l: [[[50, 8], [50, 80]]],
    m: [[[22, 35], [22, 80]], [[22, 45], [30, 36], [41, 36], [48, 45], [48, 80]], [[48, 45], [57, 36], [68, 36], [76, 45], [76, 80]]],
    n: [[[31, 35], [31, 80]], [[31, 45], [40, 36], [54, 36], [63, 46], [63, 80]]],
    o: [[[50, 35], [38, 39], [31, 50], [31, 65], [38, 77], [50, 81], [62, 77], [69, 65], [69, 50], [62, 39], [50, 35]]],
    p: [[[30, 35], [30, 96]], [[30, 45], [42, 36], [57, 39], [65, 50], [63, 66], [50, 76], [30, 74]]],
    q: [[[66, 44], [56, 36], [43, 37], [34, 48], [33, 62], [40, 75], [53, 81], [66, 74]], [[66, 35], [66, 96]]],
    r: [[[34, 35], [34, 80]], [[34, 47], [44, 37], [58, 35], [66, 39]]],
    s: [[[66, 43], [55, 35], [42, 36], [35, 45], [41, 54], [59, 60], [66, 69], [59, 78], [45, 82], [34, 75]]],
    t: [[[45, 15], [45, 70], [52, 80], [62, 78]], [[30, 35], [62, 35]]],
    u: [[[31, 35], [31, 64], [39, 77], [52, 81], [63, 75], [67, 64], [67, 35]], [[67, 50], [67, 80]]],
    v: [[[31, 35], [50, 80], [69, 35]]],
    w: [[[24, 35], [36, 80], [50, 52], [64, 80], [76, 35]]],
    x: [[[32, 35], [68, 80]], [[68, 35], [32, 80]]],
    y: [[[31, 35], [52, 76]], [[69, 35], [45, 96], [34, 93]]],
    z: [[[32, 35], [68, 35], [32, 80], [68, 80]]],
  };

  const DIGITS = {
    0: [[[50, 10], [32, 18], [25, 45], [25, 55], [32, 82], [50, 90], [68, 82], [75, 55], [75, 45], [68, 18], [50, 10]]],
    1: [[[35, 25], [50, 10], [50, 90]]],
    2: [[[28, 25], [40, 12], [60, 12], [72, 25], [70, 42], [30, 75], [25, 90], [75, 90]]],
    3: [[[28, 18], [45, 10], [62, 12], [70, 25], [62, 40], [45, 48], [62, 55], [72, 68], [65, 83], [45, 90], [28, 80]]],
    4: [[[55, 10], [25, 60], [80, 60]], [[60, 25], [60, 90]]],
    5: [[[70, 10], [30, 10], [28, 45], [50, 40], [68, 48], [72, 65], [65, 82], [45, 90], [28, 80]]],
    6: [[[65, 12], [45, 15], [30, 35], [25, 60], [32, 82], [50, 90], [65, 84], [72, 68], [65, 55], [48, 50], [32, 58]]],
    7: [[[22, 10], [78, 10], [45, 90]]],
    8: [[[50, 48], [35, 40], [30, 25], [40, 12], [60, 12], [70, 25], [65, 40], [50, 48], [32, 60], [30, 78], [45, 90], [55, 90], [70, 78], [68, 60], [50, 48]]],
    9: [[[70, 35], [60, 15], [40, 12], [28, 25], [30, 42], [45, 50], [62, 46], [70, 35], [70, 60], [60, 90]]],
  };

  const STROKE_COLORS = ["#ff8a8a", "#7ec8e3", "#90d4a3", "#c9a7eb"];
  const TOL = 10;          // viewBox units of "close enough" to the next dot
  const NS = "http://www.w3.org/2000/svg";

  let mode = "abc";        // abc (A-Z) | lower (a-z) | num | cut
  let order = [];          // shuffled characters for the current mode
  let charIdx = 0;
  let completedChars = 0;

  let strokes = [];        // subdivided waypoints for the current character
  let strokeIdx = 0;
  let pointIdx = 0;        // next waypoint to reach in the current stroke
  let svg = null;
  let progressLine = null; // polyline being drawn for the current stroke
  let targetDot = null;
  let marker = null;       // ✏️ or ✂️ that rides along
  let done = false;
  let running = false;

  function subdivide(points, step = 12) {
    const out = [points[0]];
    for (let i = 1; i < points.length; i++) {
      const [x1, y1] = points[i - 1], [x2, y2] = points[i];
      const d = Math.hypot(x2 - x1, y2 - y1);
      const n = Math.max(1, Math.round(d / step));
      for (let k = 1; k <= n; k++) out.push([x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n]);
    }
    return out;
  }

  function makeCutLine() {
    const phase = Math.random() * Math.PI * 2;
    const amp = 14 + Math.random() * 14;
    const pts = [];
    for (let x = 8; x <= 92; x += 6) {
      pts.push([x, 50 + amp * Math.sin(x / 14 + phase)]);
    }
    return [pts];
  }

  function currentChar() {
    return mode === "cut" ? "✂️" : order[charIdx % order.length];
  }

  function el(name, attrs) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  // lowercase strokes are shorter, so they get a slightly finer pen
  function penWidth() {
    return mode === "cut" ? 4 : mode === "lower" ? 8 : 9;
  }

  function buildChar() {
    const raw = mode === "cut" ? makeCutLine()
      : mode === "num" ? DIGITS[currentChar()]
      : mode === "lower" ? LOWERCASE[currentChar()]
      : LETTERS[currentChar()];
    strokes = raw.map((s) => subdivide(s));
    strokeIdx = 0;
    pointIdx = 0;
    done = false;

    labelEl.textContent = mode === "cut" ? "✂️ Cut the line!" : currentChar();

    stage.innerHTML = "";
    svg = el("svg", { viewBox: "0 0 100 100" });

    // faint guide for the whole shape
    raw.forEach((s) => {
      svg.appendChild(el("polyline", {
        points: s.map((p) => p.join(",")).join(" "),
        fill: "none",
        stroke: mode === "cut" ? "#b8bed8" : "#dde2f2",
        "stroke-width": mode === "cut" ? 2 : penWidth(),
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-dasharray": mode === "cut" ? "4 3" : "none",
      }));
    });

    progressLine = null;
    targetDot = el("circle", { r: 5, class: "trace-target" });
    svg.appendChild(targetDot);

    marker = el("text", {
      class: "trace-marker",
      "font-size": "12",
      "text-anchor": "middle",
    });
    marker.textContent = mode === "cut" ? "✂️" : "✏️";
    svg.appendChild(marker);

    startStroke();
    stage.appendChild(svg);

    if (mode === "cut") {
      Sound.speak("Cut along the line!");
    } else {
      const kind = mode === "num" ? "number " : mode === "lower" ? "little letter " : "big letter ";
      Sound.speak("Trace the " + kind + currentChar());
    }
  }

  function startStroke() {
    const color = STROKE_COLORS[strokeIdx % STROKE_COLORS.length];
    progressLine = el("polyline", {
      points: strokes[strokeIdx][0].join(","),
      fill: "none",
      stroke: color,
      "stroke-width": penWidth(),
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    });
    svg.insertBefore(progressLine, targetDot);
    pointIdx = 0;
    moveMarkers();
  }

  function moveMarkers() {
    const stroke = strokes[strokeIdx];
    const next = stroke[Math.min(pointIdx, stroke.length - 1)];
    targetDot.setAttribute("cx", next[0]);
    targetDot.setAttribute("cy", next[1]);
    const at = pointIdx === 0 ? stroke[0] : stroke[pointIdx - 1];
    marker.setAttribute("x", at[0]);
    marker.setAttribute("y", at[1] - 2);
  }

  function svgPoint(e) {
    const r = svg.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100];
  }

  function advanceTo(px, py) {
    if (done) return;
    const stroke = strokes[strokeIdx];
    // consume every waypoint the finger has swept close to
    let moved = false;
    let guard = 0;
    while (pointIdx < stroke.length && guard++ < 6) {
      const [tx, ty] = stroke[pointIdx];
      if (Math.hypot(px - tx, py - ty) > TOL) break;
      progressLine.setAttribute("points", progressLine.getAttribute("points") + " " + tx + "," + ty);
      pointIdx++;
      moved = true;
      Sound.tone(320 + (pointIdx % 8) * 45, { type: "triangle", dur: 0.07, gain: 0.12 });
    }
    if (!moved) return;
    if (pointIdx >= stroke.length) {
      Sound.pop();
      strokeIdx++;
      if (strokeIdx >= strokes.length) {
        charDone();
      } else {
        startStroke();
      }
    } else {
      moveMarkers();
    }
  }

  function charDone() {
    done = true;
    targetDot.setAttribute("r", 0);
    if (mode === "cut") {
      // snip! the two halves drift apart
      const guides = svg.querySelectorAll("polyline");
      guides.forEach((p, i) => { p.style.transition = "transform 0.6s"; });
      progressLine.style.transform = "translateY(4px)";
      Sound.fanfare();
      App.awardStars(1, { message: "Snip! ✂️" });
    } else {
      completedChars++;
      Sound.success();
      Sound.speak(currentChar() + "! Nice tracing!");
      if (completedChars % 3 === 0) {
        App.awardStars(1, { message: "Great tracing! ✏️" });
      }
      charIdx++;
    }
    App.later(buildChar, 1800);
  }

  /* finger tracking on the whole stage */
  let fingerDown = false;
  stage.addEventListener("pointerdown", (e) => {
    if (!running || !svg) return;
    e.preventDefault();
    try { stage.setPointerCapture(e.pointerId); } catch (_) {}
    fingerDown = true;
    const [x, y] = svgPoint(e);
    advanceTo(x, y);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!running || !svg || !fingerDown) return;
    const [x, y] = svgPoint(e);
    advanceTo(x, y);
  });
  const lift = () => { fingerDown = false; };
  stage.addEventListener("pointerup", lift);
  stage.addEventListener("pointercancel", lift);

  function setMode(m) {
    mode = m;
    modeBtns.forEach((b) => b.classList.toggle("active-song", b.dataset.mode === m));
    if (m === "abc") order = App.shuffle(Object.keys(LETTERS));
    else if (m === "lower") order = App.shuffle(Object.keys(LOWERCASE));
    else if (m === "num") order = App.shuffle(Object.keys(DIGITS));
    charIdx = 0;
    buildChar();
  }

  modeBtns.forEach((b) => {
    b.addEventListener("click", () => {
      if (!running) return;
      Sound.click();
      setMode(b.dataset.mode);
    });
  });

  return {
    start() {
      running = true;
      completedChars = 0;
      App.later(() => setMode("abc"));
    },
    stop() {
      running = false;
    },
    hint() {
      if (targetDot) {
        targetDot.classList.add("trace-target-hint");
        setTimeout(() => targetDot && targetDot.classList.remove("trace-target-hint"), 2200);
      }
    },
  };
})();
