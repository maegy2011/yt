'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

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
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check if service worker is supported
    if ('serviceWorker' in navigator) {
      setIsSupported(true)
      
      // Register service worker
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registered successfully:', reg.scope)
          setRegistration(reg)
          setIsRegistered(true)
          
          // Listen for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (newWorker) {
              console.log('Service Worker update found')
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New worker is available, show update notification if needed
                  console.log('New Service Worker available - refresh to update')
                }
              })
            }
          })
          
          // Check if service worker is already controlling the page
          if (navigator.serviceWorker.controller) {
            console.log('Service Worker is already controlling the page')
          }
        })
        .catch((error) => {
          console.warn('Service Worker registration failed:', error.message)
          setIsRegistered(false)
          
          // Don't treat this as a critical error - app can work without service worker
          if (error.name === 'TypeError' && (error.message.includes('404') || error.message.includes('Failed to fetch'))) {
            console.info('Service worker script not found - app will work without it')
          }
        })
    } else {
      console.info('Service Worker not supported in this browser')
      setIsSupported(false)
    }
  }, [])

  const startKeepAlive = useCallback(() => {
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current)
    }

    keepAliveIntervalRef.current = setInterval(() => {
      sendKeepAliveMessage()
    }, 20000) // Every 20 seconds
  }, [])

  const stopKeepAlive = useCallback(() => {
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current)
      keepAliveIntervalRef.current = null
    }
  }, [])

  const sendKeepAliveMessage = useCallback(() => {
    if (registration && registration.active) {
      registration.active.postMessage({
        type: 'KEEP_ALIVE',
        timestamp: Date.now()
      })
    }
  }, [registration])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopKeepAlive()
    }
  }, [stopKeepAlive])

  return {
    isSupported,
    isRegistered,
    registration,
    startKeepAlive,
    stopKeepAlive,
    sendKeepAliveMessage
  }
}