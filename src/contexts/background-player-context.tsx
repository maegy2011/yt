'use client'

import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react'
import { SimpleVideo } from '@/lib/type-compatibility'
import { useNotificationService } from '@/hooks/use-notification-service'
import { useKeepAliveService } from '@/hooks/use-keep-alive'

interface BackgroundPlayerContextType {
  backgroundVideo: SimpleVideo | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isBackgroundMode: boolean
  showMiniPlayer: boolean
  playerRef: any
  
  // Actions
  playBackgroundVideo: (video: SimpleVideo) => void
  pauseBackgroundVideo: () => void
  stopBackgroundVideo: () => void
  seekTo: (time: number) => void
  setVolume: (volume: number) => void
  toggleBackgroundMode: () => void
  toggleMiniPlayer: () => void
  updateCurrentTime: (time: number) => void
  updateDuration: (duration: number) => void
  updatePlayingState: (isPlaying: boolean) => void
}

const BackgroundPlayerContext = createContext<BackgroundPlayerContextType | undefined>(undefined)

export function useBackgroundPlayer() {
  const context = useContext(BackgroundPlayerContext)
  if (!context) {
    throw new Error('useBackgroundPlayer must be used within BackgroundPlayerProvider')
  }
  return context
}

interface BackgroundPlayerProviderProps {
  children: ReactNode
}

export function BackgroundPlayerProvider({ children }: BackgroundPlayerProviderProps) {
  const [backgroundVideo, setBackgroundVideo] = useState<SimpleVideo | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [isBackgroundMode, setIsBackgroundMode] = useState(false)
  const [showMiniPlayer, setShowMiniPlayer] = useState(false)
  const playerRef = useRef<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Watched tracking state
  const [watchedTracking, setWatchedTracking] = useState<{
    videoId: string | null
    startTime: number | null
    hasBeenLogged: boolean
  }>({
    videoId: null,
    startTime: null,
    hasBeenLogged: false
  })

  // Notification and Keep-Alive services
  const {
    requestPermission,
    showPlaybackNotification,
    hideNotification,
    updateMediaSession,
    clearMediaSession
  } = useNotificationService()

  const {
    startKeepAlive,
    stopKeepAlive,
    requestWakeLock,
    releaseWakeLock
  } = useKeepAliveService()

  // Function to add video to watched history
  const addToWatchedHistory = useCallback(async (video: SimpleVideo) => {
    try {
      const videoId = video.videoId || video.id
      await fetch('/api/watched', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: videoId,
          title: video.title,
          channelName: video.channelName,
          thumbnail: video.thumbnail,
          duration: video.duration,
          viewCount: video.viewCount
        })
      })
      console.log('Video added to watched history:', video.title)
    } catch (error) {
      console.error('Failed to add to watched history:', error)
    }
  }, [])

  // Monitor current time when playing
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    intervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        try {
          const time = playerRef.current.getCurrentTime()
          setCurrentTime(time)
          
          // Check if 5 seconds have passed and video hasn't been logged yet
          if (backgroundVideo && !watchedTracking.hasBeenLogged && time >= 5) {
            addToWatchedHistory(backgroundVideo)
            setWatchedTracking(prev => ({ ...prev, hasBeenLogged: true }))
          }
        } catch (error) {
          console.error('Error getting current time:', error)
        }
      }
    }, 1000) // Update every second for background mode
  }, [backgroundVideo, watchedTracking.hasBeenLogged, addToWatchedHistory])

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const playBackgroundVideo = useCallback((video: SimpleVideo) => {
    setBackgroundVideo(video)
    setIsBackgroundMode(true)
    setShowMiniPlayer(true)
    setIsPlaying(true)
    
    // Reset watched tracking for new video
    const videoId = video.videoId || video.id
    setWatchedTracking({
      videoId,
      startTime: Date.now(),
      hasBeenLogged: false
    })
    
    startMonitoring()
    
    // Request notification permission on first use
    requestPermission()
    
    // Show playback notification
    showPlaybackNotification(video, true)
    
    // Update media session for browser controls
    updateMediaSession(video, true, currentTime, duration)
    
    // Start keep-alive mechanisms
    startKeepAlive()
  }, [startMonitoring, requestPermission, showPlaybackNotification, updateMediaSession, startKeepAlive, currentTime, duration])

  const pauseBackgroundVideo = useCallback(() => {
    setIsPlaying(false)
    if (playerRef.current) {
      playerRef.current.pauseVideo()
    }
    stopMonitoring()
    
    // Update notification and media session
    if (backgroundVideo) {
      showPlaybackNotification(backgroundVideo, false)
      updateMediaSession(backgroundVideo, false, currentTime, duration)
    }
  }, [stopMonitoring, backgroundVideo, showPlaybackNotification, updateMediaSession, currentTime, duration])

  const stopBackgroundVideo = useCallback(() => {
    setBackgroundVideo(null)
    setIsPlaying(false)
    setIsBackgroundMode(false)
    setShowMiniPlayer(false)
    setCurrentTime(0)
    setDuration(0)
    
    // Reset watched tracking
    setWatchedTracking({
      videoId: null,
      startTime: null,
      hasBeenLogged: false
    })
    
    if (playerRef.current) {
      playerRef.current.stopVideo()
    }
    stopMonitoring()
    
    // Hide notification and clear media session
    hideNotification()
    clearMediaSession()
    
    // Stop keep-alive mechanisms
    stopKeepAlive()
  }, [stopMonitoring, hideNotification, clearMediaSession, stopKeepAlive])

  const seekTo = useCallback((time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time, true)
      setCurrentTime(time)
    }
  }, [])

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume)
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume * 100)
    }
  }, [])

  const toggleBackgroundMode = useCallback(() => {
    setIsBackgroundMode(prev => !prev)
  }, [])

  const toggleMiniPlayer = useCallback(() => {
    setShowMiniPlayer(prev => !prev)
  }, [])

  const updateCurrentTime = useCallback((time: number) => {
    setCurrentTime(time)
  }, [])

  const updateDuration = useCallback((newDuration: number) => {
    setDuration(newDuration)
  }, [])

  const updatePlayingState = useCallback((playing: boolean) => {
    setIsPlaying(playing)
    if (playing) {
      startMonitoring()
    } else {
      stopMonitoring()
    }
  }, [startMonitoring, stopMonitoring])

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    stopMonitoring()
    hideNotification()
    clearMediaSession()
    stopKeepAlive()
  }, [stopMonitoring, hideNotification, clearMediaSession, stopKeepAlive])

  // Handle media session events
  useEffect(() => {
    const handleMediaSessionPlay = () => {
      if (backgroundVideo && !isPlaying) {
        // Resume playback
        setIsPlaying(true)
        if (playerRef.current) {
          playerRef.current.playVideo()
        }
        showPlaybackNotification(backgroundVideo, true)
        updateMediaSession(backgroundVideo, true, currentTime, duration)
      }
    }

    const handleMediaSessionPause = () => {
      if (backgroundVideo && isPlaying) {
        pauseBackgroundVideo()
      }
    }

    const handleMediaSessionStop = () => {
      if (backgroundVideo) {
        stopBackgroundVideo()
      }
    }

    const handleMediaSessionSeekBackward = (event: CustomEvent) => {
      const seekTime = event.detail || 10
      seekTo(Math.max(0, currentTime - seekTime))
    }

    const handleMediaSessionSeekForward = (event: CustomEvent) => {
      const seekTime = event.detail || 10
      seekTo(Math.min(duration, currentTime + seekTime))
    }

    const handleMediaSessionPrevious = () => {
      // This would be handled by the parent component
      console.log('Previous track requested')
    }

    const handleMediaSessionNext = () => {
      // This would be handled by the parent component
      console.log('Next track requested')
    }

    // Add event listeners
    window.addEventListener('media-session-play', handleMediaSessionPlay as EventListener)
    window.addEventListener('media-session-pause', handleMediaSessionPause as EventListener)
    window.addEventListener('media-session-stop', handleMediaSessionStop as EventListener)
    window.addEventListener('media-session-seek-backward', handleMediaSessionSeekBackward as EventListener)
    window.addEventListener('media-session-seek-forward', handleMediaSessionSeekForward as EventListener)
    window.addEventListener('media-session-previous', handleMediaSessionPrevious as EventListener)
    window.addEventListener('media-session-next', handleMediaSessionNext as EventListener)

    return () => {
      window.removeEventListener('media-session-play', handleMediaSessionPlay as EventListener)
      window.removeEventListener('media-session-pause', handleMediaSessionPause as EventListener)
      window.removeEventListener('media-session-stop', handleMediaSessionStop as EventListener)
      window.removeEventListener('media-session-seek-backward', handleMediaSessionSeekBackward as EventListener)
      window.removeEventListener('media-session-seek-forward', handleMediaSessionSeekForward as EventListener)
      window.removeEventListener('media-session-previous', handleMediaSessionPrevious as EventListener)
      window.removeEventListener('media-session-next', handleMediaSessionNext as EventListener)
    }
  }, [backgroundVideo, isPlaying, currentTime, duration, pauseBackgroundVideo, stopBackgroundVideo, seekTo, showPlaybackNotification, updateMediaSession])

  // Update media session when time changes
  useEffect(() => {
    if (backgroundVideo && isPlaying) {
      updateMediaSession(backgroundVideo, true, currentTime, duration)
    }
  }, [backgroundVideo, isPlaying, currentTime, duration, updateMediaSession])

  return (
    <BackgroundPlayerContext.Provider
      value={{
        backgroundVideo,
        isPlaying,
        currentTime,
        duration,
        volume,
        isBackgroundMode,
        showMiniPlayer,
        playerRef,
        playBackgroundVideo,
        pauseBackgroundVideo,
        stopBackgroundVideo,
        seekTo,
        setVolume,
        toggleBackgroundMode,
        toggleMiniPlayer,
        updateCurrentTime,
        updateDuration,
        updatePlayingState,
      }}
    >
      {children}
    </BackgroundPlayerContext.Provider>
  )
}