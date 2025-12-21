// Service Worker for MyTube Application
// This file handles offline caching and background functionality

const CACHE_NAME = 'mytube-v1'
const urlsToCache = [
  '/',
  '/api/health',
  '/api/watched',
  '/api/favorites',
  '/api/notes',
  '/api/channels',
  '/api/notebooks'
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files')
        return cache.addAll(urlsToCache)
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache files', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and API requests that should always be fresh
  if (event.request.method !== 'GET' || 
      event.request.url.includes('/api/youtube/') ||
      event.request.url.includes('/api/notes/') && event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url)
          return response
        }

        // Clone the request because it's a one-time use stream
        const fetchRequest = event.request.clone()

        return fetch(fetchRequest)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Clone the response because it's a one-time use stream
            const responseToCache = response.clone()

            caches.open(CACHE_NAME)
              .then((cache) => {
                console.log('Service Worker: Caching new resource', event.request.url)
                cache.put(event.request, responseToCache)
              })
              .catch((error) => {
                console.error('Service Worker: Failed to cache resource', error)
              })

            return response
          })
          .catch((error) => {
            console.error('Service Worker: Fetch failed', error)
            
            // Try to serve from cache as fallback
            return caches.match(event.request)
          })
      })
  )
})

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})