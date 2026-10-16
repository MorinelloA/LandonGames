// Landon's Game Room starts here.
import { start, openGame, goHome } from "./core/app.js";
import { GAME_LIST, GAMES } from "./games/registry.js";

start(GAME_LIST);

// a handle for checking the games from the browser console and tests
window.__lg = { games: GAMES, openGame, goHome };

// offline play once it's served from a real host; never on this machine,
// where files change under it (?sw forces it on, to check offline play)
const LOCAL = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
if ("serviceWorker" in navigator && (!LOCAL || new URLSearchParams(location.search).has("sw"))) {
  navigator.serviceWorker.register("sw.js").catch((err) => console.warn("offline play unavailable:", err));
}
