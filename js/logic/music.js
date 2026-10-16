// Music Maker's xylophone and follow-along songs.

// one octave, C4 to C5, coloured as a rainbow up the scale (Marble Run
// colours its notes the same way)
export const KEYS = [
  { name: "C", note: "C4", color: "#ff8a8a" },
  { name: "D", note: "D4", color: "#ffb347" },
  { name: "E", note: "E4", color: "#ffd966" },
  { name: "F", note: "F4", color: "#90d4a3" },
  { name: "G", note: "G4", color: "#7ec8e3" },
  { name: "A", note: "A4", color: "#a0aef0" },
  { name: "B", note: "B4", color: "#c9a7eb" },
  { name: "C", note: "C5", color: "#f9a8c2" },
];

// songs as key indexes (0 = C4 ... 7 = C5)
export const SONGS = {
  twinkle: { name: "Twinkle Twinkle", keys: [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0] },
  mary: { name: "Mary Had a Little Lamb", keys: [2, 1, 0, 1, 2, 2, 2, 1, 1, 1, 2, 4, 4] },
  hotcross: { name: "Hot Cross Buns", keys: [2, 1, 0, 2, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 1, 0] },
};
