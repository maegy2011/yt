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
    // Service Worker is not available - disable functionality
    console.log('🚫 [SERVICE-WORKER] Service Worker disabled - no sw.js file found')
    setIsSupported(false)
    setIsRegistered(false)
    setRegistration(null)
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