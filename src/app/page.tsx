'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { 
  Home, 
  Search, 
  Play, 
  Clock, 
  Heart, 
  User, 
  Check,
  Loader2,
  Edit,
  Trash2,
  Users,
  Plus,
  Settings,
  ArrowDown
} from 'lucide-react'
import { searchVideos, formatViewCount, formatPublishedAt, formatDuration } from '@/lib/youtube'
import { getLoadingMessage, getConfirmationMessage } from '@/lib/loading-messages'
import type { Video, Channel } from '@/lib/youtube'
import { VideoCardSkeleton, VideoGridSkeleton } from '@/components/video-skeleton'
import { SplashScreen } from '@/components/splash-screen'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'

// Enhanced types with better safety
type Tab = 'home' | 'search' | 'player' | 'watched' | 'channels' | 'favorites'

interface BaseVideoData {
  id: string
  videoId: string
  title: string
  channelName: string
  thumbnail: string
  duration?: string
  viewCount?: number
}

interface WatchedVideo extends BaseVideoData {
  watchedAt: string
}

type FavoriteVideo = BaseVideoData

interface FavoriteChannel {
  id: string
  channelId: string
  name: string
  thumbnail?: string
  subscriberCount?: number
}

interface SearchResults {
  items: Video[]
  error?: string
}

export default function MyTubeApp() {
  const { toast } = useToast()
  
  // Core state
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [channelSearchQuery, setChannelSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [multiSelectMode, setMultiSelectMode] = useState(false)
  const [showSplashScreen, setShowSplashScreen] = useState(true)
  const [dynamicLoadingMessage, setDynamicLoadingMessage] = useState('')
  const [searchInputTimeout, setSearchInputTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isIntersectionLoading, setIsIntersectionLoading] = useState(false)
  const [hasTriggeredLoad, setHasTriggeredLoad] = useState(false)
  const [autoLoadMore, setAutoLoadMore] = useState(true) // Default to enabled
  
  // Data states
  const [watchedVideos, setWatchedVideos] = useState<WatchedVideo[]>([])
  const [favoriteChannels, setFavoriteChannels] = useState<FavoriteChannel[]>([])
  const [favoriteVideos, setFavoriteVideos] = useState<FavoriteVideo[]>([])
  
  // Channel search states
  const [channelSearchResults, setChannelSearchResults] = useState<any[]>([])
  const [channelSearchLoading, setChannelSearchLoading] = useState(false)
  const [channelVideos, setChannelVideos] = useState<any[]>([])
  const [channelVideosLoading, setChannelVideosLoading] = useState(false)
  
  // Infinite scroll states
  const [continuationToken, setContinuationToken] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMoreVideos, setHasMoreVideos] = useState(false)
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>('')
  
  // Search cache
  const [searchCache, setSearchCache] = useState<Map<string, { items: Video[], continuation: string | null, hasMore: boolean, timestamp: number }>>(new Map())
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache
  
  // Dialog states
  const [showSettings, setShowSettings] = useState(false)

  // Enhanced toast system with dynamic messages
  const showToast = useCallback((title: string, description?: string, variant: 'success' | 'error' | 'info' = 'info') => {
    toast({
      title,
      description,
      variant,
    })
  }, [toast])

  // Show dynamic loading message
  const showDynamicLoading = useCallback((operation: 'search' | 'loadMore' | 'favorites' | 'channels' | 'general') => {
    const message = getLoadingMessage(operation)
    setDynamicLoadingMessage(message)
    return message
  }, [])

  // Show dynamic confirmation message
  const showDynamicConfirmation = useCallback((operation: keyof typeof confirmationMessages, ...args: any[]) => {
    const message = getConfirmationMessage(operation, ...args)
    showToast('Success!', message, 'success')
    setDynamicLoadingMessage('')
  }, [showToast])

  // Handle splash screen completion
  const handleSplashComplete = useCallback(() => {
    setShowSplashScreen(false)
    showToast('Welcome!', 'MyTube is ready to use', 'success')
  }, [showToast])

  // Load initial data
  useEffect(() => {
    // Load user preferences from localStorage
    const savedAutoLoadMore = localStorage.getItem('mytube-auto-load-more')
    if (savedAutoLoadMore !== null) {
      setAutoLoadMore(savedAutoLoadMore === 'true')
    }

    const loadInitialData = async () => {
      try {
        await Promise.all([
          loadWatchedVideos(),
          loadFavoriteChannels(),
          loadFavoriteVideos()
        ])
        if (favoriteChannels.length > 0) {
          await loadChannelVideos()
        }
      } catch (error) {
        showToast('Failed to load initial data', 'Please refresh the page', 'error')
      }
    }
    
    if (!showSplashScreen) {
      loadInitialData()
    }
  }, [showSplashScreen])

  // Load channel videos when favorite channels change
  useEffect(() => {
    if (!showSplashScreen && favoriteChannels.length > 0) {
      loadChannelVideos()
    }
  }, [favoriteChannels.length, showSplashScreen])

  // Cache helper functions
  const getCachedResults = useCallback((query: string) => {
    const cached = searchCache.get(query)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached
    }
    return null
  }, [searchCache])

  const setCachedResults = useCallback((query: string, items: Video[], continuation: string | null, hasMore: boolean) => {
    setSearchCache(prev => {
      const newCache = new Map(prev)
      newCache.set(query, {
        items,
        continuation,
        hasMore,
        timestamp: Date.now()
      })
      return newCache
    })
  }, [])

  const clearExpiredCache = useCallback(() => {
    setSearchCache(prev => {
      const newCache = new Map()
      for (const [key, value] of prev.entries()) {
        if (Date.now() - value.timestamp < CACHE_DURATION) {
          newCache.set(key, value)
        }
      }
      return newCache
    })
  }, [])

  // Periodic cache cleanup
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      clearExpiredCache()
    }, CACHE_DURATION)
    
    return () => clearInterval(cleanupInterval)
  }, [clearExpiredCache])

  // Save auto-load preference to localStorage
  useEffect(() => {
    localStorage.setItem('mytube-auto-load-more', autoLoadMore.toString())
  }, [autoLoadMore])

  // Reset intersection loading when search query changes or tab switches
  useEffect(() => {
    setIsIntersectionLoading(false)
    setHasTriggeredLoad(false)
  }, [searchQuery, activeTab])

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchInputTimeout) {
        clearTimeout(searchInputTimeout)
      }
    }
  }, [searchInputTimeout])

  // Touch gesture handling for tab navigation
  useEffect(() => {
    let touchStartX = 0
    let touchEndX = 0
    let touchStartY = 0
    let touchEndY = 0
    const minSwipeDistance = 50
    const maxVerticalDistance = 100

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX
      touchStartY = e.changedTouches[0].screenY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX
      touchEndY = e.changedTouches[0].screenY
      handleSwipeGesture()
    }

    const handleSwipeGesture = () => {
      const swipeDistance = touchEndX - touchStartX
      const verticalDistance = Math.abs(touchEndY - touchStartY)
      
      if (Math.abs(swipeDistance) > minSwipeDistance && verticalDistance < maxVerticalDistance) {
        const tabs: Tab[] = ['home', 'search', 'player', 'watched', 'channels', 'favorites']
        const currentIndex = tabs.indexOf(activeTab)
        
        if (swipeDistance > 0) {
          if (currentIndex > 0) {
            const newTab = tabs[currentIndex - 1]
            setActiveTab(newTab)
            showToast('Tab Navigation', `Switched to ${newTab}`, 'info')
          }
        } else {
          if (currentIndex < tabs.length - 1) {
            const newTab = tabs[currentIndex + 1]
            setActiveTab(newTab)
            showToast('Tab Navigation', `Switched to ${newTab}`, 'info')
          }
        }
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [activeTab, showToast])

  // Keyboard navigation for tabs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const tabs: Tab[] = ['home', 'search', 'player', 'watched', 'channels', 'favorites']
      const currentIndex = tabs.indexOf(activeTab)

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          if (currentIndex > 0) {
            const newTab = tabs[currentIndex - 1]
            setActiveTab(newTab)
            showToast('Tab Navigation', `Switched to ${newTab}`, 'info')
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (currentIndex < tabs.length - 1) {
            const newTab = tabs[currentIndex + 1]
            setActiveTab(newTab)
            showToast('Tab Navigation', `Switched to ${newTab}`, 'info')
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, showToast])

  // Safe thumbnail extraction with multiple fallback options
  const getThumbnailUrl = useCallback((video: Video | any): string => {
    if (video.thumbnail?.url) return video.thumbnail.url
    if (video.thumbnail) return video.thumbnail
    
    if (video.id || video.videoId) {
      const videoId = video.id || video.videoId
      const thumbnailOptions = [
        `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        `https://img.youtube.com/vi/${videoId}/default.jpg`
      ]
      return thumbnailOptions[0]
    }
    
    return 'https://www.youtube.com/img/desktop/yt_1200.png'
  }, [])

  // Safe channel name extraction
  const getChannelName = useCallback((video: Video | any): string => {
    return video.channel?.name || video.channelName || 'Unknown Channel'
  }, [])

  // Safe channel thumbnail extraction
  const getChannelThumbnailUrl = useCallback((channel: any): string => {
    if (channel.thumbnail?.url) return channel.thumbnail.url
    if (channel.thumbnail) return channel.thumbnail
    
    if (channel.channelId || channel.id) {
      const channelId = channel.channelId || channel.id
      return `https://www.youtube.com/channel/${channelId}/avatar.jpg`
    }
    
    return 'https://www.youtube.com/img/desktop/yt_1200.png'
  }, [])

  const handleSearch = async (append: boolean = false) => {
    const trimmedQuery = searchQuery.trim()
    
    if (append && !currentSearchQuery.trim()) {
      setHasMoreVideos(false)
      return
    }
    
    if (!trimmedQuery && !append) {
      showToast('Search Query Required', 'Please enter a search query', 'info')
      return
    }
    
    if (!append) {
      if (!trimmedQuery) {
        showToast('Search Query Required', 'Please enter a search query', 'info')
        return
      }
      
      const cachedResults = getCachedResults(trimmedQuery)
      if (cachedResults) {
        setSearchResults({ items: cachedResults.items })
        setContinuationToken(cachedResults.continuation)
        setHasMoreVideos(cachedResults.hasMore)
        setCurrentSearchQuery(trimmedQuery)
        showDynamicConfirmation('search', cachedResults.items.length)
        return
      }
      
      setLoading(true)
      showDynamicLoading('search')
      setContinuationToken(null)
      setCurrentSearchQuery(trimmedQuery)
    } else {
      setLoadingMore(true)
      showDynamicLoading('loadMore')
      if (!currentSearchQuery) {
        setHasMoreVideos(false)
        setDynamicLoadingMessage('')
        return
      }
    }
    
    try {
      const queryToUse = append ? currentSearchQuery : trimmedQuery
      const params = new URLSearchParams({
        query: queryToUse,
        type: 'video'
      })
      
      if (append && continuationToken) {
        params.append('continuation', continuationToken)
      }

      const response = await fetch(`/api/youtube/search?${params}`)
      if (!response.ok) {
        throw new Error('Failed to search videos')
      }

      const data = await response.json()
      
      if (data.error) {
        showToast('Search Error', data.error, 'error')
        if (!append) setSearchResults(null)
        return
      }
      
      if (!data.items || data.items.length === 0) {
        if (!append) {
          showToast('No Results', `No videos found for "${queryToUse}"`, 'info')
          setSearchResults({ items: [] })
          setCachedResults(queryToUse, [], null, false)
        } else {
          showToast('No More Videos', 'No more videos found for this search', 'info')
        }
        setHasMoreVideos(false)
        return
      }
      
      if (data.query && data.query !== queryToUse) {
        console.warn('Search query mismatch:', { 
          expected: queryToUse, 
          received: data.query 
        })
      }
      
      let finalItems: Video[]
      if (append && searchResults?.items) {
        const existingVideoIds = new Set(searchResults.items.map(v => v.id))
        const newVideos = data.items.filter((video: Video) => !existingVideoIds.has(video.id))
        
        if (newVideos.length > 0) {
          finalItems = [...searchResults.items, ...newVideos]
        } else {
          finalItems = searchResults.items
          showToast('No New Videos', 'All videos already loaded', 'info')
        }
      } else {
        finalItems = data.items
      }
      
      setSearchResults({ items: finalItems })
      setContinuationToken(data.continuation || null)
      setHasMoreVideos(!!data.continuation)
      
      if (!append) {
        setCachedResults(queryToUse, finalItems, data.continuation || null, !!data.continuation)
        showDynamicConfirmation('search', finalItems.length)
      } else {
        showDynamicConfirmation('loadMore', data.items.length)
      }
      
    } catch (error) {
      console.error('Search error:', error)
      showToast('Search Failed', 'An error occurred while searching. Please try again.', 'error')
      if (!append) setSearchResults(null)
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setDynamicLoadingMessage('')
    }
  }

  // Debounced search for input changes
  const debouncedSearch = useCallback((query: string) => {
    if (searchInputTimeout) {
      clearTimeout(searchInputTimeout)
    }
    
    if (query.trim()) {
      const timeout = setTimeout(() => {
        handleSearch(false)
      }, 500) // 500ms delay
      
      setSearchInputTimeout(timeout)
    }
  }, [searchInputTimeout])

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    debouncedSearch(value)
  }

  const handleVideoPlay = async (video: Video, startTime?: number) => {
    setSelectedVideo(video)
    setActiveTab('player')
    
    try {
      const thumbnailUrl = getThumbnailUrl(video)
      await fetch('/api/watched', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video.id,
          title: video.title,
          channelName: getChannelName(video),
          thumbnail: thumbnailUrl
        })
      })
      await loadWatchedVideos()
    } catch (error) {
      console.error('Failed to add to watched:', error)
    }
  }

  const toggleFavorite = async (video: Video) => {
    try {
      const isFavorite = favoriteVideos.some(v => v.videoId === video.id)
      const thumbnailUrl = getThumbnailUrl(video)
      
      if (isFavorite) {
        showDynamicLoading('favorites')
        const response = await fetch(`/api/favorites/${video.id}`, { 
          method: 'DELETE' 
        })
        
        if (response.ok) {
          showDynamicConfirmation('favorites', 'remove')
          await loadFavoriteVideos()
        } else {
          showToast('Error', 'Failed to remove from favorites', 'error')
        }
      } else {
        showDynamicLoading('favorites')
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: video.id,
            title: video.title,
            channelName: getChannelName(video),
            thumbnail: thumbnailUrl,
            viewCount: video.viewCount
          })
        })
        
        if (response.ok) {
          showDynamicConfirmation('favorites', 'add')
          await loadFavoriteVideos()
        } else {
          showToast('Error', 'Failed to add to favorites', 'error')
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      showToast('Error', 'Network error while updating favorites', 'error')
    } finally {
      setDynamicLoadingMessage('')
    }
  }

  const loadWatchedVideos = async (): Promise<void> => {
    try {
      const response = await fetch('/api/watched')
      if (!response.ok) throw new Error('Failed to fetch watched videos')
      const data = await response.json()
      setWatchedVideos(data || [])
    } catch (error) {
      console.error('Failed to load watched videos:', error)
      setWatchedVideos([])
    }
  }

  const loadFavoriteChannels = async (): Promise<void> => {
    try {
      const response = await fetch('/api/channels')
      if (!response.ok) throw new Error('Failed to fetch favorite channels')
      const data = await response.json()
      setFavoriteChannels(data || [])
    } catch (error) {
      console.error('Failed to load favorite channels:', error)
      setFavoriteChannels([])
    }
  }

  const loadFavoriteVideos = async (): Promise<void> => {
    try {
      const response = await fetch('/api/favorites')
      if (!response.ok) throw new Error('Failed to fetch favorite videos')
      const data = await response.json()
      setFavoriteVideos(data || [])
    } catch (error) {
      console.error('Failed to load favorite videos:', error)
      setFavoriteVideos([])
    }
  }

  const handleChannelSearch = async (): Promise<void> => {
    const trimmedQuery = channelSearchQuery.trim()
    if (!trimmedQuery) {
      showToast('Search Query Required', 'Please enter a search query', 'info')
      return
    }

    setChannelSearchLoading(true)

    try {
      const response = await fetch(`/api/youtube/search-channels?query=${encodeURIComponent(trimmedQuery)}`)
      if (!response.ok) throw new Error('Failed to search channels')
      
      const data = await response.json()
      setChannelSearchResults(data.items || [])
    } catch (error) {
      console.error('Error searching channels:', error)
      showToast('Error', 'Failed to search channels', 'error')
      setChannelSearchResults([])
    } finally {
      setChannelSearchLoading(false)
    }
  }

  const handleFollowChannel = async (channel: any) => {
    try {
      const isFollowing = favoriteChannels.some(c => c.channelId === channel.channelId)
      
      if (isFollowing) {
        const response = await fetch(`/api/channels/${channel.channelId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          showToast('Unfollowed', `You are no longer following ${channel.name}`, 'success')
          await loadFavoriteChannels()
        } else {
          showToast('Error', 'Failed to unfollow channel', 'error')
        }
      } else {
        const response = await fetch('/api/channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId: channel.channelId,
            name: channel.name,
            thumbnail: getChannelThumbnailUrl(channel),
            subscriberCount: channel.subscriberCount
          })
        })
        
        if (response.ok) {
          showToast('Following', `You are now following ${channel.name}`, 'success')
          await loadFavoriteChannels()
        } else {
          showToast('Error', 'Failed to follow channel', 'error')
        }
      }
    } catch (error) {
      console.error('Error following channel:', error)
      showToast('Error', 'Network error while following channel', 'error')
    }
  }

  const loadChannelVideos = async () => {
    if (favoriteChannels.length === 0) return
    
    setChannelVideosLoading(true)
    try {
      const videoPromises = favoriteChannels.map(async (channel) => {
        try {
          const response = await fetch(`/api/youtube/channel-videos?channelId=${channel.channelId}`)
          if (response.ok) {
            const videos = await response.json()
            return { channel, videos: videos || [] }
          }
        } catch (error) {
          console.error(`Failed to load videos for channel ${channel.name}:`, error)
        }
        return { channel, videos: [] }
      })
      
      const results = await Promise.all(videoPromises)
      const allVideos = results.flatMap(result => 
        result.videos.map((video: any) => ({
          ...video,
          channelName: result.channel.name
        }))
      )
      
      setChannelVideos(allVideos)
    } catch (error) {
      console.error('Error loading channel videos:', error)
    } finally {
      setChannelVideosLoading(false)
    }
  }

  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId)
      } else {
        newSelected.add(itemId)
      }
      return newSelected
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set())
  }, [])

  const favoriteVideoIds = useMemo(() => 
    new Set(favoriteVideos.map(v => v.videoId)), 
    [favoriteVideos]
  )

  const tabs = useMemo(() => [
    { id: 'home' as Tab, icon: Home, label: 'Home' },
    { id: 'search' as Tab, icon: Search, label: 'Search' },
    { id: 'player' as Tab, icon: Play, label: 'Player' },
    { id: 'watched' as Tab, icon: Clock, label: 'Watched' },
    { id: 'channels' as Tab, icon: User, label: 'Channels' },
    { id: 'favorites' as Tab, icon: Heart, label: 'Favorites' },
  ], [])

  useEffect(() => {
    if (multiSelectMode) {
      clearSelection()
    }
  }, [activeTab, multiSelectMode, clearSelection])

  const VideoCard = useCallback(({ video, showActions = true }: { video: Video | any, showActions?: boolean }) => {
    const isFavorite = favoriteVideoIds.has(video.id)
    const isSelected = selectedItems.has(video.id)
    const thumbnailUrl = getThumbnailUrl(video)
    const channelName = getChannelName(video)
    
    return (
      <Card className={`group relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-border/50 hover:border-primary/30 ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
      }`}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {multiSelectMode && (
              <div className="flex items-center">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleItemSelection(video.id)}
                  className="w-4 h-4"
                />
              </div>
            )}
            
            <div className="relative flex-shrink-0">
              <div className="relative w-32 h-20 sm:w-40 sm:h-24 bg-muted rounded-lg overflow-hidden">
                <img
                  src={thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {video.duration && (
                  <Badge className="absolute bottom-2 right-2 text-xs bg-black/80 text-white border-none backdrop-blur-sm">
                    {formatDuration(video.duration)}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                  {video.title}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1 bg-primary rounded-full"></span>
                  {channelName}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  {video.viewCount && (
                    <span>
                      <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                      {formatViewCount(video.viewCount)} views
                    </span>
                  )}
                  {video.publishedAt && (
                    <span>
                      <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                      {formatPublishedAt(video.publishedAt)}
                    </span>
                  )}
                </p>
              </div>
              
              {showActions && (
                <div className="flex gap-2 pt-2 border-t border-border/50">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedVideo(video)
                      setActiveTab('player')
                    }}
                    className="flex-1 h-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    <Play className="w-3 h-3 mr-1.5" />
                    Play
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleFavorite(video)}
                    className={`h-8 px-3 transition-all duration-200 hover:scale-105 ${
                      isFavorite 
                        ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
                        : 'hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                    }`}
                  >
                    <Heart className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }, [favoriteVideoIds, selectedItems, multiSelectMode, getThumbnailUrl, getChannelName, toggleItemSelection, toggleFavorite])

  const loadMoreVideos = useCallback(async () => {
    if (loadingMore || !hasMoreVideos || !currentSearchQuery || isIntersectionLoading || hasTriggeredLoad) return
    
    setIsIntersectionLoading(true)
    setHasTriggeredLoad(true)
    try {
      await handleSearch(true)
    } finally {
      setIsIntersectionLoading(false)
      setHasTriggeredLoad(false)
    }
  }, [loadingMore, hasMoreVideos, currentSearchQuery, continuationToken, handleSearch, isIntersectionLoading, hasTriggeredLoad])

  // Manual infinite scroll with intersection observer
  useEffect(() => {
    if (activeTab !== 'search' || !autoLoadMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting && hasMoreVideos && !loadingMore && !loading && !isIntersectionLoading && !hasTriggeredLoad) {
          loadMoreVideos()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    )

    const loadMoreTrigger = document.getElementById('load-more-trigger')
    if (loadMoreTrigger) {
      observer.observe(loadMoreTrigger)
    }

    return () => {
      if (loadMoreTrigger) {
        observer.unobserve(loadMoreTrigger)
      }
    }
  }, [activeTab, hasMoreVideos, loadingMore, loading, isIntersectionLoading, hasTriggeredLoad, loadMoreVideos, autoLoadMore])

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            {/* Dynamic content will appear here when available */}
            {channelVideos.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Latest from Favorite Channels</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channelVideos.slice(0, 6).map((video) => {
                    const isFavorite = favoriteVideoIds.has(video.id)
                    return (
                      <Card key={video.id} className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                        <div className="relative">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-32 object-cover rounded-t-lg"
                            onClick={() => handleVideoPlay(video)}
                          />
                          {video.duration && (
                            <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-xs">
                              {video.duration}
                            </Badge>
                          )}
                          {/* Play button overlay */}
                          <div 
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-t-lg cursor-pointer"
                            onClick={() => handleVideoPlay(video)}
                          >
                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform">
                              <Play className="w-6 h-6 text-black ml-1" />
                            </div>
                          </div>
                          {/* Favorite button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(video)
                            }}
                            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                              isFavorite 
                                ? 'bg-red-600 text-white shadow-lg' 
                                : 'bg-black/60 text-white hover:bg-black/80'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                        <CardContent className="p-3">
                          <h3 
                            className="font-medium line-clamp-2 text-sm mb-1 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleVideoPlay(video)}
                          >
                            {video.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">{video.channelName}</p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
            
            {watchedVideos.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Recently Watched</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {watchedVideos.slice(0, 6).map((video) => {
                    const isFavorite = favoriteVideoIds.has(video.videoId)
                    return (
                      <Card key={video.id} className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                        <div className="relative">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-32 object-cover rounded-t-lg"
                            onClick={() => handleVideoPlay(video)}
                          />
                          {video.duration && (
                            <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-xs">
                              {video.duration}
                            </Badge>
                          )}
                          {/* Play button overlay */}
                          <div 
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-t-lg cursor-pointer"
                            onClick={() => handleVideoPlay(video)}
                          >
                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform">
                              <Play className="w-6 h-6 text-black ml-1" />
                            </div>
                          </div>
                          {/* Favorite button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(video)
                            }}
                            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                              isFavorite 
                                ? 'bg-red-600 text-white shadow-lg' 
                                : 'bg-black/60 text-white hover:bg-black/80'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                        <CardContent className="p-3">
                          <h3 
                            className="font-medium line-clamp-2 text-sm mb-1 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleVideoPlay(video)}
                          >
                            {video.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">{video.channelName}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Watched {new Date(video.watchedAt).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {favoriteVideos.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Favorite Videos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoriteVideos.slice(0, 6).map((video) => {
                    const isFavorite = favoriteVideoIds.has(video.videoId)
                    return (
                      <Card key={video.id} className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                        <div className="relative">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-32 object-cover rounded-t-lg"
                            onClick={() => handleVideoPlay(video)}
                          />
                          {video.duration && (
                            <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-xs">
                              {video.duration}
                            </Badge>
                          )}
                          {/* Play button overlay */}
                          <div 
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-t-lg cursor-pointer"
                            onClick={() => handleVideoPlay(video)}
                          >
                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform">
                              <Play className="w-6 h-6 text-black ml-1" />
                            </div>
                          </div>
                          {/* Favorite button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(video)
                            }}
                            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                              isFavorite 
                                ? 'bg-red-600 text-white shadow-lg' 
                                : 'bg-black/60 text-white hover:bg-black/80'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                        <CardContent className="p-3">
                          <h3 
                            className="font-medium line-clamp-2 text-sm mb-1 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleVideoPlay(video)}
                          >
                            {video.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">{video.channelName}</p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {channelVideos.length === 0 && watchedVideos.length === 0 && favoriteVideos.length === 0 && (
              <Card className="p-12 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <Play className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Welcome to MyTube</h3>
                    <p className="text-muted-foreground mb-4">
                      Start exploring YouTube content by searching for videos or adding channels to your favorites.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        onClick={() => setActiveTab('search')}
                        className="w-full sm:w-auto"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Search Videos
                      </Button>
                      <Button
                        onClick={() => setActiveTab('channels')}
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Browse Channels
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )

      case 'search':
        return (
          <div className="space-y-6">
            {/* Search Header */}
            <div className="bg-gradient-to-r from-green-10 via-green-5 to-transparent rounded-2xl p-6 border border-green-20">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent mb-4">
                Search Videos
              </h2>
              <div className="flex gap-3">
                <Input
                  placeholder="Search for videos..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (searchInputTimeout) {
                        clearTimeout(searchInputTimeout)
                        setSearchInputTimeout(null)
                      }
                      handleSearch(false)
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleSearch(false)}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold">
                      {searchResults.items.length > 0 
                        ? `Found ${searchResults.items.length} videos` 
                        : 'No videos found'
                      }
                    </h3>
                    {searchResults.items.length > 0 && hasMoreVideos && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ArrowDown className="w-4 h-4" />
                        <span>Auto-load more</span>
                        <Switch
                          checked={autoLoadMore}
                          onCheckedChange={setAutoLoadMore}
                          disabled={loadingMore}
                        />
                      </div>
                    )}
                  </div>
                  {searchResults.items.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Showing results for "{currentSearchQuery}"
                    </div>
                  )}
                </div>
                
                {searchResults.items.length > 0 && (
                  <div className="space-y-3">
                    {searchResults.items.map((video) => (
                      <VideoCard key={video.id} video={video} />
                    ))}
                    
                    {hasMoreVideos && (
                      <div className="text-center py-4">
                        {!autoLoadMore && (
                          <div className="text-sm text-muted-foreground mb-2">
                            Auto-loading is disabled. Click the button below to load more videos.
                          </div>
                        )}
                        <Button
                          onClick={() => handleSearch(true)}
                          disabled={loadingMore}
                          variant="outline"
                          className="w-full sm:w-auto"
                        >
                          {loadingMore ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Loading more...
                            </>
                          ) : (
                            'Load More Videos'
                          )}
                        </Button>
                      </div>
                    )}
                    
                    {/* Invisible trigger for intersection observer */}
                    <div id="load-more-trigger" className="h-1" />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Search for Videos</p>
                <p>Enter a search query above to find YouTube videos</p>
              </div>
            )}
          </div>
        )

      case 'player':
        return (
          <div className="space-y-6">
            {selectedVideo ? (
              <>
                {/* Video Player */}
                <div className="bg-gradient-to-r from-purple-10 via-purple-5 to-transparent rounded-2xl p-4 sm:p-6 border border-purple-20">
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent mb-3 sm:mb-4">
                    Now Playing
                  </h2>
                  <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
                    <iframe
                      id="youtube-player"
                      src={`https://www.youtube.com/embed/${selectedVideo.id}?enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                      className="w-full h-full absolute inset-0"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                </div>
                
                {/* Video Info */}
                <div className="bg-card rounded-xl p-4 sm:p-6 border border-border/50 shadow-lg">
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 line-clamp-2">{selectedVideo.title}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <p className="text-muted-foreground">{getChannelName(selectedVideo)}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {selectedVideo.viewCount && (
                        <span>{formatViewCount(selectedVideo.viewCount)} views</span>
                      )}
                      {selectedVideo.publishedAt && (
                        <span>{formatPublishedAt(selectedVideo.publishedAt)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => toggleFavorite(selectedVideo)}
                      className={`flex-1 sm:flex-none transition-all duration-200 hover:scale-105 ${
                        favoriteVideoIds.has(selectedVideo.id)
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <Heart className={`w-4 h-4 mr-2 ${favoriteVideoIds.has(selectedVideo.id) ? 'fill-current' : ''}`} />
                      {favoriteVideoIds.has(selectedVideo.id) ? 'Favorited' : 'Add to Favorites'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Video Selected</p>
                <p>Search and select a video to play</p>
              </div>
            )}
          </div>
        )

      case 'watched':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-10 via-orange-5 to-transparent rounded-2xl p-6 border border-orange-20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent mb-2">
                    Watch History
                  </h2>
                  <p className="text-muted-foreground">Videos you've recently watched</p>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {watchedVideos.length}
                </div>
              </div>
            </div>

            {watchedVideos.length > 0 ? (
              <div className="space-y-3">
                {watchedVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Watch History</p>
                <p>Start watching videos to see them here</p>
              </div>
            )}
          </div>
        )

      case 'channels':
        return (
          <div className="space-y-6">
            {/* Channel Search */}
            <div className="bg-gradient-to-r from-blue-10 via-blue-5 to-transparent rounded-2xl p-6 border border-blue-20">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-4">
                Browse Channels
              </h2>
              <div className="flex gap-3">
                <Input
                  placeholder="Search for channels..."
                  value={channelSearchQuery}
                  onChange={(e) => setChannelSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleChannelSearch()
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleChannelSearch}
                  disabled={channelSearchLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {channelSearchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Search Results */}
            {channelSearchResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Search Results</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channelSearchResults.map((channel) => (
                    <Card key={channel.channelId} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={getChannelThumbnailUrl(channel)}
                          alt={channel.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium line-clamp-1">{channel.name}</h4>
                          {channel.subscriberCount && (
                            <p className="text-sm text-muted-foreground">
                              {formatViewCount(channel.subscriberCount)} subscribers
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleFollowChannel(channel)}
                        className={`w-full transition-all duration-200 hover:scale-105 ${
                          favoriteChannels.some(c => c.channelId === channel.channelId)
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {favoriteChannels.some(c => c.channelId === channel.channelId) ? 'Following' : 'Follow'}
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Favorite Channels */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Favorite Channels</h3>
              {favoriteChannels.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoriteChannels.map((channel) => (
                    <Card key={channel.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={getChannelThumbnailUrl(channel)}
                          alt={channel.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium line-clamp-1">{channel.name}</h4>
                          {channel.subscriberCount && (
                            <p className="text-sm text-muted-foreground">
                              {formatViewCount(channel.subscriberCount)} subscribers
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleFollowChannel(channel)}
                        variant="outline"
                        className="w-full"
                      >
                        Unfollow
                      </Button>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No favorite channels yet</p>
                </div>
              )}
            </div>
          </div>
        )

      case 'favorites':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-10 via-red-5 to-transparent rounded-2xl p-6 border border-red-20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent mb-2">
                    Favorite Videos
                  </h2>
                  <p className="text-muted-foreground">Your saved videos</p>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {favoriteVideos.length}
                </div>
              </div>
            </div>

            {favoriteVideos.length > 0 ? (
              <div className="space-y-3">
                {favoriteVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Favorite Videos</p>
                <p>Start adding videos to your favorites to see them here</p>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (showSplashScreen) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Always Visible */}
      <header className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-red-600 to-red-500 rounded-lg flex items-center justify-center">
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold">MyTube</h1>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Tabs Bar - Visible on mobile only */}
      <div className="md:hidden bg-card/95 backdrop-blur-lg border-b border-border sticky top-14 sm:top-16 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <nav className="flex items-center justify-between py-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap min-w-0 flex-1 ${
                  activeTab === tab.id
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate max-w-full">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop Tabs Bar - Visible on desktop only */}
      <div className="hidden md:block bg-card/95 backdrop-blur-lg border-b border-border sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 py-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Always visible on mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-40 shadow-lg">
        <div className="flex items-center justify-around py-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] leading-tight">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 pb-24 md:pb-6">
        {dynamicLoadingMessage && (
          <div className="mb-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-700 dark:text-blue-300">{dynamicLoadingMessage}</span>
            </div>
          </div>
        )}
        
        {renderContent()}
      </main>

      <Toaster />
    </div>
  )
}