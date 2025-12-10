'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Heart, 
  Trash2, 
  ExternalLink,
  Clock,
  Eye
} from 'lucide-react'
import { formatDuration } from '@/lib/youtube'
import { FavoriteVideo } from '@/types/favorites-simple'

interface SimpleFavoriteCardProps {
  favorite: FavoriteVideo
  onRemove: (videoId: string) => void
  onPlay: (favorite: FavoriteVideo) => void
  className?: string
}

export function SimpleFavoriteCard({ 
  favorite, 
  onRemove, 
  onPlay, 
  className = '' 
}: SimpleFavoriteCardProps) {

  const handlePlay = () => {
    onPlay(favorite)
  }

  const handleRemove = () => {
    onRemove(favorite.videoId)
  }

  const formatViewCount = (count?: number): string => {
    if (!count) return 'No views'
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K views`
    return `${count} views`
  }

  const formatAddedAt = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  return (
    <Card 
      className={`group cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${className}`}
      onClick={handlePlay}
    >
      {/* Video Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {favorite.thumbnail ? (
          <img 
            src={favorite.thumbnail} 
            alt={favorite.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Play className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        
        {/* Duration Badge */}
        {favorite.duration && (
          <Badge 
            variant="secondary" 
            className="absolute bottom-2 right-2 bg-black/80 text-white text-xs"
          >
            {formatDuration(favorite.duration)}
          </Badge>
        )}
        
        {/* Favorite Badge */}
        <Badge 
          variant="default" 
          className="absolute top-2 left-2 bg-red-600"
        >
          <Heart className="w-3 h-3 fill-current" />
        </Badge>
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
          <div className="bg-white/90 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Play className="w-6 h-6 text-black ml-1" />
          </div>
        </div>
      </div>

      {/* Card Content */}
      <CardHeader className="pb-3">
        <div className="space-y-2">
          {/* Title */}
          <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
            {favorite.title}
          </h3>
          
          {/* Channel */}
          <p className="text-xs text-muted-foreground">
            {favorite.channelName}
          </p>
          
          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{formatViewCount(favorite.viewCount)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatAddedAt(favorite.addedAt)}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Actions */}
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 text-xs h-8"
            onClick={(e) => {
              e.stopPropagation()
              handlePlay()
            }}
          >
            <Play className="w-3 h-3 mr-1" />
            Play
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8 px-2"
            onClick={(e) => {
              e.stopPropagation()
              window.open(`https://youtube.com/watch?v=${favorite.videoId}`, '_blank')
            }}
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8 px-2 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              handleRemove()
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}