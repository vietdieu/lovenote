const CACHE_NAME = 'mylove-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // DO NOT intercept:
  // 1. API calls
  // 2. Audio/Video media (which require HTTP Range Requests)
  // 3. External/cross-origin requests (e.g., archive.org, mixkit.co, etc.)
  if (
    url.pathname.startsWith('/api') ||
    event.request.destination === 'audio' ||
    event.request.destination === 'video' ||
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.mp4') ||
    !event.request.url.startsWith(self.location.origin)
  ) {
    return; // Let the browser handle natively
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    }).catch(() => {
      // Only return SPA index.html for navigation requests
      if (event.request.mode === 'navigate') {
        return caches.match('/');
      }
      return Promise.reject();
    })
  );
});
