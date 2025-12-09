'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Play, 
  Pause, 
  Heart, 
  MoreVertical,
  Eye,
  Clock,
  Trash2,
  ExternalLink,
  Users,
  Check,
  Sparkles,
  TrendingUp,
  Calendar,
  Shield,
  ShieldOff
} from 'lucide-react'
import { useBackgroundPlayer } from '@/contexts/background-player-context'
import { formatViewCount, formatPublishedAt, formatDuration } from '@/lib/youtube'
import { useAsyncOperation } from '@/hooks/useAsyncOperation'
import { LoadingSpinner } from '@/components/ui/skeleton-components'

// Enhanced types for unified video card
export interface VideoCardData {
  videoId?: string
  id?: string
  title: string
  channelName: string
  channelHandle?: string
  channelThumbnail?: string
  thumbnail?: string
  duration?: string
  viewCount?: number
  publishedAt?: string
  description?: string
  quality?: string
  isLive?: boolean
  isUpcoming?: boolean
  subscriberCount?: string
  // Favorites specific
  addedAt?: string
  isFavorite?: boolean
  // Watched specific
  watchedAt?: string
  progress?: number
}

export interface VideoCardProps {
  video: VideoCardData
  variant?: 'default' | 'favorite' | 'watched' | 'compact' | 'grid'
  showActions?: boolean
  showChannelInfo?: boolean
  showStats?: boolean
  showDescription?: boolean
  showProgress?: boolean
  isSelectable?: boolean
  isSelected?: boolean
  onPlay?: (video: VideoCardData) => Promise<void> | void
  onFavorite?: (video: VideoCardData) => Promise<void> | void
  onRemove?: (videoId: string) => Promise<void> | void
  onSelect?: (videoId: string, selected: boolean) => void
  onExternalLink?: (video: VideoCardData) => void
  onAddToBlacklist?: (video: VideoCardData) => Promise<void> | void
  onAddToWhitelist?: (video: VideoCardData) => Promise<void> | void
  isBlacklisted?: boolean
  isWhitelisted?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  blacklistWhitelistVisibility?: 'always' | 'hover' | 'hidden'
}

export function VideoCard({
  video,
  variant = 'default',
  showActions = true,
  showChannelInfo = true,
  showStats = true,
  showDescription = false,
  showProgress = false,
  isSelectable = false,
  isSelected = false,
  onPlay,
  onFavorite,
  onRemove,
  onSelect,
  onExternalLink,
  onAddToBlacklist,
  onAddToWhitelist,
  isBlacklisted = false,
  isWhitelisted = false,
  className = '',
  size = 'md',
  loading = false,
  blacklistWhitelistVisibility = 'always'
}: VideoCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  // Determine if blacklist/whitelist buttons should be visible
  const shouldShowBlacklistWhitelistButtons = () => {
    switch (blacklistWhitelistVisibility) {
      case 'always':
        return true
      case 'hover':
        return isHovered
      case 'hidden':
        return false
      default:
        return true
    }
  }
  
  // Async operations with loading states
  const playOperation = useAsyncOperation({
    showToast: false,
    successMessage: 'Video started playing',
    errorMessage: 'Failed to play video'
  })
  
  const favoriteOperation = useAsyncOperation({
    showToast: true,
    successMessage: 'Added to favorites',
    errorMessage: 'Failed to add to favorites'
  })
  
  const removeOperation = useAsyncOperation({
    showToast: true,
    successMessage: 'Removed successfully',
    errorMessage: 'Failed to remove'
  })
  
  const blacklistOperation = useAsyncOperation({
    showToast: true,
    successMessage: 'Added to blacklist',
    errorMessage: 'Failed to add to blacklist'
  })
  
  const whitelistOperation = useAsyncOperation({
    showToast: true,
    successMessage: 'Added to whitelist',
    errorMessage: 'Failed to add to whitelist'
  })
  
  const {
    backgroundVideo,
    isPlaying: isBackgroundPlaying,
  } = useBackgroundPlayer()

  // Get video ID (support both videoId and id fields)
  const videoId = video.videoId || video.id
  const isCurrentVideo = backgroundVideo?.videoId === videoId
  const isFavorite = video.isFavorite || false

  // Handle card click with loading state
  const handleCardClick = useCallback(async (e: React.MouseEvent) => {
    if (loading || playOperation.loading) return
    
    // Only prevent playing video if clicking on specific interactive elements
    const target = e.target as HTMLElement
    const isCheckbox = target.closest('input[type="checkbox"]')
    const isMenu = target.closest('[role="menuitem"]')
    
    if (isCheckbox || isMenu) {
      return
    }
    
    if (onPlay) {
      try {
        await playOperation.execute(() => Promise.resolve(onPlay(video)))
      } catch (error) {
        // Failed to play video
      }
    }
  }, [onPlay, video, loading, playOperation])

  // Handle favorite toggle with loading state
  const handleFavorite = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onFavorite && !favoriteOperation.loading) {
      try {
        await favoriteOperation.execute(() => Promise.resolve(onFavorite(video)))
      } catch (error) {
        // Failed to favorite video
      }
    }
  }, [onFavorite, video, favoriteOperation])

  // Handle remove with loading state
  const handleRemove = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onRemove && videoId && !removeOperation.loading) {
      try {
        await removeOperation.execute(() => Promise.resolve(onRemove(videoId)))
        setIsMenuOpen(false)
      } catch (error) {
        // Failed to remove video
      }
    }
  }, [onRemove, videoId, removeOperation])

  // Handle selection
  const handleSelection = useCallback((checked: boolean) => {
    if (onSelect && videoId) {
      onSelect(videoId, checked)
    }
  }, [onSelect, videoId])

  // Handle external link
  const handleExternalLink = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onExternalLink) {
      onExternalLink(video)
    } else if (videoId) {
      window.open(`https://youtube.com/watch?v=${videoId}`, '_blank')
    }
  }, [onExternalLink, video, videoId])

  // Handle add to blacklist with loading state
  const handleAddToBlacklist = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAddToBlacklist && !blacklistOperation.loading) {
      try {
        await blacklistOperation.execute(() => Promise.resolve(onAddToBlacklist(video)))
        setIsMenuOpen(false)
      } catch (error) {
        // Failed to add to blacklist
      }
    }
  }, [onAddToBlacklist, video, blacklistOperation])

  // Handle add to whitelist with loading state
  const handleAddToWhitelist = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAddToWhitelist && !whitelistOperation.loading) {
      try {
        await whitelistOperation.execute(() => Promise.resolve(onAddToWhitelist(video)))
        setIsMenuOpen(false)
      } catch (error) {
        // Failed to add to whitelist
      }
    }
  }, [onAddToWhitelist, video, whitelistOperation])

  // Get thumbnail URL with fallbacks
  const getThumbnailUrl = useCallback(() => {
    if (video.thumbnail) return video.thumbnail
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    }
    return `https://via.placeholder.com/320x180/1f2937/ffffff?text=No+Thumbnail`
  }, [video.thumbnail, videoId])

  // Get channel logo URL
  const getChannelLogoUrl = useCallback(() => {
    if (video.channelThumbnail) return video.channelThumbnail
    if (video.channelName) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(video.channelName)}&background=1f2937&color=ffffff&size=48`
    }
    return null
  }, [video.channelThumbnail, video.channelName])

  // Enhanced size configurations with better mobile spacing
  const sizeConfig = {
    sm: {
      card: 'max-w-xs w-full',
      thumbnail: 'max-h-32 sm:max-h-36',
      title: 'text-sm font-semibold line-clamp-2 leading-tight',
      channel: 'text-xs font-medium',
      stats: 'text-xs',
      description: 'text-xs line-clamp-2'
    },
    md: {
      card: 'max-w-sm w-full',
      thumbnail: 'max-h-40 sm:max-h-44',
      title: 'text-sm sm:text-base font-semibold line-clamp-2 leading-tight',
      channel: 'text-xs sm:text-sm font-medium',
      stats: 'text-xs sm:text-sm',
      description: 'text-xs sm:text-sm line-clamp-2'
    },
    lg: {
      card: 'max-w-md w-full',
      thumbnail: 'max-h-48 sm:max-h-52',
      title: 'text-base sm:text-lg font-semibold line-clamp-3 leading-tight',
      channel: 'text-sm sm:text-base font-medium',
      stats: 'text-sm sm:text-base',
      description: 'text-sm sm:text-base line-clamp-3'
    }
  }

  const config = sizeConfig[size]

  // Enhanced variant-specific styles with modern gradients
  const getVariantClasses = useCallback(() => {
    const baseClasses = 'group cursor-pointer transition-all duration-300 ease-out bg-card border-0 shadow-sm hover:shadow-xl hover:-translate-y-1'
    
    switch (variant) {
      case 'favorite':
        return `${baseClasses} ring-1 ring-red-100 hover:ring-red-200 dark:ring-red-900/20 dark:hover:ring-red-800/40`
      case 'watched':
        return `${baseClasses} ring-1 ring-blue-100 hover:ring-blue-200 dark:ring-blue-900/20 dark:hover:ring-blue-800/40`
      case 'compact':
        return `${baseClasses} hover:border-primary/20`
      case 'grid':
        return `${baseClasses} hover:border-primary/30`
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

  // Show loading skeleton if loading
  if (loading) {
    return (
      <Card className={`${config.card} ${className}`}>
        <CardContent className="p-0">
          <div className={`relative aspect-video w-full overflow-hidden rounded-t-xl ${config.thumbnail}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingSpinner size="md" />
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded" />
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-muted animate-pulse rounded-full" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      className={`${getVariantClasses()} ${config.card} ${className} ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105' : ''
      } ${playOperation.loading || favoriteOperation.loading || removeOperation.loading || blacklistOperation.loading || whitelistOperation.loading ? 'opacity-75 pointer-events-none' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-label={`Play video: ${video.title}`}
    >
      <CardContent className="p-0">
        {/* Thumbnail Section - Enhanced Design */}
        <div className={`relative aspect-video w-full overflow-hidden rounded-t-xl ${config.thumbnail}`}>
          {/* Image with skeleton loading */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted animate-pulse" />
          )}
          
          <img
            src={getThumbnailUrl()}
            alt={video.title}
            className={`w-full h-full object-cover transition-all duration-500 ${
              imageLoaded ? 'group-hover:scale-105' : ''
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
          
          {/* Enhanced Progress Bar (for watched videos) */}
          {showProgress && video.progress && video.progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30 backdrop-blur-sm">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500 shadow-sm"
                style={{ width: `${Math.min(video.progress, 100)}%` }}
              />
            </div>
          )}
          
          {/* Enhanced Duration Badge */}
          {video.duration && (
            <div className="absolute bottom-2 right-2">
              <div className="bg-black/90 backdrop-blur-md text-white text-xs font-medium px-2 py-1 rounded-md shadow-lg border border-black/20">
                {formatDuration(video.duration)}
              </div>
            </div>
          )}
          
          {/* Enhanced Live Badge */}
          {video.isLive && (
            <div className="absolute top-2 left-2">
              <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg flex items-center gap-1 animate-pulse">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            </div>
          )}
          
          {/* Enhanced Favorite Badge */}
          {variant === 'favorite' && (
            <div className="absolute top-2 left-2">
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
                <Heart className="w-3 h-3 fill-current" />
                Favorite
              </div>
            </div>
          )}
          
          {/* Enhanced Quality Badge */}
          {video.quality && (
            <div className="absolute top-2 right-2">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {video.quality}
              </div>
            </div>
          )}
          
          {/* Blacklist Badge */}
          {isBlacklisted && (
            <div className="absolute top-2 left-2">
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
                <ShieldOff className="w-3 h-3" />
                Blacklisted
              </div>
            </div>
          )}
          
          {/* Whitelist Badge */}
          {isWhitelisted && (
            <div className="absolute top-2 left-2">
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Whitelisted
              </div>
            </div>
          )}
          
          {/* Always Visible Blacklist/Whitelist Buttons */}
          {shouldShowBlacklistWhitelistButtons() && (
            <div className="absolute top-2 right-2 flex gap-1 z-10">
              {onAddToWhitelist && !isWhitelisted && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 w-6 min-h-[24px] min-w-[24px] p-0 touch-manipulation mobile-touch-feedback bg-green-500/90 hover:bg-green-600 text-white shadow-lg border border-green-400/30 transition-all duration-300 hover:scale-110 disabled:opacity-50 ${
                    blacklistWhitelistVisibility === 'hover' ? (isHovered ? 'opacity-100' : 'opacity-0') : 'opacity-100'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddToWhitelist(e)
                  }}
                  disabled={whitelistOperation.loading}
                  title="Add to Whitelist"
                >
                  {whitelistOperation.loading ? (
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Shield className="w-3 h-3" />
                  )}
                </Button>
              )}
              {onAddToBlacklist && !isBlacklisted && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 w-6 min-h-[24px] min-w-[24px] p-0 touch-manipulation mobile-touch-feedback bg-red-500/90 hover:bg-red-600 text-white shadow-lg border border-red-400/30 transition-all duration-300 hover:scale-110 disabled:opacity-50 ${
                    blacklistWhitelistVisibility === 'hover' ? (isHovered ? 'opacity-100' : 'opacity-0') : 'opacity-100'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddToBlacklist(e)
                  }}
                  disabled={blacklistOperation.loading}
                  title="Add to Blacklist"
                >
                  {blacklistOperation.loading ? (
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ShieldOff className="w-3 h-3" />
                  )}
                </Button>
              )}
            </div>
          )}
          
          {/* Enhanced Play Overlay - Mobile Optimized */}
          <div 
            className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-all duration-300 flex items-center justify-center ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className={`bg-white/95 backdrop-blur-md rounded-full p-2 sm:p-2.5 transition-all duration-300 min-h-[40px] min-w-[40px] flex items-center justify-center ${
              isHovered ? 'scale-110' : 'scale-100'
            } mobile-touch-feedback`}>
              {playOperation.loading ? (
                <LoadingSpinner size="sm" />
              ) : isCurrentVideo && isBackgroundPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800 ml-0.5" />
              )}
            </div>
          </div>
          
          {/* Enhanced Selection Checkbox - Mobile Optimized */}
          {isSelectable && (
            <div className={`absolute top-2 left-2 transition-all duration-300 ${
              isHovered ? 'opacity-100 scale-110' : 'opacity-0 scale-100'
            }`}>
              <div className="bg-white/95 backdrop-blur-md rounded-lg p-2 shadow-lg border border-white/50 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={handleSelection}
                  className="w-5 h-5"
                />
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Content Section */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className={`${config.title} text-foreground leading-tight min-h-[2.8em] group-hover:text-primary transition-colors duration-300 cursor-pointer`}>
            {video.title}
          </h3>
          
          {/* Enhanced Channel Info */}
          {showChannelInfo && (
            <div className="flex items-start gap-3">
              {getChannelLogoUrl() && (
                <div className="relative flex-shrink-0">
                  <img 
                    src={getChannelLogoUrl()!} 
                    alt={video.channelName}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-background hover:ring-primary transition-colors"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`${config.channel} text-muted-foreground hover:text-foreground transition-colors cursor-pointer line-clamp-1`}>
                  {video.channelName}
                </p>
                {showStats && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {video.viewCount && (
                      <span className={`${config.stats} flex items-center gap-1`}>
                        <Eye className="w-3 h-3" />
                        {formatViewCount(video.viewCount)}
                      </span>
                    )}
                    {video.publishedAt && (
                      <span className={`${config.stats} flex items-center gap-1`}>
                        <Calendar className="w-3 h-3" />
                        {formatPublishedAt(video.publishedAt)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Description */}
          {showDescription && video.description && (
            <p className={`${config.description} text-muted-foreground line-clamp-2`}>
              {video.description}
            </p>
          )}
          
          {/* Action Buttons */}
          {showActions && (
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFavorite}
                disabled={favoriteOperation.loading}
                className="h-8 px-2 text-xs hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
              >
                {favoriteOperation.loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExternalLink}
                className="h-8 px-2 text-xs hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/20"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
              
              {shouldShowBlacklistWhitelistButtons() && (onAddToBlacklist || onAddToWhitelist) && (
                <>
                  {onAddToWhitelist && !isWhitelisted && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAddToWhitelist}
                      disabled={whitelistOperation.loading}
                      className="h-8 px-2 text-xs hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/20"
                      title="Add to Whitelist"
                    >
                      {whitelistOperation.loading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Shield className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  {onAddToBlacklist && !isBlacklisted && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAddToBlacklist}
                      disabled={blacklistOperation.loading}
                      className="h-8 px-2 text-xs hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                      title="Add to Blacklist"
                    >
                      {blacklistOperation.loading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <ShieldOff className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}