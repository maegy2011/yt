'use client'

import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react'
import { SimpleVideo } from '@/lib/type-compatibility'
import { usePlaybackPosition } from '@/hooks/use-playback-position'

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
  savedPosition: number | null
  settingsTitle: string | null
  
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
  resumeFromSavedPosition: () => void
  setSettingsTitle: (title: string) => void
  setSettingsTitle: (title: string) => void
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
  const [savedPosition, setSavedPosition] = useState<number | null>(null)
  const playerRef = useRef<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Keep-Alive services
  const {
    startKeepAlive,
    stopKeepAlive,
    requestWakeLock,
    releaseWakeLock
  } = useKeepAliveService()

  // Playback position hook
  const {
    playbackPosition,
    savePlaybackPosition,
    loadPlaybackPosition
  } = usePlaybackPosition(backgroundVideo?.videoId || '')

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
          
          // Save playback position periodically
          if (backgroundVideo && duration > 0) {
            savePlaybackPosition(
              backgroundVideo.videoId,
              backgroundVideo.title,
              backgroundVideo.channelName,
              backgroundVideo.thumbnail,
              duration,
              time
            )
          }
        } catch (error) {
          // Error getting current time, continuing without update
        }
      }
    }, 5000) // Update every 5 seconds for background mode (less frequent than main player)
  }, [backgroundVideo, duration, savePlaybackPosition])

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const playBackgroundVideo = useCallback(async (video: SimpleVideo) => {
    setBackgroundVideo(video)
    setIsBackgroundMode(true)
    setShowMiniPlayer(true)
    setIsPlaying(true)
    
    // Load saved position for this video
    const savedTime = await loadPlaybackPosition(video.videoId)
    setSavedPosition(savedTime > 0 ? savedTime : null)
    
    startMonitoring()
    
    // Start keep-alive mechanisms
    startKeepAlive()
  }, [loadPlaybackPosition, startMonitoring, startKeepAlive])

  const pauseBackgroundVideo = useCallback(() => {
    setIsPlaying(false)
    if (playerRef.current) {
      playerRef.current.pauseVideo()
    }
    stopMonitoring()
  }, [stopMonitoring])

  const stopBackgroundVideo = useCallback(() => {
    // Save final position before stopping
    if (backgroundVideo && currentTime > 0 && duration > 0) {
      savePlaybackPosition(
        backgroundVideo.videoId,
        backgroundVideo.title,
        backgroundVideo.channelName,
        backgroundVideo.thumbnail,
        duration,
        currentTime,
        true // immediate save
      )
    }
    
    setBackgroundVideo(null)
    setIsPlaying(false)
    setIsBackgroundMode(false)
    setShowMiniPlayer(false)
    setCurrentTime(0)
    setDuration(0)
    setSavedPosition(null)
    
    if (playerRef.current) {
      playerRef.current.stopVideo()
    }
    stopMonitoring()
    
    // Stop keep-alive mechanisms
    stopKeepAlive()
  }, [backgroundVideo, currentTime, duration, savePlaybackPosition, stopMonitoring, stopKeepAlive])

  const resumeFromSavedPosition = useCallback(() => {
    if (savedPosition && playerRef.current) {
      playerRef.current.seekTo(savedPosition, true)
      setCurrentTime(savedPosition)
      setSavedPosition(null) // Clear saved position after using it
    }
  }, [savedPosition])

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

  const setSettingsTitle = useCallback((title: string) => {
    setSettingsTitle(title)
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
    stopKeepAlive()
  }, [stopMonitoring, stopKeepAlive])

  // Handle media session events
  useEffect(() => {
    const handleMediaSessionPlay = () => {
      if (backgroundVideo && !isPlaying) {
        // Resume playback
        setIsPlaying(true)
        if (playerRef.current) {
          playerRef.current.playVideo()
        }
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
    }

    const handleMediaSessionNext = () => {
      // This would be handled by the parent component
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
  }, [backgroundVideo, isPlaying, currentTime, duration, pauseBackgroundVideo, stopBackgroundVideo, seekTo])

  

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
        savedPosition,
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
        resumeFromSavedPosition,
        setSettingsTitle,
      }}
    >
      {children}
    </BackgroundPlayerContext.Provider>
  )
}