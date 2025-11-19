'use client'

import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react'
import { SimpleVideo } from '@/lib/type-compatibility'

import { useKeepAliveService } from '@/hooks/use-keep-alive'

// Debug logging utility for contexts
const debugLog = (context: string, action: string, data?: any) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [Context:${context}] ${action}`, data ? data : '')
}

const debugError = (context: string, action: string, error: any) => {
  const timestamp = new Date().toISOString()
  console.error(`[${timestamp}] [Context:${context}] ERROR in ${action}:`, error)
}

const debugWarn = (context: string, action: string, warning: any) => {
  const timestamp = new Date().toISOString()
  console.warn(`[${timestamp}] [Context:${context}] WARNING in ${action}:`, warning)
}

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
  
  // Resumable playback actions
  getPlaybackPosition: (videoId: string) => Promise<number>
  savePlaybackPosition: (videoId: string, position: number, videoData?: any) => Promise<void>
  resumeFromPosition: (video: SimpleVideo) => Promise<number>
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
  debugLog('BackgroundPlayer', 'Provider initializing')
  
  const [backgroundVideo, setBackgroundVideo] = useState<SimpleVideo | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [isBackgroundMode, setIsBackgroundMode] = useState(false)
  const [showMiniPlayer, setShowMiniPlayer] = useState(false)
  const playerRef = useRef<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Keep-Alive services
  const {
    startKeepAlive,
    stopKeepAlive,
    requestWakeLock,
    releaseWakeLock
  } = useKeepAliveService()

  // Monitor current time when playing
  const startMonitoring = useCallback(() => {
    debugLog('BackgroundPlayer', 'Starting time monitoring')
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    intervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        try {
          const time = playerRef.current.getCurrentTime()
          setCurrentTime(time)
        } catch (error) {
          debugError('BackgroundPlayer', 'Error getting current time', error)
          console.error('Error getting current time:', error)
        }
      }
    }, 1000) // Update every second for background mode
  }, [])

  const stopMonitoring = useCallback(() => {
    debugLog('BackgroundPlayer', 'Stopping time monitoring')
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const playBackgroundVideo = useCallback((video: SimpleVideo) => {
    debugLog('BackgroundPlayer', 'Playing background video', { 
      videoId: video.id, 
      title: video.title?.substring(0, 50) + '...' 
    })
    setBackgroundVideo(video)
    setIsBackgroundMode(true)
    setShowMiniPlayer(true)
    setIsPlaying(true)
    
    startMonitoring()
    
    // Start keep-alive mechanisms
    startKeepAlive()
  }, [startMonitoring, startKeepAlive])

  const pauseBackgroundVideo = useCallback(() => {
    debugLog('BackgroundPlayer', 'Pausing background video')
    setIsPlaying(false)
    if (playerRef.current) {
      playerRef.current.pauseVideo()
    }
    stopMonitoring()
  }, [stopMonitoring])

  const stopBackgroundVideo = useCallback(() => {
    debugLog('BackgroundPlayer', 'Stopping background video')
    setBackgroundVideo(null)
    setIsPlaying(false)
    setIsBackgroundMode(false)
    setShowMiniPlayer(false)
    setCurrentTime(0)
    setDuration(0)
    
    if (playerRef.current) {
      playerRef.current.stopVideo()
    }
    stopMonitoring()
    
    // Stop keep-alive mechanisms
    stopKeepAlive()
  }, [stopMonitoring, stopKeepAlive])

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

  // Resumable playback functions
  const getPlaybackPosition = useCallback(async (videoId: string): Promise<number> => {
    console.log('🎯 [BACKGROUND-PLAYER] Getting playback position for video:', videoId)
    try {
      debugLog('BackgroundPlayer', 'Fetching playback position', { videoId })
      const response = await fetch(`/api/playback-position?videoId=${encodeURIComponent(videoId)}`)
      
      if (!response.ok) {
        console.error('❌ [BACKGROUND-PLAYER] Failed to fetch playback position', { videoId, status: response.status })
        debugError('BackgroundPlayer', 'Failed to fetch playback position', { status: response.status })
        return 0
      }
      
      const data = await response.json()
      const position = data.currentPosition || 0
      console.log('✅ [BACKGROUND-PLAYER] Retrieved playback position:', { videoId, position, exists: data.exists })
      debugLog('BackgroundPlayer', 'Retrieved playback position', { videoId, position })
      return position
    } catch (error) {
      console.error('💥 [BACKGROUND-PLAYER] Error fetching playback position:', { videoId, error })
      debugError('BackgroundPlayer', 'Error fetching playback position', error)
      return 0
    }
  }, [])

  const savePlaybackPosition = useCallback(async (videoId: string, position: number, videoData?: any): Promise<void> => {
    console.log('💾 [BACKGROUND-PLAYER] Saving playback position:', { videoId, position })
    try {
      debugLog('BackgroundPlayer', 'Saving playback position', { videoId, position })
      
      const payload = {
        videoId,
        currentPosition: position,
        lastWatchedAt: new Date().toISOString(),
        ...(videoData || {})
      }
      
      console.log('📤 [BACKGROUND-PLAYER] Sending save request:', { 
        videoId, 
        position, 
        hasVideoData: !!videoData,
        title: videoData?.title?.substring(0, 30) + (videoData?.title?.length > 30 ? '...' : '')
      })
      
      const response = await fetch('/api/playback-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        console.error('❌ [BACKGROUND-PLAYER] Failed to save playback position', { 
          videoId, 
          position, 
          status: response.status,
          statusText: response.statusText 
        })
        debugError('BackgroundPlayer', 'Failed to save playback position', { status: response.status })
      } else {
        console.log('✅ [BACKGROUND-PLAYER] Successfully saved playback position:', { videoId, position })
        debugLog('BackgroundPlayer', 'Successfully saved playback position', { videoId, position })
      }
    } catch (error) {
      console.error('💥 [BACKGROUND-PLAYER] Error saving playback position:', { videoId, position, error })
      debugError('BackgroundPlayer', 'Error saving playback position', error)
    }
  }, [])

  const resumeFromPosition = useCallback(async (video: SimpleVideo): Promise<number> => {
    console.log('🔄 [BACKGROUND-PLAYER] Getting resume position for video:', { 
      videoId: video.id, 
      title: video.title?.substring(0, 50) + (video.title?.length > 50 ? '...' : '') 
    })
    try {
      debugLog('BackgroundPlayer', 'Getting resume position for video', { videoId: video.id })
      const position = await getPlaybackPosition(video.id)
      
      // Only resume if there's a meaningful position (more than 5 seconds)
      // and not too close to the end (within 30 seconds of completion)
      const duration = video.duration ? parseFloat(video.duration) : 0
      const shouldResume = position > 5 && (duration === 0 || position < (duration - 30))
      
      console.log('🤔 [BACKGROUND-PLAYER] Resume decision:', {
        videoId: video.id,
        savedPosition: position,
        duration,
        shouldResume,
        reason: !shouldResume ? (position <= 5 ? 'Position too early' : 'Too close to end') : 'Valid resume point'
      })
      
      if (shouldResume) {
        console.log('✅ [BACKGROUND-PLAYER] Will resume video from saved position:', { 
          videoId: video.id, 
          resumePosition: position 
        })
        debugLog('BackgroundPlayer', 'Resuming video from saved position', { 
          videoId: video.id, 
          resumePosition: position 
        })
        return position
      } else {
        console.log('🔄 [BACKGROUND-PLAYER] Will start video from beginning:', { 
          videoId: video.id, 
          savedPosition: position,
          reason: shouldResume ? 'none' : 'position too close to start or end'
        })
        debugLog('BackgroundPlayer', 'Starting video from beginning', { 
          videoId: video.id, 
          savedPosition: position,
          reason: shouldResume ? 'none' : 'position too close to start or end'
        })
        return 0
      }
    } catch (error) {
      console.error('💥 [BACKGROUND-PLAYER] Error getting resume position:', { videoId: video.id, error })
      debugError('BackgroundPlayer', 'Error getting resume position', error)
      return 0
    }
  }, [getPlaybackPosition])

  // Auto-save playback position during monitoring
  useEffect(() => {
    if (isPlaying && backgroundVideo && currentTime > 0) {
      const saveInterval = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          try {
            const currentPos = playerRef.current.getCurrentTime()
            savePlaybackPosition(backgroundVideo.id, currentPos, {
              title: backgroundVideo.title,
              channelName: backgroundVideo.channelName,
              thumbnail: backgroundVideo.thumbnail,
              duration: backgroundVideo.duration,
              viewCount: backgroundVideo.viewCount
            })
          } catch (error) {
            debugError('BackgroundPlayer', 'Error auto-saving playback position', error)
          }
        }
      }, 10000) // Save every 10 seconds during playback

      return () => clearInterval(saveInterval)
    }
  }, [isPlaying, backgroundVideo, currentTime, savePlaybackPosition])

  // Save position when pausing or stopping
  useEffect(() => {
    if (!isPlaying && backgroundVideo && currentTime > 0) {
      savePlaybackPosition(backgroundVideo.id, currentTime, {
        title: backgroundVideo.title,
        channelName: backgroundVideo.channelName,
        thumbnail: backgroundVideo.thumbnail,
        duration: backgroundVideo.duration,
        viewCount: backgroundVideo.viewCount
      })
    }
  }, [isPlaying, backgroundVideo, currentTime, savePlaybackPosition])

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
        getPlaybackPosition,
        savePlaybackPosition,
        resumeFromPosition,
      }}
    >
      {children}
    </BackgroundPlayerContext.Provider>
  )
}