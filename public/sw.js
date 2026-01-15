// Service Worker Básico para que la App sea instalable
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Por ahora dejamos pasar todo el tráfico a la red (Network First)
  // Esto evita problemas de caché mientras desarrollamos
  e.respondWith(fetch(e.request));
});