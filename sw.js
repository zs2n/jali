/* جَلِيّ service worker
   - Pages: network first, so an online visitor always gets the latest version;
     the cached copy is used only when there is no connection.
   - Icons, manifest and fonts: served from cache and refreshed in the background.
   - VERSION changes on every publish, which makes the browser install the new
     worker and delete the old caches automatically. */
const VERSION = '20261016-002618';
const PAGES = 'jali-pages-' + VERSION;
const ASSETS = 'jali-assets-' + VERSION;
const FONTS = 'jali-fonts';
const OFFLINE = './offline.html';
const PRECACHE = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGES).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((k) => k.startsWith('jali-') && k !== PAGES && k !== ASSETS && k !== FONTS)
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isFont(url) {
  return url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}

async function networkFirst(request) {
  const cache = await caches.open(PAGES);
  try {
    const fresh = await fetch(request, { cache: 'no-store' });
    if (fresh && fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await cache.match(request, { ignoreSearch: true });
    return cached || (await cache.match(OFFLINE));
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone()); return res; })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
  if (isFont(url)) {
    event.respondWith(staleWhileRevalidate(request, FONTS));
    return;
  }
  if (url.origin === self.location.origin && url.pathname.startsWith(new URL('./', self.location).pathname)) {
    event.respondWith(staleWhileRevalidate(request, ASSETS));
  }
});
