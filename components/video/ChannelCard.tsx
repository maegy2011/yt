'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useIsMobile } from '@/hooks/use-mobile'
import { 
  Users,
  Play, 
  MoreVertical,
  Shield,
  ShieldOff,
  ExternalLink,
  Trash2
} from 'lucide-react'
import { formatViewCount, formatPublishedAt } from '@/lib/youtube'

export interface ChannelCardData {
  channelId?: string
  id?: string
  title: string
  name?: string
  channelName?: string
  thumbnail?: string
  subscriberCount?: string
  videoCount?: string
  viewCount?: string
  description?: string
  isFavorite?: boolean
  addedAt?: string
}

export interface ChannelCardProps {
  channel: ChannelCardData
  variant?: 'default' | 'favorite' | 'compact'
  showActions?: boolean
  showStats?: boolean
  showDescription?: boolean
  onPlay?: (channel: ChannelCardData) => void
  onFavorite?: (channel: ChannelCardData) => void
  onRemove?: (channelId: string) => void
  onAddToBlacklist?: (channel: ChannelCardData) => void
  onAddToWhitelist?: (channel: ChannelCardData) => void
  isBlacklisted?: boolean
  isWhitelisted?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ChannelCard({
  channel,
  variant = 'default',
  showActions = true,
  showStats = true,
  showDescription = false,
  onPlay,
  onFavorite,
  onRemove,
  onAddToBlacklist,
  onAddToWhitelist,
  isBlacklisted = false,
  isWhitelisted = false,
  className = '',
  size = 'md'
}: ChannelCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const isMobile = useIsMobile()

  // Get channel ID
  const channelId = channel.channelId || channel.id

  // Handle card click
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const isMenu = target.closest('[role="menuitem"]')
    
    if (isMenu) {
      return
    }
    
    if (onPlay) {
      onPlay(channel)
    }
  }, [onPlay, channel])

  // Handle favorite toggle
  const handleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onFavorite) {
      onFavorite(channel)
    }
  }, [onFavorite, channel])

  // Handle remove
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onRemove && channelId) {
      onRemove(channelId)
    }
    setIsMenuOpen(false)
  }, [onRemove, channelId])

  // Handle add to blacklist
  const handleAddToBlacklist = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAddToBlacklist) {
      onAddToBlacklist(channel)
    }
    setIsMenuOpen(false)
  }, [onAddToBlacklist, channel])

  // Handle add to whitelist
  const handleAddToWhitelist = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAddToWhitelist) {
      onAddToWhitelist(channel)
    }
    setIsMenuOpen(false)
  }, [onAddToWhitelist, channel])

  // Handle external link
  const handleExternalLink = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (channelId) {
      window.open(`https://youtube.com/channel/${channelId}`, '_blank')
    }
  }, [channelId])

  // Get thumbnail URL with fallbacks
  const getThumbnailUrl = useCallback(() => {
    if (channel.thumbnail) return channel.thumbnail
    if (channelId) {
      return `https://img.youtube.com/vi/${channelId}/hqdefault.jpg`
    }
    return `https://via.placeholder.com/320x180/1f2937/ffffff?text=No+Thumbnail`
  }, [channel.thumbnail, channelId])

  // Size configurations
  const sizeConfig = {
    sm: {
      card: 'max-w-xs w-full',
      thumbnail: 'w-20 h-20 sm:w-24 sm:h-24',
      title: 'text-sm font-semibold line-clamp-2 leading-tight',
      stats: 'text-xs'
    },
    md: {
      card: 'max-w-sm w-full',
      thumbnail: 'w-24 h-24 sm:w-32 sm:h-32',
      title: 'text-sm sm:text-base font-semibold line-clamp-2 leading-tight',
      stats: 'text-xs sm:text-sm'
    },
    lg: {
      card: 'max-w-md w-full',
      thumbnail: 'w-32 h-32 sm:w-40 sm:h-40',
      title: 'text-base sm:text-lg font-semibold line-clamp-2 leading-tight',
      stats: 'text-sm sm:text-base'
    }
  }

  const config = sizeConfig[size]

  // Variant-specific styles
  const getVariantClasses = useCallback(() => {
    const baseClasses = 'group cursor-pointer transition-all duration-300 ease-out bg-card border-0 shadow-sm hover:shadow-xl hover:-translate-y-1'
    
    switch (variant) {
      case 'favorite':
        return `${baseClasses} ring-1 ring-red-100 hover:ring-red-200 dark:ring-red-900/20 dark:hover:ring-red-800/40`
      case 'compact':
        return `${baseClasses} hover:border-primary/20`
      default:
        return `${baseClasses} hover:border-primary/20`
    }
  }, [variant])

  // Handle image load states
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  const handleImageError = useCallback(() => {
    setImageError(true)
    setImageLoaded(true)
  }, [])

  return (
    <Card 
      className={`${getVariantClasses()} ${config.card} ${className} ${
        isBlacklisted ? 'ring-1 ring-red-500/50' : ''
      } ${isWhitelisted ? 'ring-1 ring-green-500/50' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        {/* Thumbnail Section */}
        <div className={`relative ${config.thumbnail} overflow-hidden rounded-t-xl`}>
          {/* Image with skeleton loading */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted animate-pulse" />
          )}
          
          <img
            src={getThumbnailUrl()}
            alt={channel.title || channel.name}
            className={`w-full h-full object-cover transition-all duration-500 ${
              imageLoaded ? 'group-hover:scale-105' : ''
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
          
          {/* Channel Badge */}
          <div className="absolute top-2 left-2">
            <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
              <Users className="w-3 h-3" />
              Channel
            </div>
          </div>

          {/* Quick Add Buttons - Always Visible on Hover and Mobile */}
          {(onAddToBlacklist || onAddToWhitelist) && (
            <div className={`absolute top-2 right-2 flex flex-col gap-2 transition-all duration-300 z-10 ${
              isHovered || isMobile ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}>
            </div>
          )}

          {/* Blacklist/Whitelist Badges */}
          {isBlacklisted && (
            <div className="absolute top-2 left-2">
              <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
                <ShieldOff className="w-3 h-3" />
                Blacklisted
              </div>
            </div>
          )}
          {isWhitelisted && (
            <div className="absolute top-2 left-2">
              <div className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Whitelisted
              </div>
            </div>
          )}

          {/* Play Overlay */}
          <div 
            className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-all duration-300 flex items-center justify-center ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className={`bg-white/95 backdrop-blur-md rounded-full p-3 sm:p-4 transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}>
              <Play className="w-6 h-6 sm:w-8 sm:h-8 text-gray-800 ml-1" />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className={`${config.title} text-foreground leading-tight min-h-[2.8em] group-hover:text-primary transition-colors duration-300`}>
            {channel.title || channel.name}
          </h3>
          
          {/* Enhanced Stats */}
          {showStats && (
            <div className={`flex items-center gap-3 ${config.stats} text-muted-foreground flex-wrap`}>
              {channel.subscriberCount && (
                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
                  <Users className="w-3.5 h-3.5" />
                  <span className="font-medium">{channel.subscriberCount}</span>
                </div>
              )}
              
              {channel.videoCount && (
                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
                  <span className="font-medium">{channel.videoCount}</span>
                  <span className="text-xs">videos</span>
                </div>
              )}
              
              {channel.viewCount && (
                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
                  <span className="font-medium">{formatViewCount(channel.viewCount)}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Description */}
          {showDescription && channel.description && (
            <p className={`${config.stats} text-muted-foreground mt-2 line-clamp-2`}>
              {channel.description}
            </p>
          )}
        </div>

        {/* Menu Button */}
        {showActions && (
          <div className="relative flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className={`h-11 w-11 min-h-[44px] p-0 transition-all duration-300 touch-manipulation mobile-touch-feedback ${
                isHovered ? 'opacity-100 scale-110' : 'opacity-0 scale-100'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                setIsMenuOpen(!isMenuOpen)
              }}
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
            
            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl min-w-[160px] py-1 animate-in slide-in-from-top-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm h-11 min-h-[44px] px-3 hover:bg-muted/50 transition-colors touch-manipulation mobile-touch-feedback"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCardClick(e)
                  }}
                >
                  <Play className="w-4 h-4 mr-3" />
                  View Channel
                </Button>
                
                {onRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm h-11 min-h-[44px] px-3 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors touch-manipulation mobile-touch-feedback"
                    onClick={handleRemove}
                    title="Remove from favorites"
                  >
                    <Trash2 className="w-4 h-4 mr-3" />
                    Remove
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm h-11 min-h-[44px] px-3 hover:bg-muted/50 transition-colors touch-manipulation mobile-touch-feedback"
                  onClick={handleExternalLink}
                  title="Open on YouTube"
                >
                  <ExternalLink className="w-4 h-4 mr-3" />
                  Open on YouTube
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}