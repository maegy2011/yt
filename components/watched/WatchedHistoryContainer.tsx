import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WatchedHistoryList, WatchedHistoryStats } from './WatchedHistoryComponents'
import { useWatchedHistory } from '@/hooks/useWatchedHistory'
import { useState, useCallback } from 'react'
import { Eye, Clock, TrendingUp } from 'lucide-react'
import type { WatchedVideo, WatchedHistoryStats } from '@/types/watched'

interface WatchedHistoryContainerProps {
  onVideoPlay: (video: WatchedVideo) => void
}

export function WatchedHistoryContainer({ onVideoPlay }: WatchedHistoryContainerProps) {
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set())
  const [showStats, setShowStats] = useState(true)

  const {
    watchedVideos,
    isLoading,
    error,
    removeFromWatchedHistory,
    clearWatchedHistory,
    batchRemoveFromWatchedHistory,
    refetch
  } = useWatchedHistory()

  // Calculate stats from watched videos
  const stats: WatchedHistoryStats = {
    totalVideos: watchedVideos.length,
    totalWatchTime: watchedVideos.reduce((acc, video) => {
      if (video.duration) {
        const [minutes, seconds] = video.duration.split(':').map(Number)
        return acc + (minutes * 60 + (seconds || 0))
      }
      return acc
    }, 0),
    mostWatchedChannel: watchedVideos.reduce((acc, video) => {
      const count = watchedVideos.filter(v => v.channelName === video.channelName).length
      return count > acc.count ? { name: video.channelName, count } : acc
    }, { name: '', count: 0 }).name,
    videosThisWeek: watchedVideos.filter(video => {
      const watchedAt = new Date(video.watchedAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return watchedAt > weekAgo
    }).length,
    videosThisMonth: watchedVideos.filter(video => {
      const watchedAt = new Date(video.watchedAt)
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return watchedAt > monthAgo
    }).length,
    averageVideoLength: watchedVideos.length > 0 
      ? watchedVideos.reduce((acc, video) => {
          if (video.duration) {
            const [minutes, seconds] = video.duration.split(':').map(Number)
            return acc + (minutes * 60 + (seconds || 0))
          }
          return acc
        }, 0) / watchedVideos.filter(v => v.duration).length
      : 0
  }

  const handleSelectVideo = useCallback((videoId: string) => {
    setSelectedVideos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(videoId)) {
        newSet.delete(videoId)
      } else {
        newSet.add(videoId)
      }
      return newSet
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedVideos.size === watchedVideos.length) {
      setSelectedVideos(new Set())
    } else {
      setSelectedVideos(new Set(watchedVideos.map(video => video.videoId)))
    }
  }, [selectedVideos.size, watchedVideos])

  const handleDeleteVideo = useCallback(async (videoId: string) => {
    await removeFromWatchedHistory(videoId)
    setSelectedVideos(prev => {
      const newSet = new Set(prev)
      newSet.delete(videoId)
      return newSet
    })
  }, [removeFromWatchedHistory])

  const handleDeleteSelected = useCallback(async () => {
    if (selectedVideos.size > 0) {
      await batchRemoveFromWatchedHistory(Array.from(selectedVideos))
      setSelectedVideos(new Set())
    }
  }, [selectedVideos, batchRemoveFromWatchedHistory])

  const handleClearAll = useCallback(async () => {
    await clearWatchedHistory()
    setSelectedVideos(new Set())
  }, [clearWatchedHistory])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Watch History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Stats section */}
            {showStats && watchedVideos.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Statistics
                  </h3>
                  <button
                    onClick={() => setShowStats(false)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Hide
                  </button>
                </div>
                <WatchedHistoryStats stats={stats} />
              </div>
            )}

            {/* History list */}
            <div>
              {!showStats && watchedVideos.length > 0 && (
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    History
                  </h3>
                  <button
                    onClick={() => setShowStats(true)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Show Stats
                  </button>
                </div>
              )}
              
              <WatchedHistoryList
                videos={watchedVideos}
                isLoading={isLoading}
                error={error}
                selectedVideos={selectedVideos}
                onSelectVideo={handleSelectVideo}
                onSelectAll={handleSelectAll}
                onPlayVideo={onVideoPlay}
                onDeleteVideo={handleDeleteVideo}
                onDeleteSelected={handleDeleteSelected}
                onClearAll={handleClearAll}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}