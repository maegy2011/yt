import { useState, useEffect, useCallback } from 'react'
import type { WatchedVideo, WatchedVideoInput } from '@/types/watched'

// Debug logging utility for hooks
const debugLog = (hook: string, action: string, data?: any) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [Hook:${hook}] ${action}`, data ? data : '')
}

const debugError = (hook: string, action: string, error: any) => {
  const timestamp = new Date().toISOString()
  console.error(`[${timestamp}] [Hook:${hook}] ERROR in ${action}:`, error)
}

const debugWarn = (hook: string, action: string, warning: any) => {
  const timestamp = new Date().toISOString()
  console.warn(`[${timestamp}] [Hook:${hook}] WARNING in ${action}:`, warning)
}

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
  debugLog('useWatchedHistory', 'Hook initializing')
  
  const [watchedVideos, setWatchedVideos] = useState<WatchedVideo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchWatchedVideos = useCallback(async () => {
    debugLog('useWatchedHistory', 'Fetching watched videos')
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
      debugLog('useWatchedHistory', 'Watched videos fetched successfully', { count: videos.length })
      console.log('Fetched', videos.length, 'watched videos')
    } catch (err) {
      debugError('useWatchedHistory', 'Failed to fetch watched videos', err)
      console.error('Failed to fetch watched videos:', err)
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addToWatchedHistory = useCallback(async (video: WatchedVideoInput) => {
    debugLog('useWatchedHistory', 'Adding video to watched history', { videoId: video.videoId, title: video.title })
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/watched', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(video),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Failed to add to watched history')
      }
      
      // Don't immediately refresh - let the server respond first
      debugLog('useWatchedHistory', 'Successfully added to watched history', { title: video.title })
      console.log('Successfully added to watched history:', video.title)
      
      // Optimistically update local state for better UX
      setWatchedVideos(prev => {
        const exists = prev.find(v => v.videoId === video.videoId)
        if (exists) {
          debugLog('useWatchedHistory', 'Updating existing watched video', { videoId: video.videoId })
          // Update existing video with latest data
          return prev.map(v => 
            v.videoId === video.videoId 
              ? { ...v, ...video, watchedAt: new Date(), updatedAt: new Date() }
              : v
          )
        } else {
          debugLog('useWatchedHistory', 'Adding new watched video', { videoId: video.videoId })
          // Add new video
          return [...prev, { ...video, watchedAt: new Date(), updatedAt: new Date() }]
        }
      })
    } catch (err) {
      debugError('useWatchedHistory', 'Failed to add to watched history', err)
      console.error('Failed to add to watched history:', err)
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [])

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