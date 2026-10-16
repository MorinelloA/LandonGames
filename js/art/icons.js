// The vocabulary pictures: every animal, food, vehicle and thing the games
// show, drawn from Microsoft's Fluent Emoji (Flat style, MIT licence) so
// every device shows the same picture. tools/vendor-icons.mjs copies each
// one into vendor/fluent-emoji-flat/<id>.svg; the emoji here is only how
// that tool finds the picture, and is never shown.
//
// Animals use their whole body where Fluent has one (a dog, not a dog's
// face), so they read as the thing itself.

export const ICONS = {
  // animals
  ant: "🐜", bear: "🐻", bee: "🐝", bird: "🐦", butterfly: "🦋", cat: "🐈", cow: "🐄",
  crab: "🦀", dinosaur: "🦕", dog: "🐕", dolphin: "🐬", dragon: "🐉", duck: "🦆",
  elephant: "🐘", fish: "🐟", fox: "🦊", frog: "🐸", giraffe: "🦒", ladybug: "🐞",
  leopard: "🐆", lion: "🦁", monkey: "🐒", mouse: "🐁", octopus: "🐙", owl: "🦉",
  parrot: "🦜", pig: "🐖", puppy: "🐶", rabbit: "🐇", rooster: "🐓", shark: "🦈",
  sheep: "🐑", shrimp: "🦐", sloth: "🦥", snail: "🐌", snake: "🐍", spider: "🕷️",
  tiger: "🐅", tropical_fish: "🐠", turtle: "🐢", whale: "🐋", spouting_whale: "🐳",
  zebra: "🦓", blowfish: "🐡", shell: "🐚", coral: "🪸",
  // food
  apple: "🍎", banana: "🍌", bread: "🍞", cake: "🎂", candy: "🍬", carrot: "🥕",
  cheese: "🧀", cherry: "🍒", chocolate: "🍫", cookie: "🍪", corn: "🌽", cupcake: "🧁",
  doughnut: "🍩", egg: "🥚", grape: "🍇", ice_cream: "🍦", ice_cream_bowl: "🍨",
  lollipop: "🍭", milk: "🥛", orange: "🍊", pancakes: "🥞", pizza: "🍕",
  shortcake: "🍰", soup: "🍲", strawberry: "🍓", juice: "🧃",
  // things
  alarm_clock: "⏰", balloon: "🎈", bandage: "🩹", bathtub: "🛁", bed: "🛏️", bell: "🔔",
  books: "📚", book: "📕", brick: "🧱", broom: "🧹", camera: "📷", crayon: "🖍️",
  cup: "☕", drum: "🥁", fork_knife: "🍴", gift: "🎁", house: "🏠", key: "🔑",
  kite: "🪁", pencil: "✏️", puzzle: "🧩", ring: "💍", robot: "🤖", scissors: "✂️",
  spoon: "🥄", sunglasses: "🕶️", teddy: "🧸", toothbrush: "🪥", trophy: "🏆",
  video_game: "🎮", watch: "⌚", plug: "🔌", basket: "🧺", telescope: "🔭",
  slide: "🛝", hat: "🎩", ball: "⚽",
  // clothes
  cap: "🧢", dress: "👗", gloves: "🧤", jeans: "👖", scarf: "🧣", shirt: "👕",
  sneaker: "👟", socks: "🧦",
  // body
  arm: "💪", ear: "👂", eyes: "👀", foot: "🦶", hand: "🖐️", lips: "👄", nose: "👃",
  tooth: "🦷",
  // vehicles
  airplane: "✈️", bicycle: "🚲", boat: "⛵", bus: "🚌", car: "🚗", fire_engine: "🚒",
  helicopter: "🚁", police_car: "🚓", race_car: "🏎️", rocket: "🚀", scooter: "🛴",
  tractor: "🚜", train: "🚂", ufo: "🛸", traffic_light: "🚦", fuel_pump: "⛽",
  // nature and weather
  cactus: "🌵", cloud: "☁️", comet: "☄️", droplet: "💧", fire: "🔥", flower: "🌸",
  globe: "🌍", hibiscus: "🌺", lightning: "⚡", moon: "🌙", mountain: "🏔️",
  palm: "🌴", planet: "🪐", rain_cloud: "🌧️", rice: "🌾", snowflake: "❄️",
  snowman: "⛄", star: "⭐", glowing_star: "🌟", sun: "☀️", sunflower: "🌻",
  thunder_cloud: "⛈️", tree: "🌳", wave: "🌊", ice: "🧊", heart: "❤️",
  alien: "👽", astronaut: "🧑‍🚀",
};

// relative to this file, so the address works from any page
const ICON_DIR = new URL("../../vendor/fluent-emoji-flat/", import.meta.url).href;

export function iconUrl(id) {
  if (!(id in ICONS)) throw new Error("No icon called " + id);
  return ICON_DIR + id + ".svg";
}
