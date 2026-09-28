const CACHE = 'dda-shell-v17';
const CORE = ['./', './index.html', './styles.css', './alpha-polish.css', './m1-1-lesson.js', './m1-2-lesson.js', './m1-3-lesson.js', './dda-core.js', './learning-engine.js', './lesson-renderer.js', './dda-analytics.js', './app.js', './manifest.webmanifest', './images/dda-og-image.jpg', './images/icon-192.png', './images/dda-mark-512.png', './images/photos/hero-market-woman.jpg', './images/photos/institution-gold-bull.jpg', './images/photos/community-hero-handshake.jpg', './images/photos/membership-handshake-africa.jpg', './images/photos/access-two-women-market.jpg', './images/photos/path-crystal-forecast.jpg', './images/photos/progress-trader-poster.jpg', './images/photos/terminal-desk-trading.jpg', './images/photos/brvm-market-fruits.jpg', './images/photos/brokers-trading-floor.jpg', './images/photos/family-three-colleagues.jpg', './images/lessons/support-resistance-diagram.jpg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then(hit => hit || caches.match('./index.html'))));
});
