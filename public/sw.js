// Custom Service Worker for Mylove PWA Installability
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch handler required for PWA installability.
  // This satisfies the offline-capable PWA criteria without aggressive client-side caching.
  event.respondWith(fetch(event.request));
});
