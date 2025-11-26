// Service Worker for MyTube YouTube Clone
// Handles background playback, caching, and keep-alive functionality

const CACHE_NAME = 'mytube-v1'
const STATIC_CACHE = 'mytube-static-v1'
const DYNAMIC_CACHE = 'mytube-dynamic-v1'

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/logo.svg',
  '/favicon.ico'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Static assets cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker activated')
        return self.clients.claim()
      })
      .catch((error) => {
        console.error('Failed to activate service worker:', error)
      })
  )
})

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip chrome-extension requests
  if (request.url.startsWith('chrome-extension://')) {
    return
  }
  
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response
        }
        
        // Otherwise fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }
            
            // Clone the response since it can only be consumed once
            const responseToCache = response.clone()
            
            // Cache dynamic resources
            if (shouldCache(request)) {
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache)
                })
                .catch((error) => {
                  console.warn('Failed to cache dynamic resource:', error)
                })
            }
            
            return response
          })
          .catch((error) => {
            console.warn('Network request failed:', error)
            
            // Return offline page for navigation requests if available
            if (request.destination === 'document') {
              return caches.match('/')
            }
          })
      })
  )
})

// Determine if a request should be cached
function shouldCache(request) {
  const url = new URL(request.url)
  
  // Cache API responses
  if (url.pathname.startsWith('/api/')) {
    return true
  }
  
  // Cache static assets
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    return true
  }
  
  return false
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data
  
  switch (type) {
    case 'KEEP_ALIVE':
      console.log('Service Worker keep-alive message received:', data?.timestamp)
      // Respond to keep the service worker active
      event.ports?.[0]?.postMessage({
        type: 'KEEP_ALIVE_RESPONSE',
        timestamp: Date.now()
      })
      break
      
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'GET_VERSION':
      event.ports?.[0]?.postMessage({
        type: 'VERSION_RESPONSE',
        version: CACHE_NAME
      })
      break
      
    default:
      console.log('Unknown message type:', type)
  }
})

// Handle push notifications (if needed in the future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    console.log('Push notification received:', data)
    
    // Show notification if needed
    if (data.title) {
      event.waitUntil(
        self.registration.showNotification(data.title, {
          body: data.body || '',
          icon: '/logo.svg',
          badge: '/logo.svg',
          tag: 'mytube-notification'
        })
      )
    }
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  
  event.notification.close()
  
  // Focus or open the app
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus()
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow('/')
        }
      })
  )
})

// Handle background sync (if needed)
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform background sync tasks here
      Promise.resolve()
    )
  }
})

// Periodic background sync for keeping the service worker active
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'keep-alive-sync') {
    console.log('Periodic sync for keep-alive')
    event.waitUntil(
      // Perform periodic tasks
      Promise.resolve()
    )
  }
})

console.log('Service Worker loaded successfully')