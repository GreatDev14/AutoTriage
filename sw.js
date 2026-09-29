// Service Worker Disabled to prevent file:/// caching issues.
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/') || e.request.method !== 'GET') {
    return;
  }
  e.respondWith(fetch(e.request));
});
