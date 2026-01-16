const CACHE_NAME = 'deoficios-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/panel',
  '/manifest.json',
  '/favicon.svg',
  // Agregar aquí estilos CSS críticos si es build estático
];

// INSTALACIÓN
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Intentar cachear lo básico, pero no fallar si algo falta
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.log('Algunos assets no se cachearon:', err));
    })
  );
});

// ACTIVACIÓN
self.addEventListener('activate', (event) => {
  // Limpiar cachés viejos
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH (Network First, fallback to Cache)
self.addEventListener('fetch', (event) => {
  // Solo interceptar GET requests
  if (event.request.method !== 'GET') return;

  // Ignorar requests a otros dominios o extensiones chrome
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, clonarla al caché (solo para assets estáticos si quisieras)
        // Por ahora Network First simple
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar caché
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si no hay caché y es navegación, mostrar página offline (si existiera)
          // if (event.request.mode === 'navigate') return caches.match('/offline.html');
        });
      })
  );
});

// PUSH NOTIFICATIONS
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || 'Nueva Notificación - DeOficios';
  const options = {
    body: data.body || 'Tienes una nueva novedad en tu panel.',
    icon: '/icon-192.png',
    badge: '/favicon.svg',
    data: { url: data.url || '/panel' }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// PUSH CLICK
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/panel';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si ya hay una ventana abierta, enfocarla
      if (windowClients.length > 0) {
        // Opcional: navegar a la url específica
        // windowClients[0].navigate(urlToOpen); 
        return windowClients[0].focus();
      }
      // Si no, abrir una nueva
      return clients.openWindow(urlToOpen);
    })
  );
});
