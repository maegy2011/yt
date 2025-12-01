/**
 * Background Player Context
 * 
 * A comprehensive React context that manages background audio/video playback throughout the MyTube application.
 * Enables users to continue listening to audio while navigating between pages or using other apps.
 * 
 * Features:
 * - Background audio playback with YouTube iframe API
 * - Playback position persistence and restoration
 * - Media session API integration for system controls
 * - Wake lock to prevent screen sleep during playback
 * - Keep-alive service to maintain playback
 * - Mini player UI controls
 * - Volume control and seeking functionality
 * - Memory management and cleanup
 * - Cross-tab communication
 * 
 * @component BackgroundPlayerProvider
 * @hook useBackgroundPlayer
 * @author MyTube Team
 * @version 2.0.0
 */

'use client'

// React hooks and utilities
import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react'

// Type definitions
import { SimpleVideo } from '@/lib/type-compatibility'

// Custom hooks for background functionality
import { usePlaybackPosition } from '@/hooks/use-playback-position'
import { useKeepAliveService } from '@/hooks/use-keep-alive'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Background player context interface
 * Defines all state and actions available through the context
 */
interface BackgroundPlayerContextType {
  // Current playback state
  backgroundVideo: SimpleVideo | null      // Currently playing video
  isPlaying: boolean                       // Playback status
  currentTime: number                       // Current playback time in seconds
  duration: number                         // Total video duration in seconds
  volume: number                           // Volume level (0.0 - 1.0)
  isBackgroundMode: boolean                 // Background mode active state
  showMiniPlayer: boolean                   // Mini player visibility
  playerRef: any                          // Reference to YouTube player instance
  savedPosition: number | null              // Saved playback position
  settingsTitle: string | null             // Title for settings display
  
  // Playback control actions
  playBackgroundVideo: (video: SimpleVideo) => void     // Start playing video in background
  pauseBackgroundVideo: () => void                        // Pause current playback
  stopBackgroundVideo: () => void                         // Stop playback completely
  seekTo: (time: number) => void                         // Seek to specific time
  setVolume: (volume: number) => void                       // Set volume level
  toggleBackgroundMode: () => void                        // Toggle background mode
  toggleMiniPlayer: () => void                             // Toggle mini player visibility
  updateCurrentTime: (time: number) => void                // Update current time
  updateDuration: (duration: number) => void                // Update video duration
  updatePlayingState: (isPlaying: boolean) => void        // Update playing state
  resumeFromSavedPosition: () => void                       // Resume from saved position
  setSettingsTitle: (title: string) => void                // Set settings title
}

// ============================================================================
// CONTEXT SETUP
// ============================================================================

// Create the background player context with undefined default
const BackgroundPlayerContext = createContext<BackgroundPlayerContextType | undefined>(undefined)

/**
 * Custom hook to access the background player context
 * Throws an error if used outside of BackgroundPlayerProvider
 * 
 * @returns {BackgroundPlayerContextType} Background player context value
 * @throws {Error} If used outside provider
 */
export function useBackgroundPlayer() {
  const context = useContext(BackgroundPlayerContext)
  if (!context) {
    throw new Error('useBackgroundPlayer must be used within BackgroundPlayerProvider')
  }
  return context
}

/**
 * Props interface for BackgroundPlayerProvider component
 */
interface BackgroundPlayerProviderProps {
  children: ReactNode  // Child components to wrap
}

// ============================================================================
// BACKGROUND PLAYER PROVIDER COMPONENT
// ============================================================================

/**
 * Background Player Provider Component
 * 
 * Provides background audio playback functionality throughout the application.
 * Manages YouTube iframe player, playback state, and system integration.
 * 
 * @param props - Component props containing children
 * @returns {JSX.Element} Provider component with background player functionality
 */
export function BackgroundPlayerProvider({ children }: BackgroundPlayerProviderProps) {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  // Core playback state
  const [backgroundVideo, setBackgroundVideo] = useState<SimpleVideo | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [isBackgroundMode, setIsBackgroundMode] = useState(false)
  const [showMiniPlayer, setShowMiniPlayer] = useState(false)
  const [savedPosition, setSavedPosition] = useState<number | null>(null)
  const [settingsTitle, setSettingsTitleState] = useState<string | null>(null)
  
  // Refs for DOM and timer management
  const playerRef = useRef<any>(null)              // YouTube player reference
  const intervalRef = useRef<NodeJS.Timeout | null>(null)  // Time update interval
  
  // ============================================================================
  // CUSTOM HOOKS
  // ============================================================================
  
  // Keep-alive service for preventing sleep and maintaining playback
  const {
    startKeepAlive,
    stopKeepAlive,
    requestWakeLock,
    releaseWakeLock
  } = useKeepAliveService()

  // Playback position persistence for resuming playback
  const {
    playbackPosition,
    savePlaybackPosition,
    loadPlaybackPosition
  } = usePlaybackPosition(backgroundVideo?.videoId || '')

  // ============================================================================
  // PLAYBACK MONITORING
  // ============================================================================

  /**
   * Start monitoring playback time and position
   * Updates current time every 5 seconds and saves position periodically
   * Less frequent than main player to optimize for background usage
   */
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    intervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        try {
          const time = playerRef.current.getCurrentTime()
          setCurrentTime(time)
          
          // Save playback position periodically for persistence
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
          // Error getting current time, continue without update
          console.warn('Error getting current time:', error)
        }
      }
    }, 5000) // Update every 5 seconds for background mode (less frequent than main player)
  }, [backgroundVideo, duration, savePlaybackPosition])

  /**
   * Stop monitoring playback time
   * Clears the interval and resets monitoring state
   */
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // ============================================================================
  // PLAYBACK CONTROL FUNCTIONS
  // ============================================================================

  /**
   * Start playing a video in background mode
   * Loads saved position, starts monitoring, and activates keep-alive mechanisms
   * 
   * @param video - Video object to play in background
   */
  const playBackgroundVideo = useCallback(async (video: SimpleVideo) => {
    setBackgroundVideo(video)
    setIsBackgroundMode(true)
    setShowMiniPlayer(true)
    setIsPlaying(true)
    
    // Load saved position for this video if available
    const savedTime = await loadPlaybackPosition(video.videoId)
    setSavedPosition(savedTime > 0 ? savedTime : null)
    
    startMonitoring()
    
    // Start keep-alive mechanisms to prevent sleep and maintain playback
    startKeepAlive()
  }, [loadPlaybackPosition, startMonitoring, startKeepAlive])

  /**
   * Pause background video playback
   * Pauses the YouTube player and stops time monitoring
   */
  const pauseBackgroundVideo = useCallback(() => {
    setIsPlaying(false)
    if (playerRef.current) {
      playerRef.current.pauseVideo()
    }
    stopMonitoring()
  }, [stopMonitoring])

  /**
   * Stop background video playback completely
   * Saves final position, clears state, and stops all services
   */
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
        true // immediate save flag
      )
    }
    
    // Reset all playback state
    setBackgroundVideo(null)
    setIsPlaying(false)
    setIsBackgroundMode(false)
    setShowMiniPlayer(false)
    setCurrentTime(0)
    setDuration(0)
    setSavedPosition(null)
    
    // Stop YouTube player
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
    setSettingsTitleState(title)
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
        settingsTitle,
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