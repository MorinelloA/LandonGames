// Offline play. Every file the games need is kept under a version that
// tools/stamp-sw.mjs writes in (a hash of their contents), so a deploy with
// any change installs fresh copies all at once, and the old cache goes once
// the new one takes over. Pages and files are served from the cache first.
//
// The family photos live in their own cache, kept in step with
// photos/manifest.json: photo URLs carry a hash of the photo, so a changed
// photo is a new URL, and ones no longer listed are dropped. The manifest
// itself comes from the network when it can, so new photos appear.
//
// Caches are named lg-…; the other apps on this site use mr- (Marble Run)
// and pf- (Pictures), and each only ever touches its own.

const VERSION = 'lg-1a30eadffa70';
const PHOTOS = 'lg-photos';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'fonts/fredoka-latin.woff2',
  'icons/favicon-32.png',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512-maskable.png',
  'icons/icon-512.png',
  'js/art/backdrops.js',
  'js/art/cards.js',
  'js/art/gameart.js',
  'js/art/icons.js',
  'js/art/jigsaw.js',
  'js/art/mascot.js',
  'js/art/people.js',
  'js/art/props.js',
  'js/art/scenes.js',
  'js/art/svg.js',
  'js/art/theme.js',
  'js/art/ui.js',
  'js/core/app.js',
  'js/core/buddy.js',
  'js/core/drag.js',
  'js/core/freeze.js',
  'js/core/fx.js',
  'js/core/hint.js',
  'js/core/levels.js',
  'js/core/rewards.js',
  'js/core/rng.js',
  'js/core/session.js',
  'js/core/sound.js',
  'js/core/stage.js',
  'js/games/counting.js',
  'js/games/feelings.js',
  'js/games/mathpop.js',
  'js/games/maze.js',
  'js/games/memory.js',
  'js/games/music.js',
  'js/games/photopuzzle.js',
  'js/games/puzzle-core.js',
  'js/games/puzzle.js',
  'js/games/registry.js',
  'js/games/simon.js',
  'js/games/sortit.js',
  'js/games/spelling.js',
  'js/games/trace.js',
  'js/logic/counting.js',
  'js/logic/feelings.js',
  'js/logic/jigsaw.js',
  'js/logic/math.js',
  'js/logic/maze.js',
  'js/logic/memory.js',
  'js/logic/music.js',
  'js/logic/puzzle.js',
  'js/logic/sortit.js',
  'js/logic/trace.js',
  'js/logic/words.js',
  'js/main.js',
  'vendor/fluent-emoji-flat/airplane.svg',
  'vendor/fluent-emoji-flat/alarm_clock.svg',
  'vendor/fluent-emoji-flat/alien.svg',
  'vendor/fluent-emoji-flat/ant.svg',
  'vendor/fluent-emoji-flat/apple.svg',
  'vendor/fluent-emoji-flat/arm.svg',
  'vendor/fluent-emoji-flat/astronaut.svg',
  'vendor/fluent-emoji-flat/ball.svg',
  'vendor/fluent-emoji-flat/balloon.svg',
  'vendor/fluent-emoji-flat/banana.svg',
  'vendor/fluent-emoji-flat/bandage.svg',
  'vendor/fluent-emoji-flat/basket.svg',
  'vendor/fluent-emoji-flat/bathtub.svg',
  'vendor/fluent-emoji-flat/bear.svg',
  'vendor/fluent-emoji-flat/bed.svg',
  'vendor/fluent-emoji-flat/bee.svg',
  'vendor/fluent-emoji-flat/bell.svg',
  'vendor/fluent-emoji-flat/bicycle.svg',
  'vendor/fluent-emoji-flat/bird.svg',
  'vendor/fluent-emoji-flat/blowfish.svg',
  'vendor/fluent-emoji-flat/boat.svg',
  'vendor/fluent-emoji-flat/book.svg',
  'vendor/fluent-emoji-flat/books.svg',
  'vendor/fluent-emoji-flat/bread.svg',
  'vendor/fluent-emoji-flat/brick.svg',
  'vendor/fluent-emoji-flat/broom.svg',
  'vendor/fluent-emoji-flat/bus.svg',
  'vendor/fluent-emoji-flat/butterfly.svg',
  'vendor/fluent-emoji-flat/cactus.svg',
  'vendor/fluent-emoji-flat/cake.svg',
  'vendor/fluent-emoji-flat/camera.svg',
  'vendor/fluent-emoji-flat/candy.svg',
  'vendor/fluent-emoji-flat/cap.svg',
  'vendor/fluent-emoji-flat/car.svg',
  'vendor/fluent-emoji-flat/carrot.svg',
  'vendor/fluent-emoji-flat/cat.svg',
  'vendor/fluent-emoji-flat/cheese.svg',
  'vendor/fluent-emoji-flat/cherry.svg',
  'vendor/fluent-emoji-flat/chocolate.svg',
  'vendor/fluent-emoji-flat/cloud.svg',
  'vendor/fluent-emoji-flat/comet.svg',
  'vendor/fluent-emoji-flat/cookie.svg',
  'vendor/fluent-emoji-flat/coral.svg',
  'vendor/fluent-emoji-flat/corn.svg',
  'vendor/fluent-emoji-flat/cow.svg',
  'vendor/fluent-emoji-flat/crab.svg',
  'vendor/fluent-emoji-flat/crayon.svg',
  'vendor/fluent-emoji-flat/cup.svg',
  'vendor/fluent-emoji-flat/cupcake.svg',
  'vendor/fluent-emoji-flat/dinosaur.svg',
  'vendor/fluent-emoji-flat/dog.svg',
  'vendor/fluent-emoji-flat/dolphin.svg',
  'vendor/fluent-emoji-flat/doughnut.svg',
  'vendor/fluent-emoji-flat/dragon.svg',
  'vendor/fluent-emoji-flat/dress.svg',
  'vendor/fluent-emoji-flat/droplet.svg',
  'vendor/fluent-emoji-flat/drum.svg',
  'vendor/fluent-emoji-flat/duck.svg',
  'vendor/fluent-emoji-flat/ear.svg',
  'vendor/fluent-emoji-flat/egg.svg',
  'vendor/fluent-emoji-flat/elephant.svg',
  'vendor/fluent-emoji-flat/eyes.svg',
  'vendor/fluent-emoji-flat/fire.svg',
  'vendor/fluent-emoji-flat/fire_engine.svg',
  'vendor/fluent-emoji-flat/fish.svg',
  'vendor/fluent-emoji-flat/flower.svg',
  'vendor/fluent-emoji-flat/foot.svg',
  'vendor/fluent-emoji-flat/fork_knife.svg',
  'vendor/fluent-emoji-flat/fox.svg',
  'vendor/fluent-emoji-flat/frog.svg',
  'vendor/fluent-emoji-flat/fuel_pump.svg',
  'vendor/fluent-emoji-flat/gift.svg',
  'vendor/fluent-emoji-flat/giraffe.svg',
  'vendor/fluent-emoji-flat/globe.svg',
  'vendor/fluent-emoji-flat/gloves.svg',
  'vendor/fluent-emoji-flat/glowing_star.svg',
  'vendor/fluent-emoji-flat/grape.svg',
  'vendor/fluent-emoji-flat/hand.svg',
  'vendor/fluent-emoji-flat/hat.svg',
  'vendor/fluent-emoji-flat/heart.svg',
  'vendor/fluent-emoji-flat/helicopter.svg',
  'vendor/fluent-emoji-flat/hibiscus.svg',
  'vendor/fluent-emoji-flat/house.svg',
  'vendor/fluent-emoji-flat/ice.svg',
  'vendor/fluent-emoji-flat/ice_cream.svg',
  'vendor/fluent-emoji-flat/ice_cream_bowl.svg',
  'vendor/fluent-emoji-flat/jeans.svg',
  'vendor/fluent-emoji-flat/juice.svg',
  'vendor/fluent-emoji-flat/key.svg',
  'vendor/fluent-emoji-flat/kite.svg',
  'vendor/fluent-emoji-flat/ladybug.svg',
  'vendor/fluent-emoji-flat/leopard.svg',
  'vendor/fluent-emoji-flat/lightning.svg',
  'vendor/fluent-emoji-flat/lion.svg',
  'vendor/fluent-emoji-flat/lips.svg',
  'vendor/fluent-emoji-flat/lollipop.svg',
  'vendor/fluent-emoji-flat/milk.svg',
  'vendor/fluent-emoji-flat/monkey.svg',
  'vendor/fluent-emoji-flat/moon.svg',
  'vendor/fluent-emoji-flat/mountain.svg',
  'vendor/fluent-emoji-flat/mouse.svg',
  'vendor/fluent-emoji-flat/nose.svg',
  'vendor/fluent-emoji-flat/octopus.svg',
  'vendor/fluent-emoji-flat/orange.svg',
  'vendor/fluent-emoji-flat/owl.svg',
  'vendor/fluent-emoji-flat/palm.svg',
  'vendor/fluent-emoji-flat/pancakes.svg',
  'vendor/fluent-emoji-flat/parrot.svg',
  'vendor/fluent-emoji-flat/pencil.svg',
  'vendor/fluent-emoji-flat/pig.svg',
  'vendor/fluent-emoji-flat/pizza.svg',
  'vendor/fluent-emoji-flat/planet.svg',
  'vendor/fluent-emoji-flat/plug.svg',
  'vendor/fluent-emoji-flat/police_car.svg',
  'vendor/fluent-emoji-flat/puppy.svg',
  'vendor/fluent-emoji-flat/puzzle.svg',
  'vendor/fluent-emoji-flat/rabbit.svg',
  'vendor/fluent-emoji-flat/race_car.svg',
  'vendor/fluent-emoji-flat/rain_cloud.svg',
  'vendor/fluent-emoji-flat/rice.svg',
  'vendor/fluent-emoji-flat/ring.svg',
  'vendor/fluent-emoji-flat/robot.svg',
  'vendor/fluent-emoji-flat/rocket.svg',
  'vendor/fluent-emoji-flat/rooster.svg',
  'vendor/fluent-emoji-flat/scarf.svg',
  'vendor/fluent-emoji-flat/scissors.svg',
  'vendor/fluent-emoji-flat/scooter.svg',
  'vendor/fluent-emoji-flat/shark.svg',
  'vendor/fluent-emoji-flat/sheep.svg',
  'vendor/fluent-emoji-flat/shell.svg',
  'vendor/fluent-emoji-flat/shirt.svg',
  'vendor/fluent-emoji-flat/shortcake.svg',
  'vendor/fluent-emoji-flat/shrimp.svg',
  'vendor/fluent-emoji-flat/slide.svg',
  'vendor/fluent-emoji-flat/sloth.svg',
  'vendor/fluent-emoji-flat/snail.svg',
  'vendor/fluent-emoji-flat/snake.svg',
  'vendor/fluent-emoji-flat/sneaker.svg',
  'vendor/fluent-emoji-flat/snowflake.svg',
  'vendor/fluent-emoji-flat/snowman.svg',
  'vendor/fluent-emoji-flat/socks.svg',
  'vendor/fluent-emoji-flat/soup.svg',
  'vendor/fluent-emoji-flat/spider.svg',
  'vendor/fluent-emoji-flat/spoon.svg',
  'vendor/fluent-emoji-flat/spouting_whale.svg',
  'vendor/fluent-emoji-flat/star.svg',
  'vendor/fluent-emoji-flat/strawberry.svg',
  'vendor/fluent-emoji-flat/sun.svg',
  'vendor/fluent-emoji-flat/sunflower.svg',
  'vendor/fluent-emoji-flat/sunglasses.svg',
  'vendor/fluent-emoji-flat/teddy.svg',
  'vendor/fluent-emoji-flat/telescope.svg',
  'vendor/fluent-emoji-flat/thunder_cloud.svg',
  'vendor/fluent-emoji-flat/tiger.svg',
  'vendor/fluent-emoji-flat/tooth.svg',
  'vendor/fluent-emoji-flat/toothbrush.svg',
  'vendor/fluent-emoji-flat/tractor.svg',
  'vendor/fluent-emoji-flat/traffic_light.svg',
  'vendor/fluent-emoji-flat/train.svg',
  'vendor/fluent-emoji-flat/tree.svg',
  'vendor/fluent-emoji-flat/trophy.svg',
  'vendor/fluent-emoji-flat/tropical_fish.svg',
  'vendor/fluent-emoji-flat/turtle.svg',
  'vendor/fluent-emoji-flat/ufo.svg',
  'vendor/fluent-emoji-flat/video_game.svg',
  'vendor/fluent-emoji-flat/watch.svg',
  'vendor/fluent-emoji-flat/wave.svg',
  'vendor/fluent-emoji-flat/whale.svg',
  'vendor/fluent-emoji-flat/zebra.svg',
];

async function syncPhotos() {
  try {
    const res = await fetch('photos/manifest.json', { cache: 'no-cache' });
    if (!res.ok) return;
    const data = await res.clone().json();
    const entries = Array.isArray(data) ? data.map((f) => ({ src: f })) : data.photos || [];
    const wanted = new Set(entries.flatMap((e) => [e.src, e.thumb].filter(Boolean).map((p) => new URL('photos/' + p, self.registration.scope).href)));
    const cache = await caches.open(PHOTOS);
    await cache.put('photos/manifest.json', res);
    for (const req of await cache.keys()) {
      if (!wanted.has(req.url) && !req.url.endsWith('/photos/manifest.json')) await cache.delete(req);
    }
    const have = new Set((await cache.keys()).map((r) => r.url));
    await Promise.all([...wanted].filter((u) => !have.has(u)).map((u) => cache.add(u).catch(() => {})));
  } catch (_) {
    // offline or a bad manifest: keep whatever photos are already cached
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' }))))
      .then(syncPhotos)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('lg-') && k !== VERSION && k !== PHOTOS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  const path = url.pathname.slice(new URL(self.registration.scope).pathname.length);

  // the photo list: fresh when online (and the photos with it), cached when not
  if (path === 'photos/manifest.json') {
    event.respondWith(
      fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(PHOTOS).then((c) => c.put('photos/manifest.json', copy)).then(syncPhotos);
        }
        return res;
      }).catch(() => caches.open(PHOTOS).then((c) => c.match('photos/manifest.json')).then((hit) => hit || Response.error())),
    );
    return;
  }

  // a photo: from the photo cache, or fetched and kept
  if (path.startsWith('photos/')) {
    event.respondWith(
      caches.open(PHOTOS).then((cache) => cache.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) cache.put(req, res.clone());
        return res;
      }))),
    );
    return;
  }

  // any page load is the one page; everything else is a kept file
  const page = req.mode === 'navigate';
  event.respondWith(
    caches.open(VERSION)
      .then((cache) => cache.match(page ? './' : req, { ignoreSearch: page }))
      .then((hit) => hit || fetch(req)),
  );
});
