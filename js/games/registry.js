// Every game in menu order, with the title shown in the top bar. Each has
// the cat in the corner, unless the cat is already in the game (`noBuddy`).
// A game's id is its menu card's data-game and its screen-<id>.
import mathpop from "./mathpop.js";
import spelling from "./spelling.js";
import memory from "./memory.js";
import simon from "./simon.js";
import counting from "./counting.js";
import music from "./music.js";
import puzzle from "./puzzle.js";
import maze from "./maze.js";
import photopuzzle from "./photopuzzle.js";
import sortit from "./sortit.js";
import feelings from "./feelings.js";
import trace from "./trace.js";

export const GAME_LIST = [
  { id: "mathpop", title: "Math Bubbles", game: mathpop },
  { id: "spelling", title: "Word Builder", game: spelling },
  { id: "memory", title: "Animal Match", game: memory },
  { id: "simon", title: "Copy Cat", game: simon, noBuddy: true },
  { id: "counting", title: "Counting Time", game: counting },
  { id: "music", title: "Music Maker", game: music },
  { id: "puzzle", title: "Puzzle Builder", game: puzzle },
  { id: "maze", title: "Cheese Maze", game: maze },
  { id: "photopuzzle", title: "Picture Puzzle", game: photopuzzle },
  { id: "sortit", title: "Sort It!", game: sortit },
  { id: "feelings", title: "Feelings", game: feelings },
  { id: "trace", title: "Trace It", game: trace },
];

export const GAMES = Object.fromEntries(GAME_LIST.map((g) => [g.id, g.game]));
