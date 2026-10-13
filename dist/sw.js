const CACHE = 'dda-shell-v24';

// Critical shell only. Optional authored modules are cached at first use by the
// runtime strategy, preserving the lazy-loading benefit on first installation.
const CORE = [
  './', './index.html', './academy.html', './404.html',
  './styles.css', './alpha-polish.css', './dda-lazy-modules.js',
  './dda-core.js', './learning-engine.js', './lesson-renderer.js',
  './dda-analytics.js', './bff-client.js', './app.js', './public.js',
  './manifest.webmanifest',
  './images/favicon-32.png', './images/apple-touch-icon.png',
  './images/icon-192.png', './images/dda-mark-512.png', './images/dda-og-image.jpg',
  './images/photos/hero-market-woman.jpg',
  './images/photos/institution-gold-bull.jpg',
  './images/photos/community-hero-handshake.jpg',
  './images/photos/membership-handshake-africa.jpg',
  './images/photos/access-two-women-market.jpg',
  './images/photos/path-crystal-forecast.jpg',
  './images/photos/progress-trader-poster.jpg',
  './images/photos/terminal-desk-trading.jpg',
  './images/photos/brvm-market-fruits.jpg',
  './images/photos/brokers-trading-floor.jpg',
  './images/photos/family-three-colleagues.jpg',
  './images/lessons/support-resistance-diagram.jpg'
];

const OPTIONAL_MODULES = [
  './m1-1-lesson.js', './m1-2-lesson.js', './m1-3-lesson.js',
  './p2-lessons.js', './market-intelligence.js'
];
const isSameOrigin = request => new URL(request.url).origin === self.location.origin;
const isApiRequest = url => url.pathname.includes('/v1/');
const isOptionalModule = url => OPTIONAL_MODULES.some(path => url.pathname.endsWith(path.slice(1)));
const cacheRequest = request => request.url.includes('?') ? new Request(new URL(request.url).pathname, { method: 'GET' }) : request;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok && response.type !== 'opaque') {
      await cache.put(cacheRequest(request), response.clone());
    }
    return response;
  } catch {
    return (await cache.match(cacheRequest(request))) || (fallbackUrl ? cache.match(fallbackUrl) : Response.error());
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(cacheRequest(request));
  const network = fetch(request).then(response => {
    if (response.ok && response.type !== 'opaque') cache.put(cacheRequest(request), response.clone());
    return response;
  }).catch(() => null);
  return cached || (await network) || Response.error();
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !isSameOrigin(request)) return;
  const url = new URL(request.url);

  // Never cache authenticated BFF responses or replay them in offline mode.
  if (isApiRequest(url)) return;

  if (request.mode === 'navigate') {
    const fallback = url.pathname.endsWith('/academy.html') ? './academy.html' : './index.html';
    event.respondWith(networkFirst(request, fallback));
    return;
  }

  // Optional lesson/market bundles are fetched only when their route is used,
  // then retained for subsequent offline visits.
  if (isOptionalModule(url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
