import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { WatchedHistoryList, WatchedHistoryStats } from './WatchedHistoryComponents'
import { useWatchedHistory } from '@/hooks/useWatchedHistory'
import { useState, useCallback, useMemo } from 'react'
import { Eye, Clock, TrendingUp, Search, Filter, Grid, List, Calendar, BarChart3, RefreshCw } from 'lucide-react'
import type { WatchedVideo } from '@/types/watched'

interface WatchedHistoryContainerProps {
  onVideoPlay: (video: WatchedVideo) => void
}

export function WatchedHistoryContainer({ onVideoPlay }: WatchedHistoryContainerProps) {
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set())
  const [showStats, setShowStats] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'duration'>('date')

  const {
    watchedVideos,
    isLoading,
    error,
    removeFromWatchedHistory,
    clearWatchedHistory,
    batchRemoveFromWatchedHistory,
    refetch
  } = useWatchedHistory()

  // Filter and sort watched videos
  const filteredVideos = useMemo(() => {
    let filtered = watchedVideos

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(query) ||
        video.channelName.toLowerCase().includes(query)
      )
    }

    // Apply channel filter
    if (channelFilter !== 'all') {
      filtered = filtered.filter(video => video.channelName === channelFilter)
    }

    // Apply sorting
    switch (sortBy) {
      case 'date':
        filtered.sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime())
        break
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'duration':
        filtered.sort((a, b) => {
          const getDurationInSeconds = (duration?: string) => {
            if (!duration) return 0
            const [minutes, seconds] = duration.split(':').map(Number)
            return (minutes || 0) * 60 + (seconds || 0)
          }
          return getDurationInSeconds(b.duration) - getDurationInSeconds(a.duration)
        })
        break
    }

    return filtered
  }, [watchedVideos, searchQuery, channelFilter, sortBy])

  // Get unique channels for filter
  const uniqueChannels = useMemo(() => {
    const channels = [...new Set(watchedVideos.map(video => video.channelName))]
    return channels.sort()
  }, [watchedVideos])

  // Calculate stats from filtered videos
  const stats = useMemo(() => {
    const totalWatchTime = filteredVideos.reduce((acc, video) => {
      if (video.duration) {
        const [minutes, seconds] = video.duration.split(':').map(Number)
        return acc + (minutes * 60 + (seconds || 0))
      }
      return acc
    }, 0)

    const mostWatchedChannel = filteredVideos.reduce((acc, video) => {
      const count = filteredVideos.filter(v => v.channelName === video.channelName).length
      return count > acc.count ? { name: video.channelName, count } : acc
    }, { name: '', count: 0 }).name

    const videosThisWeek = filteredVideos.filter(video => {
      const watchedAt = new Date(video.watchedAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return watchedAt > weekAgo
    }).length

    const videosThisMonth = filteredVideos.filter(video => {
      const watchedAt = new Date(video.watchedAt)
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return watchedAt > monthAgo
    }).length

    const averageVideoLength = filteredVideos.length > 0 
      ? totalWatchTime / filteredVideos.filter(v => v.duration).length
      : 0

    return {
      totalVideos: filteredVideos.length,
      totalWatchTime,
      averageVideoLength,
      mostWatchedChannel,
      videosThisWeek,
      videosThisMonth
    }
  }, [filteredVideos])

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
    if (selectedVideos.size === filteredVideos.length) {
      setSelectedVideos(new Set())
    } else {
      setSelectedVideos(new Set(filteredVideos.map(video => video.videoId)))
    }
  }, [selectedVideos.size, filteredVideos])

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
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-500" />
                Watch History
                <Badge variant="secondary">{filteredVideos.length}</Badge>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStats(!showStats)}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {showStats ? 'Hide Stats' : 'Show Stats'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refetch}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search watch history..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Channel Filter */}
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="px-3 py-2 text-sm border rounded-md bg-background hover:bg-muted/50 transition-colors min-w-[150px]"
              >
                <option value="all">All Channels</option>
                {uniqueChannels.map(channel => (
                  <option key={channel} value={channel}>{channel}</option>
                ))}
              </select>

              {/* Sort Options */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'duration')}
                className="px-3 py-2 text-sm border rounded-md bg-background hover:bg-muted/50 transition-colors"
              >
                <option value="date">Recently Watched</option>
                <option value="title">A-Z</option>
                <option value="duration">Duration</option>
              </select>

              {/* View Mode */}
              <div className="flex gap-1 p-1 bg-muted rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Section */}
      {showStats && filteredVideos.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <WatchedHistoryStats stats={stats} />
          </CardContent>
        </Card>
      )}

      {/* History List */}
      <Card>
        <CardContent className="p-6">
          <WatchedHistoryList
            videos={filteredVideos}
            isLoading={isLoading}
            error={error}
            selectedVideos={selectedVideos}
            onSelectVideo={handleSelectVideo}
            onSelectAll={handleSelectAll}
            onPlayVideo={onVideoPlay}
            onDeleteVideo={handleDeleteVideo}
            onDeleteSelected={handleDeleteSelected}
            onClearAll={handleClearAll}
            viewMode={viewMode}
          />
        </CardContent>
      </Card>
    </div>
  )
}