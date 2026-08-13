// Bump this version string every time driver-app.html / manifest.json / icons change,
// otherwise devices that already installed the app keep serving old cached files forever.
const CACHE = 'pod-driver-v3';
const ASSETS = ['./driver-app.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// App-shell: network-first so updates (new icon, new manifest, new code) show up
// immediately on next load, falling back to cache only when offline.
self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  if (url.includes('firebaseio.com') || url.includes('googleapis.com')) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
