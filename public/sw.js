// Service Worker for keep-alive and background playback support

const CACHE_NAME = 'mytube-background-v1'
const KEEP_ALIVE_INTERVAL = 30000 // 30 seconds

// Install event
self.addEventListener('install', function(event) {
  console.log('Service Worker installing...')
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll([
        '/',
        '/logo.svg'
      ])
    })
  )
})

// Activate event
self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...')
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Keep-alive message handling
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'KEEP_ALIVE') {
    console.log('Keep-alive ping received at:', new Date().toISOString())
    
    // Respond to keep the service worker active
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        type: 'KEEP_ALIVE_RESPONSE',
        timestamp: Date.now()
      })
    }
  }
})

// Background sync for playback state
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-playback') {
    event.waitUntil(
      // Handle any background sync tasks here
      console.log('Background sync for playback')
    )
  }
})

// Push notification handling
self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      var data = event.data.json()
      
      if (data.type === 'PLAYBACK_NOTIFICATION') {
        event.waitUntil(
          self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon,
            badge: '/logo.svg',
            tag: 'background-playback',
            requireInteraction: false
          })
        )
      }
    } catch (error) {
      console.error('Error parsing push data:', error)
    }
  }
})

// Notification click handling
self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  
  if (event.action) {
    // Handle notification action
    console.log('Notification action:', event.action)
    
    // Send message to all clients
    event.waitUntil(
      clients.matchAll().then(function(clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i]
          client.postMessage({
            type: 'NOTIFICATION_ACTION',
            action: event.action,
            notification: event.notification
          })
        }
      })
    )
  } else {
    // Focus the window when notification is clicked
    event.waitUntil(
      clients.matchAll().then(function(clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i]
          if (client.url && client.focus) {
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/')
        }
      })
    )
  }
})

// Periodic keep-alive
var keepAliveTimer = null

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'START_KEEP_ALIVE') {
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer)
    }
    
    keepAliveTimer = setInterval(function() {
      // Keep the service worker active
      console.log('Service worker keep-alive:', new Date().toISOString())
      
      // Optionally send a message to all clients
      clients.matchAll().then(function(clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i]
          client.postMessage({
            type: 'SERVICE_WORKER_KEEP_ALIVE',
            timestamp: Date.now()
          })
        }
      })
    }, KEEP_ALIVE_INTERVAL)
  }
  
  if (event.data && event.data.type === 'STOP_KEEP_ALIVE') {
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer)
      keepAliveTimer = null
    }
  }
})

// Fetch event for offline support
self.addEventListener('fetch', function(event) {
  // Basic offline support for essential resources
  if (event.request.url.indexOf('/logo.svg') !== -1) {
    event.respondWith(
      caches.match(event.request).then(function(response) {
        return response || fetch(event.request)
      })
    )
  }
})