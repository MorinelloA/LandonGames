/* ===== Cheese Maze: drag the mouse through the maze to the cheese ===== */
App.games.maze = (() => {
  const board = document.getElementById("maze-board");
  const levelEl = document.getElementById("maze-level");

  // maze sizes per level: [columns, rows]
  const SIZES = [[5, 4], [6, 5], [8, 6], [9, 7], [11, 8], [12, 9]];
  let level = Math.min(SIZES.length, Math.max(1, parseInt(localStorage.getItem("landon-maze-level") || "1", 10)));

  let W = 0, H = 0;
  let cells = [];          // cells[y][x] = {t, r, b, l} walls
  let px = 0, py = 0;      // player position
  let cellSize = 0;
  let playerEl = null;
  let won = false;
  let running = false;

  function renderLevel() {
    levelEl.textContent = "Level " + level;
  }

  function saveLevel() {
    localStorage.setItem("landon-maze-level", String(level));
    renderLevel();
  }

  // classic recursive-backtracker maze
  function generate() {
    [W, H] = SIZES[level - 1];
    cells = Array.from({ length: H }, () =>
      Array.from({ length: W }, () => ({ t: true, r: true, b: true, l: true, seen: false }))
    );
    const stack = [[0, 0]];
    cells[0][0].seen = true;
    while (stack.length) {
      const [x, y] = stack[stack.length - 1];
      const options = [];
      if (y > 0 && !cells[y - 1][x].seen) options.push([x, y - 1, "t", "b"]);
      if (x < W - 1 && !cells[y][x + 1].seen) options.push([x + 1, y, "r", "l"]);
      if (y < H - 1 && !cells[y + 1][x].seen) options.push([x, y + 1, "b", "t"]);
      if (x > 0 && !cells[y][x - 1].seen) options.push([x - 1, y, "l", "r"]);
      if (!options.length) { stack.pop(); continue; }
      const [nx, ny, wallHere, wallThere] = options[Math.floor(Math.random() * options.length)];
      cells[y][x][wallHere] = false;
      cells[ny][nx][wallThere] = false;
      cells[ny][nx].seen = true;
      stack.push([nx, ny]);
    }
  }

  function build() {
    won = false;
    generate();
    px = 0;
    py = 0;

    const maxW = Math.min(window.innerWidth * 0.9, 900);
    const maxH = window.innerHeight * 0.62;
    cellSize = Math.floor(Math.min(maxW / W, maxH / H));

    board.innerHTML = "";
    board.style.gridTemplateColumns = `repeat(${W}, ${cellSize}px)`;
    board.style.gridTemplateRows = `repeat(${H}, ${cellSize}px)`;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const d = document.createElement("div");
        d.className = "maze-cell";
        if (cells[y][x].t) d.classList.add("wall-t");
        if (cells[y][x].l) d.classList.add("wall-l");
        if (x === W - 1 && cells[y][x].r) d.classList.add("edge-r");
        if (y === H - 1 && cells[y][x].b) d.classList.add("edge-b");
        d.dataset.x = x;
        d.dataset.y = y;
        board.appendChild(d);
      }
    }

    const goal = document.createElement("div");
    goal.id = "maze-goal";
    goal.textContent = "🧀";
    placeAt(goal, W - 1, H - 1);
    board.appendChild(goal);

    playerEl = document.createElement("div");
    playerEl.id = "maze-player";
    playerEl.textContent = "🐭";
    placeAt(playerEl, 0, 0);
    board.appendChild(playerEl);

    markVisited(0, 0);
  }

  function placeAt(el, x, y) {
    el.style.width = cellSize + "px";
    el.style.height = cellSize + "px";
    el.style.fontSize = cellSize * 0.62 + "px";
    el.style.left = x * cellSize + "px";
    el.style.top = y * cellSize + "px";
  }

  function markVisited(x, y) {
    const idx = y * W + x;
    const cell = board.children[idx];
    if (cell) cell.classList.add("visited");
  }

  function canStep(x, y, dx, dy) {
    const c = cells[y][x];
    if (dx === 1) return !c.r;
    if (dx === -1) return !c.l;
    if (dy === 1) return !c.b;
    if (dy === -1) return !c.t;
    return false;
  }

  let stepPitch = 0;
  function step(dx, dy) {
    px += dx;
    py += dy;
    placeAt(playerEl, px, py);
    markVisited(px, py);
    Sound.tone(300 + (stepPitch++ % 5) * 60, { type: "triangle", dur: 0.08, gain: 0.12 });
    if (px === W - 1 && py === H - 1) win();
  }

  // walk toward wherever the finger is, one open corridor cell at a time
  function moveToward(cx, cy) {
    let guard = 0;
    while ((cx !== px || cy !== py) && guard++ < 4) {
      const dx = Math.sign(cx - px), dy = Math.sign(cy - py);
      const preferX = Math.abs(cx - px) >= Math.abs(cy - py);
      if (preferX && dx && canStep(px, py, dx, 0)) step(dx, 0);
      else if (dy && canStep(px, py, 0, dy)) step(0, dy);
      else if (dx && canStep(px, py, dx, 0)) step(dx, 0);
      else break;
      if (won) break;
    }
  }

  function pointerCell(e) {
    const r = board.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left) / cellSize);
    const y = Math.floor((e.clientY - r.top) / cellSize);
    if (x < 0 || y < 0 || x >= W || y >= H) return null;
    return [x, y];
  }

  let dragging = false;
  board.addEventListener("pointerdown", (e) => {
    if (!running || won) return;
    e.preventDefault();
    try { board.setPointerCapture(e.pointerId); } catch (_) {}
    dragging = true;
    const c = pointerCell(e);
    if (c) moveToward(c[0], c[1]);
  });
  board.addEventListener("pointermove", (e) => {
    if (!running || won || !dragging) return;
    const c = pointerCell(e);
    if (c) moveToward(c[0], c[1]);
  });
  const stopDrag = () => { dragging = false; };
  board.addEventListener("pointerup", stopDrag);
  board.addEventListener("pointercancel", stopDrag);

  function win() {
    won = true;
    playerEl.classList.add("win");
    Sound.fanfare();
    App.awardStars(2, { message: "Cheese! 🧀" });
    Sound.speak("You found the cheese! Great job!");
    if (level < SIZES.length) {
      level++;
      saveLevel();
    }
    App.later(build, 2400);
  }

  return {
    start() {
      running = true;
      renderLevel();
      App.later(build);
    },
    stop() {
      running = false;
    },
    hint() {
      // light up the next few steps toward the cheese
      if (won || !cells.length) return;
      const prev = {};
      const seen = new Set([px + "," + py]);
      const q = [[px, py]];
      while (q.length) {
        const [x, y] = q.shift();
        if (x === W - 1 && y === H - 1) break;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy, k = nx + "," + ny;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(k) || !canStep(x, y, dx, dy)) continue;
          seen.add(k);
          prev[k] = [x, y];
          q.push([nx, ny]);
        }
      }
      const path = [];
      let cur = [W - 1, H - 1];
      while (cur && !(cur[0] === px && cur[1] === py)) {
        path.unshift(cur);
        cur = prev[cur[0] + "," + cur[1]];
      }
      path.slice(0, 3).forEach(([x, y]) => {
        const cell = board.children[y * W + x];
        if (cell) {
          cell.classList.add("maze-hint");
          setTimeout(() => cell.classList.remove("maze-hint"), 2200);
        }
      });
    },
  };
})();
