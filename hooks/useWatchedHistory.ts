import { useState, useEffect, useCallback } from 'react'
import type { WatchedVideo, WatchedVideoInput } from '@/types/watched'
import { useIncognito } from '@/contexts/incognito-context'
import { addIncognitoHeaders } from '@/lib/incognito-utils'

interface UseWatchedHistoryReturn {
  watchedVideos: WatchedVideo[]
  isLoading: boolean
  error: Error | null
  addToWatchedHistory: (video: WatchedVideoInput) => Promise<void>
  removeFromWatchedHistory: (videoId: string) => Promise<void>
  clearWatchedHistory: () => Promise<void>
  batchRemoveFromWatchedHistory: (videoIds: string[]) => Promise<void>
  isVideoWatched: (videoId: string) => boolean
  getWatchedVideo: (videoId: string) => WatchedVideo | undefined
  refetch: () => void
}

export function useWatchedHistory(): UseWatchedHistoryReturn {
  const [watchedVideos, setWatchedVideos] = useState<WatchedVideo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { isIncognito } = useIncognito()

  const fetchWatchedVideos = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/watched')
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Failed to fetch watched videos')
      }
      const videos = await response.json()
      setWatchedVideos(videos)
      console.log('Fetched', videos.length, 'watched videos')
    } catch (err) {
      console.error('Failed to fetch watched videos:', err)
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addToWatchedHistory = useCallback(async (video: WatchedVideoInput) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/watched', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...addIncognitoHeaders({}, isIncognito)
        },
        body: JSON.stringify(video),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Failed to add to watched history')
      }
      
      const result = await response.json()
      
      // Don't immediately refresh - let the server respond first
      console.log('Successfully added to watched history:', video.title, result.incognito ? '(incognito)' : '')
      
      // Only update local state if not in incognito mode
      if (!result.incognito) {
        // Optimistically update local state for better UX
        setWatchedVideos(prev => {
          const exists = prev.find(v => v.videoId === video.videoId)
          if (exists) {
            // Update existing video with latest data
            return prev.map(v => 
              v.videoId === video.videoId 
                ? { ...v, ...video, watchedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
                : v
            )
          } else {
            // Add new video
            return [...prev, { ...video, watchedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]
          }
        })
      }
    } catch (err) {
      console.error('Failed to add to watched history:', err)
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [isIncognito])

  const removeFromWatchedHistory = useCallback(async (videoId: string) => {
    try {
      const response = await fetch(`/api/watched/${videoId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to remove from watched history')
      }
      
      // Update local state
      setWatchedVideos(prev => prev.filter(video => video.videoId !== videoId))
    } catch (err) {
      console.error('Failed to remove from watched history:', err)
      setError(err as Error)
    }
  }, [])

  const clearWatchedHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/watched/clear', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to clear watched history')
      }
      
      // Update local state
      setWatchedVideos([])
    } catch (err) {
      console.error('Failed to clear watched history:', err)
      setError(err as Error)
    }
  }, [])

  const batchRemoveFromWatchedHistory = useCallback(async (videoIds: string[]) => {
    try {
      const response = await fetch('/api/watched/batch', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoIds }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to batch remove from watched history')
      }
      
      // Refresh the list
      await fetchWatchedVideos()
    } catch (err) {
      console.error('Failed to batch remove from watched history:', err)
      setError(err as Error)
    }
  }, [])

  const isVideoWatched = useCallback((videoId: string): boolean => {
    return watchedVideos.some(video => video.videoId === videoId)
  }, [watchedVideos])

  const getWatchedVideo = useCallback((videoId: string): WatchedVideo | undefined => {
    return watchedVideos.find(video => video.videoId === videoId)
  }, [watchedVideos])

  // Fetch watched videos on mount
  useEffect(() => {
    fetchWatchedVideos()
  }, [fetchWatchedVideos])

  return {
    watchedVideos,
    isLoading,
    error,
    addToWatchedHistory,
    removeFromWatchedHistory,
    clearWatchedHistory,
    batchRemoveFromWatchedHistory,
    isVideoWatched,
    getWatchedVideo,
    refetch: fetchWatchedVideos,
  }
}