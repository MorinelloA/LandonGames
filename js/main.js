// Landon's Game Room starts here.
import { start, openGame, goHome } from "./core/app.js";
import { GAMES } from "./games/registry.js";

start(GAMES);

// a handle for checking the games from the browser console and tests
window.__lg = { games: GAMES, openGame, goHome };
