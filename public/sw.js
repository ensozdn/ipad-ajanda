// Service Worker for PWA - Offline Support
const CACHE_NAME = 'ajanda-v2';
const urlsToCache = [
  '/',
  '/globals.css',
  '/manifest.json',
  '/icon?size=192',
  '/icon?size=512',
  '/apple-icon',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache açıldı - Offline mod hazır');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eski cache siliniyor:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network First with Cache Fallback (data her zaman güncel olsun)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Network'ten başarılı geldi, cache'e kaydet
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network başarısız, cache'den dön (OFFLINE)
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // Cache'de de yoksa
          return new Response(
            JSON.stringify({
              error: 'Offline',
              message: 'İnternet bağlantınızı kontrol edin. Verileriniz cihazınızda güvenli.'
            }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        });
      })
  );
});
