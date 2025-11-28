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
          // Console statement removed
          setRegistration(reg)
          setIsRegistered(true)
          
          // Listen for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (newWorker) {
              // Console statement removed
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New worker is available, show update notification if needed
                  // Console statement removed
                }
              })
            }
          })
          
          // Check if service worker is already controlling the page
          if (navigator.serviceWorker.controller) {
            // Console statement removed
          }
        })
        .catch((error) => {
          // Console statement removed
          setIsRegistered(false)
          
          // Don't treat this as a critical error - app can work without service worker
          if (error.name === 'TypeError' && (error.message.includes('404') || error.message.includes('Failed to fetch'))) {
            // Console info removed
          }
        })
    } else {
      // Console info removed
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