// Landon's Game Room starts here.
import { start, openGame, goHome } from "./core/app.js";
import { GAME_LIST, GAMES } from "./games/registry.js";

start(GAME_LIST);

// a handle for checking the games from the browser console and tests
window.__lg = { games: GAMES, openGame, goHome };
