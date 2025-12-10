import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Eye, 
  Trash2, 
  Clock, 
  TrendingUp, 
  Calendar,
  BarChart3,
  PlayCircle,
  History,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { VideoCard } from '@/components/video'
import { watchedVideoToCardData } from '@/components/video/videoCardConverters'
import { useState, useCallback } from 'react'
import type { WatchedVideo, WatchedHistoryStats } from '@/types/watched'

interface WatchedVideoCardProps {
  video: WatchedVideo
  isSelected: boolean
  onSelect: (videoId: string) => void
  onPlay: (video: WatchedVideo) => void
  onDelete: (videoId: string) => void
  onFavorite?: (video: any) => void
}

export function WatchedVideoCard({ 
  video, 
  isSelected, 
  onSelect, 
  onPlay, 
  onDelete,
  onFavorite 
}: WatchedVideoCardProps) {
  return (
    <VideoCard
      video={watchedVideoToCardData(video)}
      variant="watched"
      isSelectable={true}
      isSelected={isSelected}
      onSelect={(videoId, selected) => onSelect(videoId)}
      onPlay={(videoCardData) => onPlay(video)}
      onRemove={onDelete}
      onFavorite={onFavorite}
    />
  )
}

interface WatchedHistoryStatsProps {
  stats: WatchedHistoryStats
}

export function WatchedHistoryStats({ stats }: WatchedHistoryStatsProps) {
  const formatWatchTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatAverageLength = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <Card>
        <CardContent className="p-4 text-center">
          <BarChart3 className="w-6 h-6 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">{stats.totalVideos}</div>
          <div className="text-xs text-muted-foreground">Total Videos</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">{formatWatchTime(stats.totalWatchTime)}</div>
          <div className="text-xs text-muted-foreground">Watch Time</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">{formatAverageLength(stats.averageVideoLength)}</div>
          <div className="text-xs text-muted-foreground">Avg Length</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <PlayCircle className="w-6 h-6 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">{stats.videosThisWeek}</div>
          <div className="text-xs text-muted-foreground">This Week</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">{stats.videosThisMonth}</div>
          <div className="text-xs text-muted-foreground">This Month</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <History className="w-6 h-6 mx-auto mb-2 text-primary" />
          <div className="text-lg font-bold truncate">{stats.mostWatchedChannel || 'N/A'}</div>
          <div className="text-xs text-muted-foreground">Top Channel</div>
        </CardContent>
      </Card>
    </div>
  )
}

interface WatchedHistoryListProps {
  videos: WatchedVideo[]
  isLoading: boolean
  error: Error | null
  selectedVideos: Set<string>
  onSelectVideo: (videoId: string) => void
  onSelectAll: () => void
  onPlayVideo: (video: WatchedVideo) => void
  onDeleteVideo: (videoId: string) => void
  onDeleteSelected: () => void
  onClearAll: () => void
  onFavorite?: (video: any) => void
  viewMode?: 'grid' | 'list'
}

export function WatchedHistoryList({
  videos,
  isLoading,
  error,
  selectedVideos,
  onSelectVideo,
  onSelectAll,
  onPlayVideo,
  onDeleteVideo,
  onDeleteSelected,
  onClearAll,
  onFavorite,
  viewMode = 'grid'
}: WatchedHistoryListProps) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-muted rounded" />
                <div className="w-32 h-20 bg-muted rounded-md" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load watch history: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  if (videos.length === 0) {
    return (
      <Alert>
        <Eye className="h-4 w-4" />
        <AlertDescription className="flex flex-col items-center gap-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No watch history yet</h3>
            <p className="text-muted-foreground">
              Start watching videos to see them here!
            </p>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Bulk actions */}
      {selectedVideos.size > 0 && (
        <Card className="border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  {selectedVideos.size} video{selectedVideos.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirmation(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Select all and clear all */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedVideos.size === videos.length}
            onCheckedChange={onSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            Select all ({videos.length})
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDeleteConfirmation(true)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All
        </Button>
      </div>

      {/* Video list */}
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3'}>
          {videos.map((video) => (
            <div key={video.id} className={viewMode === 'list' ? 'group' : ''}>
              <WatchedVideoCard
                video={video}
                isSelected={selectedVideos.has(video.videoId)}
                onSelect={onSelectVideo}
                onPlay={onPlayVideo}
                onDelete={onDeleteVideo}
                onFavorite={onFavorite}
              />
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Delete confirmation dialog */}
      {showDeleteConfirmation && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Are you sure you want to delete {selectedVideos.size > 0 ? `${selectedVideos.size} selected videos` : 'all watch history'}? This action cannot be undone.
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirmation(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (selectedVideos.size > 0) {
                    onDeleteSelected()
                  } else {
                    onClearAll()
                  }
                  setShowDeleteConfirmation(false)
                }}
              >
                Delete
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}