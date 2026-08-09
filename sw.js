const CACHE_NAME = 'martins-super-calc-v2';

// 1. Install & immediately force activation
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. Clear out any old versions of the cache when activated
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. CACHE EVERYTHING DYNAMICALLY ("Cache First, Network Fallback & Auto-Save")
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests so actions don't break
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return from cache immediately if already saved
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, fetch from network AND automatically save a copy to cache
      return fetch(event.request)
        .then((networkResponse) => {
          // Verify valid response before saving
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // Offline Fallback: If page navigation fails without network, return cached root index
          if (event.request.mode === 'navigate') {
            return caches.match('./') || caches.match('./index.html');
          }
        });
    })
  );
});
