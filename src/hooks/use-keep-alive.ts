'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useServiceWorker } from './use-service-worker'

/* eslint-disable no-var */
interface KeepAliveServiceHook {
  startKeepAlive: () => void
  stopKeepAlive: () => void
  requestWakeLock: () => Promise<boolean>
  releaseWakeLock: () => void
}

export function useKeepAliveService(): KeepAliveServiceHook {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const wakeLockRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  
  const { isSupported, isRegistered, startKeepAlive: startSWKeepAlive, stopKeepAlive: stopSWKeepAlive, sendKeepAliveMessage } = useServiceWorker()

  // Request Wake Lock API to prevent screen from turning off
  const requestWakeLock = useCallback(async (): Promise<boolean> => {
    if ('wakeLock' in navigator && 'request' in navigator.wakeLock) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
        
        wakeLockRef.current.addEventListener('release', () => {
          console.log('Wake Lock released')
          wakeLockRef.current = null
        })

        console.log('Wake Lock granted')
        return true
      } catch (error) {
        console.warn('Could not obtain Wake Lock:', error)
        return false
      }
    }
    return false
  }, [])

  // Release Wake Lock
  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release()
      wakeLockRef.current = null
    }
  }, [])

  // Start keep-alive mechanisms
  const startKeepAlive = useCallback(() => {
    // 1. Start service worker keep-alive if available
    if (isSupported && isRegistered) {
      try {
        startSWKeepAlive()
      } catch (error) {
        console.warn('Service worker keep-alive failed, using fallback:', error)
      }
    }

    // 2. Prevent tab suspension with periodic activity
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      // Simulate user activity to prevent tab suspension
      if (document.hidden) {
        // Create a tiny mouse movement event
        var event = new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: Math.random() * 100,
          clientY: Math.random() * 100
        })
        document.dispatchEvent(event)
      }

      // Send keep-alive message to service worker
      if (isSupported && isRegistered) {
        try {
          sendKeepAliveMessage()
        } catch (error) {
          console.warn('Service worker keep-alive message failed:', error)
        }
      }

      // Keep service worker active if available
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        try {
          navigator.serviceWorker.controller.postMessage({
            type: 'KEEP_ALIVE',
            timestamp: Date.now()
          })
        } catch (error) {
          console.warn('Direct service worker message failed:', error)
        }
      }
    }, 30000) // Every 30 seconds

    // 3. Create silent audio context to prevent audio suspension
    if (!audioContextRef.current) {
      try {
        var AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        audioContextRef.current = new AudioContextClass()
        
        // Create a silent oscillator to keep audio context active
        oscillatorRef.current = audioContextRef.current.createOscillator()
        var gainNode = audioContextRef.current.createGain()
        
        oscillatorRef.current.connect(gainNode)
        gainNode.connect(audioContextRef.current.destination)
        gainNode.gain.value = 0.00001 // Almost silent
        
        oscillatorRef.current.start()
      } catch (error) {
        console.warn('Could not create audio context for keep-alive:', error)
      }
    }

    // 4. Request wake lock if available
    requestWakeLock()

    // 5. Prevent page from being hidden
    var handleVisibilityChange = function() {
      if (document.hidden) {
        // Tab is hidden, ensure playback continues
        console.log('Tab hidden, keeping playback alive')
        
        // Send immediate keep-alive when tab becomes hidden
        if (isSupported && isRegistered) {
          try {
            sendKeepAliveMessage()
          } catch (error) {
            console.warn('Visibility change keep-alive failed:', error)
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 6. Keep WebSocket connections alive if any (DISABLED - NO WEBSOCKET SERVER)
    var keepWebSocketAlive = function() {
      console.log('🚫 [KEEP-ALIVE] WebSocket keep-alive disabled - no WebSocket server available')
      return
      /*
      if ('WebSocket' in window) {
        // Send ping to any active WebSocket connections
        var originalSend = WebSocket.prototype.send
        WebSocket.prototype.send = function(data) {
          try {
            return originalSend.call(this, data)
          } catch (error) {
            console.warn('WebSocket send failed:', error)
          }
        }
      }
      */
    }

    keepWebSocketAlive()

    return function() {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isSupported, isRegistered, startSWKeepAlive, sendKeepAliveMessage, requestWakeLock])

  // Stop keep-alive mechanisms
  const stopKeepAlive = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (oscillatorRef.current) {
      oscillatorRef.current.stop()
      oscillatorRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    // Stop service worker keep-alive
    if (isSupported && isRegistered) {
      stopSWKeepAlive()
    }

    releaseWakeLock()
  }, [isSupported, isRegistered, stopSWKeepAlive, releaseWakeLock])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopKeepAlive()
    }
  }, [stopKeepAlive])

  return {
    startKeepAlive,
    stopKeepAlive,
    requestWakeLock,
    releaseWakeLock
  }
}