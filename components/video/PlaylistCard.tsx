'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useIsMobile } from '@/hooks/use-mobile'
import { 
  List, 
  Play, 
  Users,
  MoreVertical,
  Shield,
  ShieldOff,
  Eye,
  Trash2
} from 'lucide-react'
import { formatViewCount, formatPublishedAt } from '@/lib/youtube'

export interface PlaylistCardData {
  playlistId?: string
  id?: string
  title: string
  channelName: string
  channelThumbnail?: string
  thumbnail?: string
  videoCount?: number
  viewCount?: number
  publishedAt?: string
  description?: string
  isFavorite?: boolean
  addedAt?: string
}

export interface PlaylistCardProps {
  playlist: PlaylistCardData
  variant?: 'default' | 'favorite' | 'compact'
  showActions?: boolean
  showChannelInfo?: boolean
  showStats?: boolean
  showDescription?: boolean
  onPlay?: (playlist: PlaylistCardData) => void
  onFavorite?: (playlist: PlaylistCardData) => void
  onRemove?: (playlistId: string) => void
  onAddToBlacklist?: (playlist: PlaylistCardData) => void
  onAddToWhitelist?: (playlist: PlaylistCardData) => void
  isBlacklisted?: boolean
  isWhitelisted?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function PlaylistCard({
  playlist,
  variant = 'default',
  showActions = true,
  showChannelInfo = true,
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
}: PlaylistCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const isMobile = useIsMobile()

  // Get playlist ID
  const playlistId = playlist.playlistId || playlist.id

  // Handle card click
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const isMenu = target.closest('[role="menuitem"]')
    
    if (isMenu) {
      return
    }
    
    if (onPlay) {
      onPlay(playlist)
    }
  }, [onPlay, playlist])

  // Handle favorite toggle
  const handleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onFavorite) {
      onFavorite(playlist)
    }
  }, [onFavorite, playlist])

  // Handle remove
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onRemove && playlistId) {
      onRemove(playlistId)
    }
    setIsMenuOpen(false)
  }, [onRemove, playlistId])

  // Handle add to blacklist
  const handleAddToBlacklist = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAddToBlacklist) {
      onAddToBlacklist(playlist)
    }
    setIsMenuOpen(false)
  }, [onAddToBlacklist, playlist])

  // Handle add to whitelist
  const handleAddToWhitelist = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAddToWhitelist) {
      onAddToWhitelist(playlist)
    }
    setIsMenuOpen(false)
  }, [onAddToWhitelist, playlist])

  // Get thumbnail URL with fallbacks
  const getThumbnailUrl = useCallback(() => {
    if (playlist.thumbnail) return playlist.thumbnail
    if (playlistId) {
      return `https://img.youtube.com/vi/${playlistId}/hqdefault.jpg`
    }
    return `https://via.placeholder.com/320x180/1f2937/ffffff?text=No+Thumbnail`
  }, [playlist.thumbnail, playlistId])

  // Get channel logo URL
  const getChannelLogoUrl = useCallback(() => {
    if (playlist.channelThumbnail) return playlist.channelThumbnail
    if (playlist.channelName) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(playlist.channelName)}&background=1f2937&color=ffffff&size=48`
    }
    return null
  }, [playlist.channelThumbnail, playlist.channelName])

  // Size configurations
  const sizeConfig = {
    sm: {
      card: 'max-w-xs w-full',
      thumbnail: 'max-h-32 sm:max-h-36',
      title: 'text-sm font-semibold line-clamp-2 leading-tight',
      channel: 'text-xs font-medium',
      stats: 'text-xs'
    },
    md: {
      card: 'max-w-sm w-full',
      thumbnail: 'max-h-40 sm:max-h-44',
      title: 'text-sm sm:text-base font-semibold line-clamp-2 leading-tight',
      channel: 'text-xs sm:text-sm font-medium',
      stats: 'text-xs sm:text-sm'
    },
    lg: {
      card: 'max-w-md w-full',
      thumbnail: 'max-h-48 sm:max-h-52',
      title: 'text-base sm:text-lg font-semibold line-clamp-3 leading-tight',
      channel: 'text-sm sm:text-base font-medium',
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
        <div className={`relative aspect-video w-full overflow-hidden ${config.thumbnail}`}>
          {/* Image with skeleton loading */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted animate-pulse" />
          )}
          
          <img
            src={getThumbnailUrl()}
            alt={playlist.title}
            className={`w-full h-full object-cover transition-all duration-500 ${
              imageLoaded ? 'group-hover:scale-105' : ''
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
          
          {/* Playlist Badge */}
          <div className="absolute top-2 left-2">
            <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
              <List className="w-3 h-3" />
              Playlist
            </div>
          </div>

          {/* Quick Add Buttons - Always Visible */}
          {(onAddToBlacklist || onAddToWhitelist) && (
            <div className="absolute top-2 right-2 flex flex-col gap-2 transition-all duration-300 opacity-100 scale-100">
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
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-all duration-300 flex items-center justify-center opacity-100">
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
            {playlist.title}
          </h3>
          
          {/* Enhanced Channel Info */}
          {showChannelInfo && (
            <div className="flex items-start gap-3">
              {getChannelLogoUrl() && (
                <div className="relative flex-shrink-0">
                  <img 
                    src={getChannelLogoUrl()!} 
                    alt={playlist.channelName}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-background hover:ring-primary/50 transition-all duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white ring-2 ring-background" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`${config.channel} text-foreground font-medium truncate hover:text-primary transition-colors duration-300`}>
                  {playlist.channelName}
                </p>
                {playlist.videoCount && (
                  <span className={`${config.stats} text-muted-foreground block truncate`}>
                    {playlist.videoCount} videos
                  </span>
                )}
              </div>
              
              {/* Menu Button */}
              {showActions && (
                <div className="relative flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-11 w-11 min-h-[44px] p-0 transition-all duration-300 touch-manipulation mobile-touch-feedback"
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
                        Play Now
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
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Enhanced Stats */}
          {showStats && (
            <div className={`flex items-center gap-3 ${config.stats} text-muted-foreground flex-wrap`}>
              {playlist.viewCount && (
                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
                  <List className="w-3.5 h-3.5" />
                  <span className="font-medium">{playlist.videoCount}</span>
                </div>
              )}
              
              {playlist.viewCount && (
                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
                  <Eye className="w-3.5 h-3.5" />
                  <span className="font-medium">{formatViewCount(playlist.viewCount)}</span>
                </div>
              )}
              
              {playlist.publishedAt && (
                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
                  <span className="font-medium">{formatPublishedAt(playlist.publishedAt)}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Description */}
          {showDescription && playlist.description && (
            <p className={`${config.stats} text-muted-foreground mt-2 line-clamp-2`}>
              {playlist.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}