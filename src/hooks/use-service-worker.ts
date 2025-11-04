'use client'

import { useEffect, useState } from 'react'

interface ServiceWorkerHook {
  isSupported: boolean
  isRegistered: boolean
  registration: ServiceWorkerRegistration | null
  startKeepAlive: () => void
  stopKeepAlive: () => void
  sendKeepAliveMessage: () => void
}

export function useServiceWorker(): ServiceWorkerHook {
  const [isSupported, setIsSupported] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
      setIsSupported(true)
      
      // Register service worker with error handling
      navigator.serviceWorker.register('/sw.js')
        .then(function(reg) {
          console.log('Service Worker registered successfully:', reg.scope)
          setRegistration(reg)
          setIsRegistered(true)
          
          // Listen for updates
          reg.addEventListener('updatefound', function() {
            const newWorker = reg.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', function() {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New worker is ready, inform user
                  console.log('New service worker available - refresh to update')
                }
              })
            }
          })
        })
        .catch(function(error) {
          console.error('Service Worker registration failed:', error)
          console.log('Keep-alive features will work with reduced functionality')
          
          // Don't set isSupported to false, just log the error
          // The app can still work without service worker
        })
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'SERVICE_WORKER_KEEP_ALIVE') {
          console.log('Keep-alive message from service worker:', new Date(event.data.timestamp))
        }
        
        if (event.data && event.data.type === 'NOTIFICATION_ACTION') {
          console.log('Notification action received:', event.data.action)
          
          // Dispatch custom event for the background player to handle
          const customEvent = new CustomEvent('notification-action', {
            detail: {
              action: event.data.action,
              notification: event.data.notification
            }
          })
          window.dispatchEvent(customEvent)
        }
      })
      
      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', function() {
        console.log('Service Worker controller changed')
        // Optionally reload the page
        // window.location.reload()
      })
    } else {
      console.warn('Service Workers are not supported in this browser')
      console.log('Keep-alive features will work with reduced functionality')
    }
  }, [])

  const startKeepAlive = function() {
    if (registration && registration.active) {
      try {
        registration.active.postMessage({
          type: 'START_KEEP_ALIVE'
        })
      } catch (error) {
        console.error('Failed to start service worker keep-alive:', error)
      }
    }
  }

  const stopKeepAlive = function() {
    if (registration && registration.active) {
      try {
        registration.active.postMessage({
          type: 'STOP_KEEP_ALIVE'
        })
      } catch (error) {
        console.error('Failed to stop service worker keep-alive:', error)
      }
    }
  }

  const sendKeepAliveMessage = function() {
    if (registration && registration.active) {
      try {
        const messageChannel = new MessageChannel()
        
        messageChannel.port1.onmessage = function(event) {
          if (event.data && event.data.type === 'KEEP_ALIVE_RESPONSE') {
            console.log('Keep-alive response received:', new Date(event.data.timestamp))
          }
        }
        
        registration.active.postMessage({
          type: 'KEEP_ALIVE'
        }, [messageChannel.port2])
      } catch (error) {
        console.error('Failed to send keep-alive message:', error)
      }
    }
  }

  return {
    isSupported,
    isRegistered,
    registration,
    startKeepAlive,
    stopKeepAlive,
    sendKeepAliveMessage
  }
}