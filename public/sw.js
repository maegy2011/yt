const CACHE_NAME = 'mytube-v1';
const urlsToCache = [
  '/',
  '/api/health',
  '/logo.svg'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        // For API requests, try network first, then serve offline response
        if (event.request.url.includes('/api/')) {
          return fetch(event.request)
            .catch(() => {
              // Return offline response for API requests
              return new Response(
                JSON.stringify({ error: 'Offline - Service unavailable' }),
                {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        }
        
        // For other requests, try network
        return fetch(event.request);
      })
      .catch((error) => {
        console.error('Service Worker: Fetch failed:', error);
        return new Response('Offline - No network connection', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'KEEP_ALIVE') {
    console.log('Service Worker: Keep alive message received at:', new Date(event.data.timestamp));
  }
});

// Handle background sync (optional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(
      // Perform background sync operations here
      Promise.resolve()
    );
  }
});

// Handle push notifications (optional)
self.addEventListener('push', (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/logo.svg',
      badge: '/logo.svg'
    };
    
    event.waitUntil(
      self.registration.showNotification('MyTube', options)
    );
  }
});

console.log('Service Worker: Loaded successfully');