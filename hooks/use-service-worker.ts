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
          console.log('Service Worker registered successfully')
          setRegistration(reg)
          setIsRegistered(true)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
          setIsRegistered(false)
        })
    } else {
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