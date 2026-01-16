// DeOficios Pro - Optimized Service Worker v2
const CACHE_VERSION = 'deoficios-v2';
const STATIC_CACHE = 'deoficios-static-v2';
const DYNAMIC_CACHE = 'deoficios-dynamic-v2';

// Assets críticos que se precargan
const PRECACHE_ASSETS = [
  '/',
  '/panel',
  '/manifest.json',
  '/icon-192.png',
  '/favicon.svg'
];

// Patrones de rutas para diferentes estrategias de caché
const CACHE_STRATEGIES = {
  // Cache First: recursos estáticos que cambian poco
  cacheFirst: [
    /\.(?:css|js|woff2?|ttf|eot|ico|svg|png|jpg|jpeg|gif|webp)$/,
    /fonts\.googleapis\.com/,
    /fonts\.gstatic\.com/
  ],
  // Stale While Revalidate: HTML y páginas
  staleWhileRevalidate: [
    /\/panel/,
    /\/mi-perfil/,
    /\/$/
  ],
  // Network Only: APIs y datos dinámicos
  networkOnly: [
    /firestore\.googleapis\.com/,
    /firebase/,
    /api\//
  ]
};

// ========== INSTALACIÓN ==========
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .catch(err => console.log('⚠️ Error precaching:', err))
  );
});

// ========== ACTIVACIÓN ==========
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map(name => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// ========== ESTRATEGIAS DE CACHÉ ==========
function matchesPattern(url, patterns) {
  return patterns.some(pattern => pattern.test(url));
}

// Cache First Strategy (para assets estáticos)
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Stale While Revalidate (para HTML - devuelve cache inmediatamente y actualiza en background)
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached || new Response('Offline', { status: 503 }));

  return cached || fetchPromise;
}

// Network First with Cache Fallback
async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// ========== FETCH HANDLER ==========
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // Solo GET requests
  if (request.method !== 'GET') return;

  // Ignorar requests externos no cacheables
  if (!url.startsWith(self.location.origin) &&
    !url.includes('fonts.googleapis.com') &&
    !url.includes('fonts.gstatic.com')) {
    return;
  }

  // Network Only para APIs y Firebase
  if (matchesPattern(url, CACHE_STRATEGIES.networkOnly)) {
    return;
  }

  // Cache First para assets estáticos
  if (matchesPattern(url, CACHE_STRATEGIES.cacheFirst)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Stale While Revalidate para páginas
  if (matchesPattern(url, CACHE_STRATEGIES.staleWhileRevalidate)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default: Network First con fallback
  event.respondWith(networkFirstWithFallback(request));
});

// ========== PUSH NOTIFICATIONS ==========
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || 'Nueva Notificación - DeOficios';
  const options = {
    body: data.body || 'Tienes una nueva novedad en tu panel.',
    icon: '/icon-192.png',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/panel' },
    actions: [
      { action: 'open', title: 'Ver' },
      { action: 'dismiss', title: 'Cerrar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ========== NOTIFICATION CLICK ==========
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/panel';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Buscar ventana existente
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Abrir nueva ventana
        return clients.openWindow(urlToOpen);
      })
  );
});

// ========== BACKGROUND SYNC (para enviar datos pendientes cuando vuelva la conexión) ==========
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-data') {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  // Implementar lógica de sincronización de datos pendientes
  console.log('📤 Sincronizando datos pendientes...');
}

// ========== PERIODIC BACKGROUND SYNC ==========
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-dashboard') {
    event.waitUntil(updateDashboardCache());
  }
});

async function updateDashboardCache() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    await cache.add('/panel');
    console.log('🔄 Dashboard cache actualizado');
  } catch (error) {
    console.log('⚠️ Error actualizando cache:', error);
  }
}
