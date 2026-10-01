// Network-first so updates always land; cache is only the offline fallback.
const CACHE = 'phil-v3';
const SHELL = ['./', 'index.html', 'logic.js', 'manifest.webmanifest', 'fonts/inter.woff2', 'fonts/space-grotesk-700.woff2', 'apple-touch-icon.png', 'fonts/lilita-one.woff2'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
