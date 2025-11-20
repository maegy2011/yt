'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Heart, 
  MoreVertical,
  Eye,
  Clock,
  Trash2,
  ExternalLink,
  Pause
} from 'lucide-react'
import { FavoriteVideo } from '@/types/favorites'
import { formatAddedAt, formatViewCount } from '@/utils/favorites'
import { useBackgroundPlayer } from '@/contexts/background-player-context'

interface FavoriteCardProps {
  favorite: FavoriteVideo
  onRemove: (videoId: string) => void
  onPlay?: (favorite: FavoriteVideo) => void
  className?: string
}

export function FavoriteCard({ favorite, onRemove, onPlay, className = '' }: FavoriteCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  const {
    backgroundVideo,
    isPlaying: isBackgroundPlaying,
    playBackgroundVideo,
  } = useBackgroundPlayer()

  const isCurrentVideo = backgroundVideo?.videoId === favorite.videoId

  const handlePlay = () => {
    if (onPlay) {
      onPlay(favorite)
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent playing video if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    handlePlay()
  }

  const handleRemove = () => {
    onRemove(favorite.videoId)
    setIsMenuOpen(false)
  }

  const getCardClasses = () => {
    const baseClasses = 'group relative transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer'
    const mobileClasses = 'w-full max-w-sm mx-auto'
    const desktopClasses = 'w-full'
    
    return `${baseClasses} ${mobileClasses} sm:${desktopClasses} ${className}`
  }

  return (
    <Card 
      className={getCardClasses()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
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
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-lg flex items-center justify-center">
                <Play className="w-6 h-6 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">No thumbnail</p>
            </div>
          </div>
        )}
        
        {/* Duration Badge */}
        {favorite.duration && (
          <Badge 
            variant="secondary" 
            className="absolute bottom-2 right-2 bg-black/80 text-white text-xs"
          >
            {favorite.duration}
          </Badge>
        )}
        
        {/* Favorite Badge */}
        <Badge 
          variant="default" 
          className="absolute top-2 left-2 bg-red-600 hover:bg-red-700"
        >
          <Heart className="w-3 h-3 mr-1 fill-current" />
          Favorite
        </Badge>
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 rounded-lg px-3 py-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isCurrentVideo && isBackgroundPlaying ? (
              <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
            ) : (
              <Play className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
            )}
            <span className="text-black text-xs sm:text-sm font-medium">Click to play</span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base line-clamp-2 mb-1">
              {favorite.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
              {favorite.channelName}
            </p>
          </div>
          
          {/* Menu Button */}
          <div className="relative">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={(e) => {
                e.stopPropagation()
                setIsMenuOpen(!isMenuOpen)
              }}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
            
            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-background border rounded-md shadow-lg min-w-[120px] py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-8 px-3"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePlay()
                  }}
                >
                  <Play className="w-3 h-3 mr-2" />
                  Play
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-8 px-3 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove()
                  }}
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  Remove
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2">
          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {favorite.viewCount && (
              <span>{formatViewCount(favorite.viewCount)}</span>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatAddedAt(favorite.addedAt)}</span>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-7"
              onClick={(e) => {
                e.stopPropagation()
                handlePlay()
              }}
            >
              <Play className="w-3 h-3 mr-1" />
              Play
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 px-2"
              onClick={(e) => {
                e.stopPropagation()
                // Open video in new tab or handle accordingly
                window.open(`https://youtube.com/watch?v=${favorite.videoId}`, '_blank')
              }}
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}