'use client'

import { useEffect, useRef, useCallback } from 'react'
import { SimpleVideo } from '@/lib/type-compatibility'

interface NotificationServiceHook {
  requestPermission: () => Promise<boolean>
  showPlaybackNotification: (video: SimpleVideo, isPlaying: boolean) => void
  hideNotification: () => void
  updateMediaSession: (video: SimpleVideo, isPlaying: boolean, currentTime?: number, duration?: number) => void
  clearMediaSession: () => void
}

export function useNotificationService(): NotificationServiceHook {
  const notificationRef = useRef<Notification | null>(null)
  const permissionGrantedRef = useRef<boolean>(false)

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      permissionGrantedRef.current = true
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      permissionGrantedRef.current = permission === 'granted'
      return permission === 'granted'
    }

    return false
  }, [])

  // Show playback notification
  const showPlaybackNotification = useCallback((video: SimpleVideo, isPlaying: boolean) => {
    // Try to request permission if not already granted
    if (!permissionGrantedRef.current) {
      requestPermission()
    }

    // Hide existing notification
    if (notificationRef.current) {
      notificationRef.current.close()
    }

    const icon = video.thumbnail || '/logo.svg'
    
    try {
      notificationRef.current = new Notification(`🎵 ${isPlaying ? 'Now Playing' : 'Paused'}`, {
        body: `${video.title} - ${video.channelName}`,
        icon,
        badge: '/logo.svg',
        tag: 'video-playback',
        requireInteraction: false,
        silent: false
      })

      // Vibrate if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200])
      }

      // Add actions if supported (Chrome on Android)
      if ('actions' in Notification.prototype) {
        // Note: Actions are not widely supported, mainly on Android Chrome
        console.log('Notification actions supported but not implemented for cross-browser compatibility')
      }

      // Handle notification clicks
      notificationRef.current.onclick = (event) => {
        event.preventDefault()
        window.focus()
        
        // Focus the tab and bring it to front
        if (window.parent !== window) {
          window.parent.focus()
        }
      }

      // Handle notification actions
      notificationRef.current.onshow = () => {
        console.log('Playback notification shown')
      }

      notificationRef.current.onerror = (error) => {
        console.error('Notification error:', error)
      }

    } catch (error) {
      console.error('Failed to show notification:', error)
      // Fallback: console notification
      console.log(`🎵 ${isPlaying ? 'Now Playing' : 'Paused'}: ${video.title} - ${video.channelName}`)
    }
  }, [requestPermission])

  // Hide notification
  const hideNotification = useCallback(() => {
    if (notificationRef.current) {
      notificationRef.current.close()
      notificationRef.current = null
    }
  }, [])

  // Update Media Session API for browser controls
  const updateMediaSession = useCallback((
    video: SimpleVideo, 
    isPlaying: boolean, 
    currentTime: number = 0, 
    duration: number = 0
  ) => {
    if (!('mediaSession' in navigator)) {
      return
    }

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: video.title,
        artist: video.channelName,
        album: 'MyTube',
        artwork: [
          {
            src: video.thumbnail || '/logo.svg',
            sizes: '96x96',
            type: 'image/jpeg'
          },
          {
            src: video.thumbnail || '/logo.svg',
            sizes: '128x128',
            type: 'image/jpeg'
          },
          {
            src: video.thumbnail || '/logo.svg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: video.thumbnail || '/logo.svg',
            sizes: '256x256',
            type: 'image/jpeg'
          },
          {
            src: video.thumbnail || '/logo.svg',
            sizes: '384x384',
            type: 'image/jpeg'
          },
          {
            src: video.thumbnail || '/logo.svg',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      })

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'

      // Set position state if available
      if (duration > 0) {
        navigator.mediaSession.setPositionState({
          duration,
          playbackRate: 1,
          position: currentTime
        })
      }

      // Add action handlers
      navigator.mediaSession.setActionHandler('play', () => {
        window.dispatchEvent(new CustomEvent('media-session-play'))
      })

      navigator.mediaSession.setActionHandler('pause', () => {
        window.dispatchEvent(new CustomEvent('media-session-pause'))
      })

      navigator.mediaSession.setActionHandler('stop', () => {
        window.dispatchEvent(new CustomEvent('media-session-stop'))
      })

      navigator.mediaSession.setActionHandler('seekbackward', () => {
        window.dispatchEvent(new CustomEvent('media-session-seek-backward', { detail: 10 }))
      })

      navigator.mediaSession.setActionHandler('seekforward', () => {
        window.dispatchEvent(new CustomEvent('media-session-seek-forward', { detail: 10 }))
      })

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        window.dispatchEvent(new CustomEvent('media-session-previous'))
      })

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        window.dispatchEvent(new CustomEvent('media-session-next'))
      })

    } catch (error) {
      console.error('Media Session API error:', error)
    }
  }, [])

  // Clear Media Session
  const clearMediaSession = useCallback(() => {
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = null
        navigator.mediaSession.playbackState = 'none'
        
        // Clear action handlers
        const actions = ['play', 'pause', 'stop', 'seekbackward', 'seekforward', 'previoustrack', 'nexttrack']
        actions.forEach(action => {
          navigator.mediaSession.setActionHandler(action as any, null)
        })
      } catch (error) {
        console.error('Error clearing media session:', error)
      }
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      hideNotification()
      clearMediaSession()
    }
  }, [hideNotification, clearMediaSession])

  return {
    requestPermission,
    showPlaybackNotification,
    hideNotification,
    updateMediaSession,
    clearMediaSession
  }
}