// The storybook look: every colour the art and the page use. CSS mirrors
// the page colours as custom properties in css/style.css, and a test keeps
// the two in step. Flat colours only: no outlines, gradients or blur.

export const PAGE = {
  paper: "#FFF6E9",      // panels and cards
  paperDeep: "#F3DFC6",  // the flat shade under them
  cream: "#FFFBF4",
  ink: "#4A3426",        // text
  inkSoft: "#7C6352",    // quieter text
  line: "#E8D2B6",       // dashed slots and dividers
};

// one colour per game: its menu card, buttons and badges
export const ACCENT = {
  mathpop: "#4FA9D6",
  spelling: "#EE9A4D",
  memory: "#6DB86F",
  simon: "#A782D8",
  counting: "#EC7FA6",
  music: "#E9B53D",
  puzzle: "#7F92E3",
  maze: "#EA8562",
  photopuzzle: "#4FB5A8",
  sortit: "#8DBA59",
  feelings: "#E77F9E",
  trace: "#E79E52",
};

// the world
export const WORLD = {
  sky: "#CDEBFA", skyDeep: "#A8D9F3", cloud: "#FFFFFF", sun: "#FFD45E", sunGlow: "#FFE89A",
  grass: "#95CC6E", grassDeep: "#7DB95A", hill: "#B9DE92", hillFar: "#CDE8AE",
  leaf: "#6BB35A", leafDeep: "#559B47", trunk: "#A06B45",
  sea: "#5DB8DD", seaDeep: "#3D96C2", seaDark: "#2E78A6", sand: "#F2D9A2", sandDeep: "#E3C384",
  wood: "#D9A26A", woodDeep: "#B9824D", woodDark: "#8E5F36",
  wall: "#FBE3C8", wallDeep: "#F0CFAB", floor: "#E2B587", floorDeep: "#CF9F70",
  rug: "#F19C8E", rugDeep: "#DF8576", window: "#CDEBFA", frame: "#FFFFFF",
  night: "#2F3561", nightDeep: "#232849", star: "#FFE58A",
  water: "#7FCDEB", waterDeep: "#5CB6DD", tile: "#FFFFFF",
  stone: "#C9C3BC", stoneDeep: "#ADA59C", metal: "#B8C2CC", metalDeep: "#94A0AC",
  red: "#E8635A", orange: "#F29A4A", yellow: "#F7CC4A", green: "#7CC36A", blue: "#5B9BE0",
  purple: "#A47AD9", pink: "#F28FB5", white: "#FFFFFF", shadow: "rgba(74,52,38,0.12)",
};

// people: skin, hair and clothes for the story characters
export const PEOPLE = {
  boy: { skin: "#F3C7A1", skinDeep: "#E3AE85", hair: "#6B4226", shirt: "#5B8DEF", shirtDeep: "#4A78D6", pants: "#3F4C7A", shoes: "#E8775A" },
  girl: { skin: "#C98B62", skinDeep: "#B2754E", hair: "#3A2418", shirt: "#F28FB5", shirtDeep: "#DE7AA1", pants: "#7A5BC2", shoes: "#F6B93B" },
  grandma: { skin: "#F2CDAD", skinDeep: "#E1B593", hair: "#D9D6DE", shirt: "#7CC36A", shirtDeep: "#66AE56", pants: "#8E7AB5", shoes: "#8E5F36" },
  mouth: "#8A4535",
  eyes: "#2F2320",
  cheek: "#F49A8F",
  tear: "#7FC8F2",
};

// the cat who guides every game
export const CAT = {
  fur: "#F4A259", furDeep: "#E2853B", stripe: "#D9772E", cream: "#FFE6C7",
  nose: "#E86F6F", eye: "#3A2A20", ear: "#F7B9A3",
};

// a rainbow up the scale, red C to pink high C (Marble Run's note colours)
export const NOTES = ["#E8635A", "#F29A4A", "#F7CC4A", "#7CC36A", "#4FB5D6", "#5B8DEF", "#A47AD9", "#F28FB5"];

// confetti and sparkles
export const CONFETTI = ["#F7CC4A", "#E8635A", "#5B9BE0", "#7CC36A", "#A47AD9", "#F28FB5", "#F29A4A"];

// mix a #rrggbb colour toward black (amt < 0) or white (amt > 0)
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const t = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  const ch = (v) => Math.round(v + (t - v) * p);
  const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase();
}
