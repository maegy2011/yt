'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface PlaybackPosition {
  id: string
  videoId: string
  title: string
  channelName: string
  thumbnail: string
  duration: number
  currentTime: number
  lastWatched: string
  updatedAt: string
}

interface PlaybackPositionResponse {
  exists: boolean
  currentTime?: number
  duration?: number
  id?: string
  videoId?: string
  title?: string
  channelName?: string
  thumbnail?: string
  lastWatched?: string
  updatedAt?: string
}

export function usePlaybackPosition(videoId: string) {
  const [playbackPosition, setPlaybackPosition] = useState<PlaybackPosition | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveTimeRef = useRef<number>(0)

  // Load playback position for a video
  const loadPlaybackPosition = useCallback(async (id: string): Promise<number> => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Use localStorage for now instead of API
      const stored = localStorage.getItem(`playback-position-${id}`)
      if (stored) {
        const data = JSON.parse(stored)
        setPlaybackPosition(data)
        return data.currentTime || 0
      } else {
        setPlaybackPosition(null)
        return 0
      }
    } catch (error) {
      console.error('Failed to load playback position:', error)
      setError(error instanceof Error ? error.message : 'Failed to load playback position')
      return 0
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save playback position with debouncing
  const savePlaybackPosition = useCallback((
    id: string, 
    title: string, 
    channelName: string, 
    thumbnail: string, 
    duration: number, 
    currentTime: number,
    immediate: boolean = false
  ) => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    const saveFunction = async () => {
      try {
        // Only save if enough time has passed since last save (unless immediate)
        const now = Date.now()
        const timeSinceLastSave = now - lastSaveTimeRef.current
        
        if (!immediate && timeSinceLastSave < 2000) { // 2 seconds debounce
          return
        }

        lastSaveTimeRef.current = now

        const positionData = {
          id: `pos-${id}`,
          videoId: id,
          title,
          channelName,
          thumbnail,
          duration,
          currentTime,
          lastWatched: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        // Use localStorage for now
        localStorage.setItem(`playback-position-${id}`, JSON.stringify(positionData))
        setPlaybackPosition(positionData)
      } catch (error) {
        console.error('Failed to save playback position:', error)
        setError(error instanceof Error ? error.message : 'Failed to save playback position')
      }
    }

    if (immediate) {
      saveFunction()
    } else {
      // Debounce saves to avoid too frequent operations
      saveTimeoutRef.current = setTimeout(saveFunction, 1000)
    }
  }, [])

  // Delete playback position
  const deletePlaybackPosition = useCallback(async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Use localStorage for now
      localStorage.removeItem(`playback-position-${id}`)
      setPlaybackPosition(null)
    } catch (error) {
      console.error('Failed to delete playback position:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete playback position')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Auto-load playback position when videoId changes
  useEffect(() => {
    if (videoId) {
      loadPlaybackPosition(videoId)
    }
  }, [videoId, loadPlaybackPosition])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    playbackPosition,
    isLoading,
    error,
    loadPlaybackPosition,
    savePlaybackPosition,
    deletePlaybackPosition
  }
}