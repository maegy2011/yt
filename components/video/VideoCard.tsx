/**
 * Video Card Component
 * 
 * A comprehensive and responsive video card component that displays video information
 * with various interaction modes and visual states. Supports multiple variants for different
 * use cases throughout the application.
 * 
 * Features:
 * - Multiple display variants (default, favorite, watched, compact, grid)
 * - Responsive design with mobile optimization
 * - Interactive elements (play, favorite)
 * - Progress indicators for watched videos
 * - Live streaming badges
 * - Quality indicators
 * - Selection mode for bulk operations
 * - Accessibility support
 * - Touch-friendly interactions
 * - Image lazy loading with fallbacks
 * - Channel information display
 * - View count and duration formatting
 * 
 * @component VideoCard
 * @author MyTube Team
 * @version 2.0.0
 */

'use client'

// React hooks for state management and optimization
import { useState, useCallback } from 'react'

// UI Components from shadcn/ui
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

// Lucide React icons for various UI elements
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

// Custom hooks and contexts
import { useBackgroundPlayer } from '@/contexts/background-player-context'

// Utility functions for formatting
import { formatViewCount, formatPublishedAt, formatDuration } from '@/lib/youtube'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Enhanced video data interface for unified video card display
 * Supports all video types across the application with comprehensive metadata
 */
export interface VideoCardData {
  // Core video information
  videoId: string        // YouTube video ID (required)
  id?: string           // Alternative ID field for compatibility
  title: string         // Video title
  channelName: string   // Channel name
  channelHandle?: string // Channel handle (@username)
  channelThumbnail?: string // Channel avatar URL
  thumbnail: string     // Video thumbnail URL (required)
  
  // Video metadata
  duration?: string     // Formatted duration (e.g., "5:23")
  viewCount?: number    // View count as number
  publishedAt?: string  // Publication date
  description?: string  // Video description
  quality?: string     // Video quality (e.g., "1080p", "4K")
  isLive?: boolean     // Live stream indicator
  isUpcoming?: boolean // Upcoming video indicator
  subscriberCount?: string // Channel subscriber count
  
  // Context-specific data
  addedAt?: string     // When added to favorites
  isFavorite?: boolean // Favorite status
  watchedAt?: string   // When watched
  progress?: number    // Watch progress percentage (0-100)
  hasNotes?: boolean  // Has associated notes
  noteCount?: number   // Number of notes
  
  // Database timestamps
  createdAt?: string   // Creation timestamp
  updatedAt?: string   // Last update timestamp
}

/**
 * Video card component props interface
 * Defines all configuration options and event handlers
 */
export interface VideoCardProps {
  // Core data
  video: VideoCardData
  
  // Display configuration
  variant?: 'default' | 'favorite' | 'watched' | 'compact' | 'grid'
  showActions?: boolean      // Show action buttons
  showChannelInfo?: boolean // Show channel information
  showStats?: boolean       // Show view count and date
  showDescription?: boolean // Show video description
  showProgress?: boolean    // Show watch progress bar
  isSelectable?: boolean    // Enable selection mode
  isSelected?: boolean      // Current selection state
  className?: string        // Additional CSS classes
  size?: 'sm' | 'md' | 'lg' // Card size variant
  
  // Event handlers
  onPlay?: (video: VideoCardData) => void
  onFavorite?: (video: VideoCardData) => void
  onRemove?: (videoId: string) => void
  onSelect?: (videoId: string, selected: boolean) => void
  onExternalLink?: (video: VideoCardData) => void
  
  // State indicators
  isFavorite?: boolean
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
  isFavorite: isFavoriteProp = false,
  className = '',
  size = 'md'
}: VideoCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  const {
    backgroundVideo,
    isPlaying: isBackgroundPlaying,
  } = useBackgroundPlayer()

  // Get video ID (support both videoId and id fields)
  const videoId = video.videoId || video.id
  const isCurrentVideo = backgroundVideo?.videoId === videoId
  const isFavorite = isFavoriteProp || video.isFavorite || false

  // Handle card click
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Only prevent playing video if clicking on specific interactive elements
    const target = e.target as HTMLElement
    const isCheckbox = target.closest('input[type="checkbox"]')
    const isMenu = target.closest('[role="menuitem"]')
    
    // Allow clicks on buttons, play overlay, and general card area
    if (isCheckbox || isMenu) {
      return
    }
    
    if (onPlay) {
      onPlay(video)
    }
  }, [onPlay, video])

  // Handle favorite toggle
  const handleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onFavorite) {
      onFavorite(video)
    }
  }, [onFavorite, video])

  // Handle remove
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onRemove && videoId) {
      onRemove(videoId)
    }
    setIsMenuOpen(false)
  }, [onRemove, videoId])

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
      // Generate a placeholder with channel initial
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

  return (
    <Card 
      className={`${getVariantClasses()} ${config.card} ${className} ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
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
          
          {/* Enhanced Favorite Button on Thumbnail */}
          {onFavorite && (
            <div className="absolute top-2 left-2 z-30">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 min-h-[32px] min-w-[32px] p-0 touch-manipulation mobile-touch-feedback transition-all duration-300 hover:scale-110 shadow-lg ${
                  isFavorite 
                    ? 'bg-red-500 hover:bg-red-600 text-white border-red-400' 
                    : 'bg-black/70 hover:bg-black/90 text-white border-white/30'
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleFavorite(e)
                }}
                title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
            </div>
          )}
          
          {/* Enhanced Live Badge - Only show if no favorite button */}
          {video.isLive && !onFavorite && (
            <div className="absolute top-2 left-2 z-20">
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
          
          
          
          
          
          {/* Enhanced Play Overlay - Mobile Optimized */}
          <div 
            className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-all duration-300 flex items-center justify-center ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className={`bg-white/95 backdrop-blur-md rounded-full p-2 sm:p-2.5 transition-all duration-300 min-h-[40px] min-w-[40px] flex items-center justify-center ${
              isHovered ? 'scale-110' : 'scale-100'
            } mobile-touch-feedback`}>
              {isCurrentVideo && isBackgroundPlaying ? (
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
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-background hover:ring-primary/50 transition-all duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`${config.channel} text-foreground font-medium truncate hover:text-primary transition-colors duration-300`}>
                  {video.channelName}
                </p>
                {video.channelHandle && (
                  <span className={`${config.stats} text-muted-foreground/70 block truncate`}>
                    {video.channelHandle}
                  </span>
                )}
              </div>
              
              {/* Enhanced Menu Button - Mobile Optimized */}
              {showActions && (variant === 'favorite' || variant === 'watched') && (
                <div className="relative flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`h-11 w-11 min-h-[44px] min-w-[44px] p-0 transition-all duration-300 touch-manipulation mobile-touch-feedback ${
                      isHovered ? 'opacity-100 scale-110' : 'opacity-0 scale-100'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsMenuOpen(!isMenuOpen)
                    }}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                  
                  {/* Enhanced Dropdown Menu - Mobile Optimized */}
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
                      {onExternalLink && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-sm h-11 min-h-[44px] px-3 hover:bg-muted/50 transition-colors touch-manipulation mobile-touch-feedback"
                          onClick={handleExternalLink}
                        >
                          <ExternalLink className="w-4 h-4 mr-3" />
                          Open on YouTube
                        </Button>
                      )}
                      
                      {onRemove && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-sm h-11 min-h-[44px] px-3 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors touch-manipulation mobile-touch-feedback"
                          onClick={handleRemove}
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
              {video.viewCount && (
                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
                  <Eye className="w-3.5 h-3.5" />
                  <span className="font-medium">{formatViewCount(video.viewCount)}</span>
                </div>
              )}
              
              {video.publishedAt && (
                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatPublishedAt(video.publishedAt)}</span>
                </div>
              )}
              
              {video.subscriberCount && (
                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
                  <Users className="w-3.5 h-3.5" />
                  <span>{video.subscriberCount}</span>
                </div>
              )}
              
              {video.addedAt && variant === 'favorite' && (
                <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                  <Heart className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-red-700 dark:text-red-300 font-medium">{formatPublishedAt(video.addedAt)}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Description */}
          {showDescription && video.description && (
            <p className={`${config.description} text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-lg`}>
              {video.description}
            </p>
          )}
        </div>

      </CardContent>
    </Card>
  )
}

export default VideoCard