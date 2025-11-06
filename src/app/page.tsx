'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Home, 
  Search, 
  Play, 
  Pause,
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
  ArrowDown,
  ArrowLeft,
  Bell,
  Eye,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  FileText,
  Menu,
  X,
  Save,
  PlusCircle,
  RefreshCw,
  Download,
  Music,
  SkipBack,
  SkipForward,
  ExternalLink
} from 'lucide-react'
import { searchVideos, formatViewCount, formatPublishedAt, formatDuration } from '@/lib/youtube'
import { validateSearchQuery, validateYouTubeUrl } from '@/lib/validation'
import { getLoadingMessage, getConfirmationMessage, confirmationMessages } from '@/lib/loading-messages'
import type { Video as YouTubeVideo, Channel } from '@/lib/youtube'
import { convertYouTubeVideo, convertYouTubePlaylist, convertToYouTubeVideo, convertDbVideoToSimple, type SimpleVideo, type SimplePlaylist, type WatchedVideo, type FavoriteVideo, type FavoriteChannel, type VideoNote, type ChannelSearchResult, type PaginationInfo, type FollowedChannelsContent } from '@/lib/type-compatibility'
import { VideoCardSkeleton, VideoGridSkeleton } from '@/components/video-skeleton'
import { SplashScreen } from '@/components/splash-screen'
import { VideoNote as VideoNoteComponent } from '@/components/video-note'
import { useBackgroundPlayer } from '@/contexts/background-player-context'
import { ThemeSwitch } from '@/components/theme-switch'

// Enhanced types with better safety
type Tab = 'home' | 'search' | 'player' | 'watched' | 'channels' | 'favorites' | 'notes'

// Use SimpleVideo for internal state
type Video = SimpleVideo
type Playlist = SimplePlaylist
type SearchResultItem = Video | Playlist

interface SearchResults {
  items: SearchResultItem[]
  error?: string
}

export default function MyTubeApp() {
  // Background player context
  const {
    backgroundVideo,
    isPlaying: isBackgroundPlaying,
    currentTime: backgroundCurrentTime,
    duration: backgroundDuration,
    showMiniPlayer,
    pauseBackgroundVideo,
    stopBackgroundVideo,
  } = useBackgroundPlayer()

  // Core state
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [previousTab, setPreviousTab] = useState<Tab>('home')
  const [navigationHistory, setNavigationHistory] = useState<Tab[]>(['home'])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'video' | 'playlist' | 'channel' | 'all'>('all')
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
  const [allNotes, setAllNotes] = useState<VideoNote[]>([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [notesSearchQuery, setNotesSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<VideoNote | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [updatedNoteContent, setUpdatedNoteContent] = useState('')
  const [createNoteDialogOpen, setCreateNoteDialogOpen] = useState(false)
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    videoId: '',
    videoTitle: '',
    channelName: '',
    thumbnail: ''
  })
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set())
  
  // Playlist states
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [playlistVideos, setPlaylistVideos] = useState<Video[]>([])
  const [playlistVideosLoading, setPlaylistVideosLoading] = useState(false)
  const [showPlaylistVideos, setShowPlaylistVideos] = useState(false)
  const [expandedPlaylists, setExpandedPlaylists] = useState<Set<string>>(new Set())
  const [expandedPlaylistVideos, setExpandedPlaylistVideos] = useState<Map<string, Video[]>>(new Map())
  const [expandedPlaylistLoading, setExpandedPlaylistLoading] = useState<Map<string, boolean>>(new Map())
  
  // Channel search states
  const [channelSearchResults, setChannelSearchResults] = useState<ChannelSearchResult[]>([])
  const [channelSearchLoading, setChannelSearchLoading] = useState(false)
  const [channelVideos, setChannelVideos] = useState<SimpleVideo[]>([])
  const [channelVideosLoading, setChannelVideosLoading] = useState(false)
  
  // Followed channels content states
  const [followedChannelsContent, setFollowedChannelsContent] = useState<FollowedChannelsContent | null>(null)
  const [followedChannelsLoading, setFollowedChannelsLoading] = useState(false)
  const [followedChannelsVideos, setFollowedChannelsVideos] = useState<SimpleVideo[]>([])
  const [followedChannelsPlaylists, setFollowedChannelsPlaylists] = useState<SimplePlaylist[]>([])
  const [followedChannels, setFollowedChannels] = useState<FavoriteChannel[]>([])
  
  // Followed channels pagination states
  const [videoPage, setVideoPage] = useState(1)
  const [playlistPage, setPlaylistPage] = useState(1)
  const [videoPagination, setVideoPagination] = useState<PaginationInfo | null>(null)
  const [playlistPagination, setPlaylistPagination] = useState<PaginationInfo | null>(null)
  const videosPerPage = 12
  const playlistsPerPage = 6
  
  // Infinite scroll states
  const [continuationToken, setContinuationToken] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMoreVideos, setHasMoreVideos] = useState(false)
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>('')
  
  // Search cache
  const [searchCache, setSearchCache] = useState<Map<string, { items: Video[], continuation: string | null, hasMore: boolean, timestamp: number }>>(new Map())
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache
  
  // Settings states
  const [showSettings, setShowSettings] = useState(false)
  const [showClearDataConfirmation, setShowClearDataConfirmation] = useState(false)
  const [favoritesEnabled, setFavoritesEnabled] = useState(true)
  const [favoritesPaused, setFavoritesPaused] = useState(false)
  
  // YouTube URL player state
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [loadingUrl, setLoadingUrl] = useState(false)
  const [urlError, setUrlError] = useState('')
  const [urlSuccess, setUrlSuccess] = useState('')
  
  // Notification system state
  const [notifications, setNotifications] = useState<Array<{
    id: string
    title: string
    description?: string
    variant: 'success' | 'destructive' | 'info'
    timestamp: Date
    autoHide?: boolean
  }>>([])
  const [showNotifications, setShowNotifications] = useState(false)

  // Enhanced notification system with dynamic messages
  const addNotification = useCallback((title: string, description?: string, variant: 'success' | 'destructive' | 'info' = 'info', autoHide: boolean = true) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newNotification = {
      id,
      title,
      description,
      variant,
      timestamp: new Date(),
      autoHide
    }
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 10)) // Keep max 10 notifications
    
    // Auto hide after 5 seconds if autoHide is true
    if (autoHide) {
      const timeoutId = setTimeout(() => {
        removeNotification(id)
      }, 5000)
      
      // Store timeout ID for potential cleanup
      ;(newNotification as any).timeoutId = timeoutId
    }
  }, [])
  
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id)
      if (notification && (notification as any).timeoutId) {
        clearTimeout((notification as any).timeoutId)
      }
      return prev.filter(n => n.id !== id)
    })
  }, [])
  
  const clearAllNotifications = useCallback(() => {
    setNotifications(prev => {
      // Clear all pending timeouts
      prev.forEach(notification => {
        if ((notification as any).timeoutId) {
          clearTimeout((notification as any).timeoutId)
        }
      })
      return []
    })
  }, [])

  // Utility function for relative time
  const getRelativeTime = useCallback((timestamp: Date): string => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (seconds < 60) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return timestamp.toLocaleDateString()
  }, [])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Haptic feedback for mobile navigation
  const triggerHapticFeedback = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10) // Light vibration for navigation
    }
  }, [])

  // Swipe gesture handling for notifications
  const [swipeStates, setSwipeStates] = useState<Map<string, { translateX: number; isSwiping: boolean }>>(new Map())
  
  const handleTouchStart = useCallback((e: React.TouchEvent, notificationId: string) => {
    const touch = e.touches[0]
    setSwipeStates(prev => new Map(prev).set(notificationId, { translateX: 0, isSwiping: true }))
  }, [])
  
  const handleTouchMove = useCallback((e: React.TouchEvent, notificationId: string) => {
    const touch = e.touches[0]
    const swipeState = swipeStates.get(notificationId)
    if (!swipeState?.isSwiping) return
    
    const translateX = touch.clientX - e.currentTarget.getBoundingClientRect().left
    setSwipeStates(prev => new Map(prev).set(notificationId, { translateX, isSwiping: true }))
  }, [swipeStates])
  
  const handleTouchEnd = useCallback((e: React.TouchEvent, notificationId: string) => {
    const swipeState = swipeStates.get(notificationId)
    if (!swipeState?.isSwiping) return
    
    const threshold = 100 // Swipe threshold to remove
    if (Math.abs(swipeState.translateX) > threshold) {
      removeNotification(notificationId)
    } else {
      // Reset position
      setSwipeStates(prev => new Map(prev).set(notificationId, { translateX: 0, isSwiping: false }))
    }
  }, [swipeStates, removeNotification])

  // Show dynamic loading message
  const showDynamicLoading = useCallback((operation: 'search' | 'loadMore' | 'favorites' | 'channels' | 'general') => {
    const message = getLoadingMessage(operation)
    setDynamicLoadingMessage(message)
    return message
  }, [])

  // Show dynamic confirmation message
  const showDynamicConfirmation = useCallback((operation: keyof typeof confirmationMessages, ...args: unknown[]) => {
    const message = getConfirmationMessage(operation, args)
    addNotification('Success!', message, 'success')
    setDynamicLoadingMessage('')
  }, [addNotification])

  // Handle splash screen completion
  const handleSplashComplete = useCallback(() => {
    setShowSplashScreen(false)
    addNotification('Welcome!', 'MyTube is ready to use', 'success')
  }, [addNotification])

  // Cache helper functions
  const getCachedResults = useCallback((query: string, type: string = searchType) => {
    const cacheKey = `${query}:${type}`
    const cached = searchCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached
    }
    return null
  }, [searchCache, searchType])

  const setCachedResults = useCallback((query: string, items: Video[], continuation: string | null, hasMore: boolean, type: string = searchType) => {
    const cacheKey = `${query}:${type}`
    setSearchCache(prev => {
      const newCache = new Map(prev)
      newCache.set(cacheKey, {
        items,
        continuation,
        hasMore,
        timestamp: Date.now()
      })
      return newCache
    })
  }, [searchType])

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

  // Close mobile menu when screen size changes from mobile to larger
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize() // Check on initial load

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close mobile menu when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

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

  // Tab definitions with conditional favorites tab
  const tabs = useMemo(() => {
    const baseTabs = [
      { id: 'home' as Tab, icon: Home, label: 'Home' },
      { id: 'search' as Tab, icon: Search, label: 'Search' },
      { id: 'player' as Tab, icon: Play, label: 'Player' },
      { id: 'watched' as Tab, icon: Clock, label: 'Watched' },
      { id: 'channels' as Tab, icon: User, label: 'Channels' },
      { id: 'notes' as Tab, icon: FileText, label: 'Notes' },
    ]
    
    // Add favorites tab only if enabled
    if (favoritesEnabled) {
      baseTabs.splice(5, 0, { id: 'favorites' as Tab, icon: Heart, label: 'Favorites' })
    }
    
    return baseTabs
  }, [favoritesEnabled])

  // Enhanced tab navigation with haptic feedback
  const handleTabNavigation = useCallback((tabId: Tab) => {
    setPreviousTab(activeTab)
    setActiveTab(tabId)
    triggerHapticFeedback()
    
    // Clear playlist view when switching away from search tab
    if (tabId !== 'search' && showPlaylistVideos) {
      setShowPlaylistVideos(false)
      setSelectedPlaylist(null)
      setPlaylistVideos([])
    }
    
    // Update navigation history (avoid duplicates)
    setNavigationHistory(prev => {
      const newHistory = [...prev]
      if (newHistory[newHistory.length - 1] !== tabId) {
        newHistory.push(tabId)
      }
      // Keep only last 10 entries
      return newHistory.slice(-10)
    })
    
    const tab = tabs.find(t => t.id === tabId)
    if (tab) {
      addNotification('Navigation', `Switched to ${tab.label}`, 'info')
    }
  }, [activeTab, tabs, addNotification, triggerHapticFeedback, showPlaylistVideos])

  // Back button functionality
  const handleGoBack = useCallback(() => {
    if (activeTab === 'player' && previousTab !== 'player') {
      // Special case for player - go back to previous tab
      setActiveTab(previousTab)
      setNavigationHistory(prev => prev.slice(0, -1)) // Remove player from history
      triggerHapticFeedback()
      addNotification('Navigation', `Returned to ${tabs.find(t => t.id === previousTab)?.label || 'previous'}`, 'info')
    } else if (navigationHistory.length > 1) {
      // Go to previous tab in history
      const newHistory = [...navigationHistory]
      newHistory.pop() // Remove current tab
      const previousTabInHistory = newHistory[newHistory.length - 1]
      
      if (previousTabInHistory) {
        setActiveTab(previousTabInHistory)
        setNavigationHistory(newHistory)
        triggerHapticFeedback()
        
        const tab = tabs.find(t => t.id === previousTabInHistory)
        if (tab) {
          addNotification('Navigation', `Went back to ${tab.label}`, 'info')
        }
      }
    } else if (activeTab !== 'home') {
      // If no history, go to home
      setActiveTab('home')
      setNavigationHistory(['home'])
      triggerHapticFeedback()
      addNotification('Navigation', 'Went back to Home', 'info')
    }
  }, [activeTab, previousTab, navigationHistory, tabs, addNotification, triggerHapticFeedback])

  // Check if back button should be shown
  const canGoBack = navigationHistory.length > 1 || activeTab !== 'home'

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
        const tabs: Tab[] = favoritesEnabled 
          ? ['home', 'search', 'player', 'watched', 'channels', 'favorites', 'notes']
          : ['home', 'search', 'player', 'watched', 'channels', 'notes']
        const currentIndex = tabs.indexOf(activeTab)
        
        if (swipeDistance > 0) {
          if (currentIndex > 0) {
            const newTab = tabs[currentIndex - 1]
            handleTabNavigation(newTab)
          }
        } else {
          if (currentIndex < tabs.length - 1) {
            const newTab = tabs[currentIndex + 1]
            handleTabNavigation(newTab)
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
  }, [activeTab, addNotification, handleTabNavigation])

  // Keyboard navigation for tabs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const tabs: Tab[] = favoritesEnabled 
        ? ['home', 'search', 'player', 'watched', 'channels', 'favorites', 'notes']
        : ['home', 'search', 'player', 'watched', 'channels', 'notes']
      const currentIndex = tabs.indexOf(activeTab)

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          if (currentIndex > 0) {
            const newTab = tabs[currentIndex - 1]
            handleTabNavigation(newTab)
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (currentIndex < tabs.length - 1) {
            const newTab = tabs[currentIndex + 1]
            handleTabNavigation(newTab)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, addNotification, handleTabNavigation])

  // Safe thumbnail extraction with multiple fallback options
  const getThumbnailUrl = useCallback((video: Video | any): string => {
    if (video.thumbnail?.url) return video.thumbnail.url
    if (video.thumbnail && typeof video.thumbnail === 'string' && video.thumbnail.trim() !== '') {
      return video.thumbnail
    }
    
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

  // Safe channel handle extraction
  const getChannelHandle = useCallback((video: Video | any): string => {
    return video.channel?.handle || ''
  }, [])

  // Safe channel subscriber count extraction
  const getChannelSubscriberCount = useCallback((video: Video | any): string => {
    return video.channel?.subscriberCount || ''
  }, [])

  // Safe channel thumbnail extraction
  const getChannelThumbnailUrl = useCallback((channel: any): string => {
    if (channel.thumbnail?.url) return channel.thumbnail.url
    if (channel.thumbnail && typeof channel.thumbnail === 'string' && channel.thumbnail.trim() !== '') {
      return channel.thumbnail
    }
    
    if (channel.channelId || channel.id) {
      const channelId = channel.channelId || channel.id
      return `https://www.youtube.com/channel/${channelId}/avatar.jpg`
    }
    
    return 'https://www.youtube.com/img/desktop/yt_1200.png'
  }, [])

  // Safe channel logo extraction for video cards
  const getChannelLogo = useCallback((video: Video | any): string | null => {
    // Try to get channel logo from various sources
    if (video.channel?.thumbnail?.url) return video.channel.thumbnail.url
    if (video.channel?.thumbnail) return video.channel.thumbnail
    if (video.channelThumbnail) return video.channelThumbnail
    
    // Generate channel logo from channel ID if available
    const channelId = video.channel?.id || video.channelId
    if (channelId) {
      return `https://www.youtube.com/channel/${channelId}/avatar.jpg`
    }
    
    return null
  }, [])

  // Safe thumbnail URL extraction with fallbacks
  const getSafeThumbnailUrl = useCallback((video: Video | any): string => {
    // Try to get thumbnail from various sources
    if (video.thumbnail?.url) return video.thumbnail.url
    if (video.thumbnail && typeof video.thumbnail === 'string' && video.thumbnail.trim() !== '') {
      return video.thumbnail
    }
    
    // Generate fallback thumbnail from video ID
    const videoId = video.id || video.videoId
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    }
    
    // Final fallback - return a placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNjAgOTBDMTYwIDY5LjMwMDQgMTQzLjY5NiA1MyAxMjMgNTNIMTk3Qzc2LjMwMDQgNTMgNjAgNjkuMzAwNCA2MCA5MEM2MCAxMTAuNjk2IDc2LjMwMDQgMTI3IDk3IDEyN0gxMjNDMTQzLjY5NiAxMjcgMTYwIDExMC42OTYgMTYwIDkwWiIgZmlsbD0iI0Q1REJEQiIvPgo8Y2lyY2xlIGN4PSI5MCIgY3k9IjkwIiByPSIxNSIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'
  }, [])

  // Data loading functions
  const loadWatchedVideos = async (): Promise<void> => {
    try {
      const response = await fetch('/api/watched')
      if (!response.ok) throw new Error('Failed to fetch watched videos')
      const data = await response.json()
      // Convert database videos to SimpleVideo format
      const convertedVideos = (data || []).map((video: WatchedVideo) => convertDbVideoToSimple(video))
      setWatchedVideos(convertedVideos)
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
      // Convert database videos to SimpleVideo format
      const convertedVideos = (data || []).map((video: FavoriteVideo) => convertDbVideoToSimple(video))
      setFavoriteVideos(convertedVideos)
    } catch (error) {
      console.error('Failed to load favorite videos:', error)
      setFavoriteVideos([])
    }
  }

  const loadNotes = async (): Promise<void> => {
    try {
      setNotesLoading(true)
      const response = await fetch('/api/notes')
      if (!response.ok) throw new Error('Failed to fetch notes')
      const data = await response.json()
      setAllNotes(data || [])
    } catch (error) {
      console.error('Failed to load notes:', error)
      setAllNotes([])
      addNotification('Failed to load notes', 'Please try again', 'destructive')
    } finally {
      setNotesLoading(false)
    }
  }

  const deleteNote = async (noteId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete note')
      
      setAllNotes(prev => prev.filter(note => note.id !== noteId))
      addNotification('Note deleted', 'The note has been removed successfully', 'success')
    } catch (error) {
      console.error('Failed to delete note:', error)
      addNotification('Failed to delete note', 'Please try again', 'destructive')
    }
  }

  const updateNote = async (noteId: string, newContent: string): Promise<void> => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ note: newContent })
      })
      if (!response.ok) throw new Error('Failed to update note')
      
      const updatedNote = await response.json()
      setAllNotes(prev => prev.map(note => 
        note.id === noteId ? { ...note, note: newContent } : note
      ))
      addNotification('Note updated', 'The note has been updated successfully', 'success')
    } catch (error) {
      console.error('Failed to update note:', error)
      addNotification('Failed to update note', 'Please try again', 'destructive')
    }
  }

  const handleEditNote = (note: any) => {
    setEditingNote(note)
    setUpdatedNoteContent(note.note || '')
    setEditDialogOpen(true)
  }

  const handleSaveNoteUpdate = async () => {
    if (editingNote && updatedNoteContent.trim()) {
      await updateNote(editingNote.id, updatedNoteContent.trim())
      setEditDialogOpen(false)
      setEditingNote(null)
      setUpdatedNoteContent('')
    }
  }

  const handleCreateNote = () => {
    // If there's a selected video, pre-fill the video info
    if (selectedVideo) {
      setNewNote({
        title: '',
        content: '',
        videoId: selectedVideo.id,
        videoTitle: selectedVideo.title,
        channelName: getChannelName(selectedVideo),
        thumbnail: getThumbnailUrl(selectedVideo)
      })
    } else {
      // Reset form for manual entry
      setNewNote({
        title: '',
        content: '',
        videoId: '',
        videoTitle: '',
        channelName: '',
        thumbnail: ''
      })
    }
    setCreateNoteDialogOpen(true)
  }

  const handleSaveNewNote = async () => {
    if (newNote.title.trim() && newNote.content.trim()) {
      try {
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: newNote.videoId || 'manual-note',
            title: newNote.title,
            channelName: newNote.channelName || 'Manual Note',
            thumbnail: newNote.thumbnail,
            note: newNote.content,
            fontSize: 16,
            startTime: null,
            endTime: null,
            isClip: false
          })
        })
        
        if (response.ok) {
          const createdNote = await response.json()
          setAllNotes(prev => [createdNote, ...prev])
          setCreateNoteDialogOpen(false)
          setNewNote({
            title: '',
            content: '',
            videoId: '',
            videoTitle: '',
            channelName: '',
            thumbnail: ''
          })
          addNotification('Note created', 'The note has been created successfully', 'success')
        } else {
          throw new Error('Failed to create note')
        }
      } catch (error) {
        console.error('Failed to create note:', error)
        addNotification('Failed to create note', 'Please try again', 'destructive')
      }
    }
  }

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(noteId)) {
        newSet.delete(noteId)
      } else {
        newSet.add(noteId)
      }
      return newSet
    })
  }

  const toggleMultiSelectMode = () => {
    setMultiSelectMode(!multiSelectMode)
    setSelectedNotes(new Set())
  }

  const deleteSelectedNotes = async () => {
    if (selectedNotes.size === 0) return
    
    try {
      const deletePromises = Array.from(selectedNotes).map(noteId =>
        fetch(`/api/notes/${noteId}`, { method: 'DELETE' })
      )
      
      await Promise.all(deletePromises)
      
      setAllNotes(prev => prev.filter(note => !selectedNotes.has(note.id)))
      setSelectedNotes(new Set())
      setMultiSelectMode(false)
      addNotification('Notes deleted', `${selectedNotes.size} note(s) have been removed successfully`, 'success')
    } catch (error) {
      console.error('Failed to delete notes:', error)
      addNotification('Failed to delete notes', 'Please try again', 'destructive')
    }
  }

  const selectAllNotes = () => {
    if (selectedNotes.size === filteredNotes.length) {
      setSelectedNotes(new Set())
    } else {
      setSelectedNotes(new Set(filteredNotes.map(note => note.id)))
    }
  }

  const filteredNotes = allNotes.filter(note => 
    note.title.toLowerCase().includes(notesSearchQuery.toLowerCase()) ||
    note.note.toLowerCase().includes(notesSearchQuery.toLowerCase()) ||
    note.channelName.toLowerCase().includes(notesSearchQuery.toLowerCase())
  )

  const hasNotes = (videoId: string): boolean => {
    return allNotes.some(note => note.videoId === videoId)
  }

  const isWatched = (videoId: string): boolean => {
    return watchedVideos.some(video => video.videoId === videoId)
  }

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev)
  }, [])

  const handleTabNavigationWithMobileMenu = useCallback((tabId: Tab) => {
    handleTabNavigation(tabId)
    setMobileMenuOpen(false)
  }, [handleTabNavigation])

  const clearAllData = async (): Promise<void> => {
    setShowClearDataConfirmation(true)
  }

  const confirmClearAllData = async (): Promise<void> => {
    try {
      setLoading(true)
      setShowClearDataConfirmation(false)
      addNotification('Clearing data', 'Removing all your data...', 'info', false)
      
      // Clear database
      const response = await fetch('/api/clear-all-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to clear data from database')
      }
      
      const result = await response.json()
      
      // Clear localStorage
      const keysToRemove = [
        'mytube-auto-load-more',
        'mytube-favorites-enabled',
        'mytube-favorites-paused',
        'mytube-search-cache',
        'mytube-user-preferences',
        'mytube-navigation-history',
        'mytube-notifications'
      ]
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })
      
      // Clear search cache
      setSearchCache(new Map())
      
      // Clear all state
      setWatchedVideos([])
      setFavoriteChannels([])
      setFavoriteVideos([])
      setChannelVideos([])
      setChannelSearchResults([])
      setSearchResults(null)
      setSelectedVideo(null)
      setSelectedItems(new Set())
      setNotifications([])
      setMultiSelectMode(false)
      
      // Reload fresh data
      await Promise.all([
        loadWatchedVideos(),
        loadFavoriteChannels(),
        loadFavoriteVideos()
      ])
      
      addNotification('Success!', `Cleared ${result.deleted.total} items from database and all local data`, 'success')
      setShowSettings(false)
      
    } catch (error) {
      console.error('Failed to clear all data:', error)
      addNotification('Error', 'Failed to clear all data. Please try again.', 'destructive')
    } finally {
      setLoading(false)
    }
  }

  const loadChannelVideos = useCallback(async () => {
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
      setChannelVideos([])
    } finally {
      setChannelVideosLoading(false)
    }
  }, [favoriteChannels])

  // Load followed channels content
  const loadFollowedChannelsContent = useCallback(async (resetPages = false) => {
    if (resetPages) {
      setVideoPage(1)
      setPlaylistPage(1)
    }
    
    setFollowedChannelsLoading(true)
    try {
      const currentPage = resetPages ? 1 : videoPage
      const currentPlaylistPage = resetPages ? 1 : playlistPage
      
      const response = await fetch(
        `/api/followed-channels?maxVideos=50&maxPlaylists=20&includePlaylists=true&videoPage=${currentPage}&playlistPage=${currentPlaylistPage}&videosPerPage=${videosPerPage}&playlistsPerPage=${playlistsPerPage}`
      )
      if (response.ok) {
        const data = await response.json()
        console.log('Frontend received followed channels data:', {
          channels: data.channels?.length || 0,
          videos: data.videos?.length || 0,
          playlists: data.playlists?.length || 0,
          totalVideos: data.stats?.totalVideos || 0,
          totalPlaylists: data.stats?.totalPlaylists || 0
        })
        setFollowedChannelsContent(data)
        setFollowedChannelsVideos(data.videos || [])
        setFollowedChannelsPlaylists(data.playlists || [])
        setFollowedChannels(data.channels || [])
        setVideoPagination(data.pagination?.videos || null)
        setPlaylistPagination(data.pagination?.playlists || null)
        console.log('Followed channels content loaded:', {
          videos: data.videos?.length || 0,
          playlists: data.playlists?.length || 0,
          channels: data.channels?.length || 0,
          videoPage: data.pagination?.videos?.currentPage,
          playlistPage: data.pagination?.playlists?.currentPage
        })
      } else {
        console.error('Failed to load followed channels content:', response.statusText)
      }
    } catch (error) {
      console.error('Error loading followed channels content:', error)
    } finally {
      setFollowedChannelsLoading(false)
    }
  }, [videoPage, playlistPage])

  // Load next page of videos
  const loadNextVideoPage = useCallback(() => {
    if (videoPagination?.hasNextPage) {
      setVideoPage(prev => prev + 1)
    }
  }, [videoPagination])

  // Load previous page of videos
  const loadPrevVideoPage = useCallback(() => {
    if (videoPagination?.hasPreviousPage) {
      setVideoPage(prev => prev - 1)
    }
  }, [videoPagination])

  // Load next page of playlists
  const loadNextPlaylistPage = useCallback(() => {
    if (playlistPagination?.hasNextPage) {
      setPlaylistPage(prev => prev + 1)
    }
  }, [playlistPagination])

  // Load previous page of playlists
  const loadPrevPlaylistPage = useCallback(() => {
    if (playlistPagination?.hasPreviousPage) {
      setPlaylistPage(prev => prev - 1)
    }
  }, [playlistPagination])

  // YouTube URL player functions
  const playYouTubeUrl = useCallback(async () => {
    const trimmedUrl = youtubeUrl.trim()
    if (!trimmedUrl) {
      setUrlError('Please enter a YouTube URL')
      return
    }

    // Validate YouTube URL
    const urlValidation = validateYouTubeUrl(trimmedUrl)
    if (!urlValidation.isValid) {
      setUrlError(urlValidation.error || 'Invalid YouTube URL')
      return
    }

    setLoadingUrl(true)
    setUrlError('')
    setUrlSuccess('')

    try {
      const response = await fetch('/api/youtube/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmedUrl })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to process YouTube URL')
      }

      const data = await response.json()

      if (data.success) {
        // Validate video ID from response
        if (!data.videoId) {
          throw new Error('No video ID returned from server')
        }

        // Create video object from response
        const videoObject = {
          id: data.videoId,
          videoId: data.videoId,
          title: data.title || 'Unknown Video',
          channelName: data.channelName || 'Unknown Channel',
          thumbnail: data.thumbnail || `https://img.youtube.com/vi/${data.videoId}/mqdefault.jpg`,
          duration: data.duration,
          viewCount: data.viewCount || 0,
          publishedAt: data.publishedAt,
          isLive: data.isLive || false,
          description: data.description || ''
        }

        setSelectedVideo(videoObject)
        setYoutubeUrl('')
        setUrlSuccess(`Successfully loaded: ${videoObject.title}`)
        
        // Add to watched history
        try {
          await fetch('/api/watched', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              videoId: data.videoId,
              title: data.title,
              channelName: data.channelName,
              thumbnail: data.thumbnail,
              duration: data.duration,
              viewCount: data.viewCount
            })
          })
          await loadWatchedVideos()
        } catch (watchError) {
          console.error('Failed to add to watched history:', watchError)
        }

        if (data.warning) {
          addNotification('Video Loaded with Warning', data.warning, 'info')
        } else {
          addNotification('Video Loaded', `Now playing: ${data.title}`, 'success')
        }
      }
    } catch (error) {
      console.error('Error playing YouTube URL:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load YouTube video'
      setUrlError(errorMessage)
      addNotification('Error Loading Video', errorMessage, 'destructive')
    } finally {
      setLoadingUrl(false)
    }
  }, [youtubeUrl, addNotification, loadWatchedVideos])

  

  const handleSearch = async (append: boolean = false) => {
    const trimmedQuery = searchQuery.trim()
    
    if (append && !currentSearchQuery.trim()) {
      setHasMoreVideos(false)
      return
    }
    
    // Validate search query
    const validation = validateSearchQuery(append ? currentSearchQuery : trimmedQuery)
    if (!validation.isValid) {
      addNotification('Invalid Search Query', validation.error || 'Invalid search query', 'destructive')
      if (!append) {
        setHasMoreVideos(false)
      }
      return
    }
    
    const validatedQuery = validation.sanitized
    
    if (!append) {
      const cachedResults = getCachedResults(validatedQuery, searchType)
      if (cachedResults) {
        setSearchResults({ items: cachedResults.items })
        setContinuationToken(cachedResults.continuation)
        setHasMoreVideos(cachedResults.hasMore)
        setCurrentSearchQuery(validatedQuery)
        showDynamicConfirmation('search', cachedResults.items.length)
        return
      }
      
      setLoading(true)
      showDynamicLoading('search')
      setContinuationToken(null)
      setCurrentSearchQuery(validatedQuery)
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
      const queryToUse = append ? currentSearchQuery : validatedQuery
      const params = new URLSearchParams({
        query: queryToUse,
        type: searchType
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
        addNotification('Search Error', data.error, 'destructive')
        if (!append) setSearchResults(null)
        return
      }
      
      if (!data.items || data.items.length === 0) {
        if (!append) {
          addNotification('No Results', `No videos found for "${queryToUse}"`, 'info')
          setSearchResults({ items: [] })
          setCachedResults(queryToUse, [], null, false, searchType)
        } else {
          addNotification('No More Videos', 'No more videos found for this search', 'info')
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
      
      let finalItems: SearchResultItem[]
      if (append && searchResults?.items) {
        const existingVideoIds = new Set(searchResults.items.map(v => v.id))
        // Convert YouTube videos and playlists to SimpleVideo/SimplePlaylist format
        const convertedItems = data.items.map((item: any) => {
          if (item.type === 'playlist') {
            return convertYouTubePlaylist(item)
          } else {
            return convertYouTubeVideo(item)
          }
        })
        const newItems = convertedItems.filter((item: SearchResultItem) => !existingVideoIds.has(item.id))
        
        if (newItems.length > 0) {
          finalItems = [...searchResults.items, ...newItems]
        } else {
          finalItems = searchResults.items
          addNotification('No New Items', 'All items already loaded', 'info')
        }
      } else {
        // Convert YouTube videos and playlists to SimpleVideo/SimplePlaylist format
        finalItems = data.items.map((item: any) => {
          if (item.type === 'playlist') {
            return convertYouTubePlaylist(item)
          } else {
            return convertYouTubeVideo(item)
          }
        })
      }
      
      setSearchResults({ items: finalItems })
      setContinuationToken(data.continuation || null)
      setHasMoreVideos(!!data.continuation)
      
      if (!append) {
        const videosOnly = finalItems.filter(item => 'videoId' in item) as SimpleVideo[]
        setCachedResults(queryToUse, videosOnly, data.continuation || null, !!data.continuation, searchType)
        showDynamicConfirmation('search', finalItems.length)
      } else {
        showDynamicConfirmation('search', data.items.length)
      }
      
    } catch (error) {
      console.error('Search error:', error)
      addNotification('Search Failed', 'An error occurred while searching. Please try again.', 'destructive')
      if (!append) setSearchResults(null)
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setDynamicLoadingMessage('')
    }
  }

  // Load playlist videos
  const loadPlaylistVideos = async (playlist: Playlist) => {
    try {
      setPlaylistVideosLoading(true)
      setSelectedPlaylist(playlist)
      setShowPlaylistVideos(true)
      showDynamicLoading('search')
      
      if (!playlist.playlistId) {
        throw new Error('Playlist ID is required')
      }
      
      const response = await fetch(`/api/youtube/playlist/${playlist.playlistId}/videos?loadAll=true`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to load playlist videos (${response.status})`)
      }
      
      const data = await response.json()
      
      if (!data.videos || !Array.isArray(data.videos)) {
        throw new Error('Invalid playlist data received')
      }
      
      // Convert videos to SimpleVideo format
      const convertedVideos = data.videos.map((video: any) => {
        try {
          return convertYouTubeVideo(video)
        } catch (conversionError) {
          console.error('Failed to convert video:', video, conversionError)
          return null
        }
      }).filter((video): video is Video => video !== null)
      
      if (convertedVideos.length === 0) {
        addNotification('Empty Playlist', 'This playlist contains no videos', 'info')
      } else {
        setPlaylistVideos(convertedVideos)
        showDynamicConfirmation('playlistLoaded', [playlist.title, convertedVideos.length])
      }
      
      // Switch to search tab to show playlist videos
      setActiveTab('search')
      
    } catch (error) {
      console.error('Failed to load playlist videos:', error)
      const errorMessage = error instanceof Error ? error.message : 'Could not load playlist videos'
      addNotification('Failed to Load Playlist', errorMessage, 'destructive')
      
      // Reset playlist state on error
      setShowPlaylistVideos(false)
      setSelectedPlaylist(null)
      setPlaylistVideos([])
    } finally {
      setPlaylistVideosLoading(false)
      setDynamicLoadingMessage('')
    }
  }

  // Toggle playlist expansion and load videos inline
  const togglePlaylistExpansion = async (playlist: Playlist) => {
    const playlistId = playlist.id || playlist.playlistId
    if (!playlistId) return

    const isExpanded = expandedPlaylists.has(playlistId)
    
    if (isExpanded) {
      // Collapse playlist
      setExpandedPlaylists(prev => {
        const newSet = new Set(prev)
        newSet.delete(playlistId)
        return newSet
      })
    } else {
      // Expand playlist and load videos
      setExpandedPlaylistLoading(prev => new Map(prev).set(playlistId, true))
      
      try {
        if (!playlist.playlistId) {
          throw new Error('Playlist ID is required')
        }
        
        const response = await fetch(`/api/youtube/playlist/${playlist.playlistId}/videos?loadAll=true`)
        
        if (!response.ok) {
          throw new Error('Failed to load playlist videos')
        }
        
        const data = await response.json()
        
        if (!data.videos || !Array.isArray(data.videos)) {
          throw new Error('Invalid playlist data received')
        }
        
        // Convert videos to SimpleVideo format (limit to first 5 for inline display)
        const convertedVideos = data.videos
          .slice(0, 5) // Limit to 5 videos for inline display
          .map((video: any) => {
            try {
              return convertYouTubeVideo(video)
            } catch (conversionError) {
              console.error('Failed to convert video:', video, conversionError)
              return null
            }
          })
          .filter((video): video is Video => video !== null)
        
        setExpandedPlaylistVideos(prev => new Map(prev).set(playlistId, convertedVideos))
        setExpandedPlaylists(prev => new Set(prev).add(playlistId))
        
        if (convertedVideos.length > 0) {
          addNotification('Playlist Expanded', `Loaded ${convertedVideos.length} videos from "${playlist.title}"`, 'success')
        }
        
      } catch (error) {
        console.error('Failed to expand playlist:', error)
        addNotification('Failed to Expand Playlist', 'Could not load playlist videos', 'destructive')
      } finally {
        setExpandedPlaylistLoading(prev => {
          const newMap = new Map(prev)
          newMap.delete(playlistId)
          return newMap
        })
      }
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
    setPreviousTab(activeTab) // Track the previous tab
    setSelectedVideo(video)
    setActiveTab('player')
    
    // Update navigation history for player
    setNavigationHistory(prev => [...prev, 'player'])
    
    try {
      // Use video.videoId if available (for database videos), otherwise use video.id (for YouTube videos)
      const videoId = video.videoId || video.id
      const thumbnailUrl = getThumbnailUrl(video)
      await fetch('/api/watched', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: videoId,
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

  const handleVideoSelect = (video: Video) => {
    handleVideoPlay(video)
  }

  const handleNextVideo = useCallback(() => {
    if (!selectedVideo) return

    // Get all available video lists
    const allVideos: Video[] = []
    
    // Add search results if available
    if (searchResults?.items) {
      allVideos.push(...searchResults.items.filter(item => 'videoId' in item) as Video[])
    }
    
    // Add channel videos if available
    if (channelVideos.length > 0) {
      allVideos.push(...channelVideos)
    }
    
    // Add favorite videos if available
    if (favoriteVideos.length > 0) {
      allVideos.push(...favoriteVideos.map(v => ({
        id: v.id,
        videoId: v.videoId,
        title: v.title,
        channelName: v.channelName,
        thumbnail: v.thumbnail,
        duration: v.duration,
        viewCount: v.viewCount,
        publishedAt: '', // Add default if needed
        isLive: false,
        description: ''
      })))
    }
    
    // Add watched videos if available
    if (watchedVideos.length > 0) {
      allVideos.push(...watchedVideos.map(v => ({
        id: v.id,
        videoId: v.videoId,
        title: v.title,
        channelName: v.channelName,
        thumbnail: v.thumbnail,
        duration: v.duration,
        viewCount: v.viewCount,
        publishedAt: v.watchedAt,
        isLive: false,
        description: ''
      })))
    }

    // Remove duplicates and current video
    const uniqueVideos = allVideos.filter((video, index, self) => 
      index === self.findIndex((v) => v.id === video.id) && video.id !== selectedVideo.id
    )

    if (uniqueVideos.length === 0) {
      addNotification('No more videos', 'No next video available', 'info')
      return
    }

    // Find current video index and get next video
    const currentVideoIndex = allVideos.findIndex(v => v.id === selectedVideo.id)
    let nextVideo: Video | null = null

    if (currentVideoIndex !== -1 && currentVideoIndex < allVideos.length - 1) {
      // Get next video from the same list
      nextVideo = allVideos[currentVideoIndex + 1]
    } else {
      // Get first video from available videos
      nextVideo = uniqueVideos[0]
    }

    if (nextVideo) {
      handleVideoPlay(nextVideo)
      addNotification('Next video', `Now playing: ${nextVideo.title}`, 'info')
    } else {
      addNotification('No more videos', 'No next video available', 'info')
    }
  }, [selectedVideo, searchResults, channelVideos, favoriteVideos, watchedVideos, handleVideoPlay, addNotification])

  const handlePreviousVideo = useCallback(() => {
    if (!selectedVideo) return

    // Get all available video lists
    const allVideos: Video[] = []
    
    // Add search results if available
    if (searchResults?.items) {
      allVideos.push(...searchResults.items.filter(item => 'videoId' in item) as Video[])
    }
    
    // Add channel videos if available
    if (channelVideos.length > 0) {
      allVideos.push(...channelVideos)
    }
    
    // Add favorite videos if available
    if (favoriteVideos.length > 0) {
      allVideos.push(...favoriteVideos.map(v => ({
        id: v.id,
        videoId: v.videoId,
        title: v.title,
        channelName: v.channelName,
        thumbnail: v.thumbnail,
        duration: v.duration,
        viewCount: v.viewCount,
        publishedAt: '', // Add default if needed
        isLive: false,
        description: ''
      })))
    }
    
    // Add watched videos if available
    if (watchedVideos.length > 0) {
      allVideos.push(...watchedVideos.map(v => ({
        id: v.id,
        videoId: v.videoId,
        title: v.title,
        channelName: v.channelName,
        thumbnail: v.thumbnail,
        duration: v.duration,
        viewCount: v.viewCount,
        publishedAt: v.watchedAt,
        isLive: false,
        description: ''
      })))
    }

    // Remove duplicates and current video
    const uniqueVideos = allVideos.filter((video, index, self) => 
      index === self.findIndex((v) => v.id === video.id) && video.id !== selectedVideo.id
    )

    if (uniqueVideos.length === 0) {
      addNotification('No more videos', 'No previous video available', 'info')
      return
    }

    // Find current video index and get previous video
    const currentVideoIndex = allVideos.findIndex(v => v.id === selectedVideo.id)
    let previousVideo: Video | null = null

    if (currentVideoIndex > 0) {
      // Get previous video from the same list
      previousVideo = allVideos[currentVideoIndex - 1]
    } else {
      // Get last video from available videos
      previousVideo = uniqueVideos[uniqueVideos.length - 1]
    }

    if (previousVideo) {
      handleVideoPlay(previousVideo)
      addNotification('Previous video', `Now playing: ${previousVideo.title}`, 'info')
    } else {
      addNotification('No more videos', 'No previous video available', 'info')
    }
  }, [selectedVideo, searchResults, channelVideos, favoriteVideos, watchedVideos, handleVideoPlay, addNotification])

  const toggleFavorite = async (video: Video) => {
    // Check if favorites are enabled
    if (!favoritesEnabled) {
      addNotification('Favorites Disabled', 'Favorites module is disabled in settings', 'info')
      return
    }
    
    // Check if favorites are paused
    if (favoritesPaused) {
      addNotification('Favorites Paused', 'Cannot add/remove favorites while paused', 'info')
      return
    }
    
    try {
      // Use video.videoId if available (for database videos), otherwise use video.id (for YouTube videos)
      const videoId = video.videoId || video.id
      const isFavorite = favoriteVideos.some(v => v.videoId === videoId)
      const thumbnailUrl = getThumbnailUrl(video)
      
      if (isFavorite) {
        showDynamicLoading('favorites')
        const response = await fetch(`/api/favorites/${videoId}`, { 
          method: 'DELETE' 
        })
        
        if (response.ok) {
          showDynamicConfirmation('favorites', 'remove')
          await loadFavoriteVideos()
        } else {
          addNotification('Error', 'Failed to remove from favorites', 'destructive')
        }
      } else {
        showDynamicLoading('favorites')
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: videoId,
            title: video.title,
            channelName: getChannelName(video),
            thumbnail: thumbnailUrl,
            duration: video.duration,
            viewCount: video.viewCount
          })
        })
        
        if (response.ok) {
          showDynamicConfirmation('favorites', 'add')
          await loadFavoriteVideos()
        } else {
          addNotification('Error', 'Failed to add to favorites', 'destructive')
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      addNotification('Error', 'Network error while updating favorites', 'destructive')
    } finally {
      setDynamicLoadingMessage('')
    }
  }

  const handleChannelSearch = async (): Promise<void> => {
    const trimmedQuery = channelSearchQuery.trim()
    if (!trimmedQuery) {
      addNotification('Channel Search Required', 'Please enter a channel name to search', 'info')
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
      addNotification('Error', 'Failed to search channels', 'destructive')
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
          addNotification('Unfollowed', `You are no longer following ${channel.name}`, 'success')
          await loadFavoriteChannels()
        } else {
          addNotification('Error', 'Failed to unfollow channel', 'destructive')
        }
      } else {
        const response = await fetch('/api/channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId: channel.channelId,
            name: channel.name,
            thumbnail: getChannelThumbnailUrl(channel),
            subscriberCount: channel.subscriberCount,
            viewCount: channel.viewCount
          })
        })
        
        if (response.ok) {
          addNotification('Following', `You are now following ${channel.name}`, 'success')
          await loadFavoriteChannels()
        } else {
          addNotification('Error', 'Failed to follow channel', 'destructive')
        }
      }
    } catch (error) {
      console.error('Error following channel:', error)
      addNotification('Error', 'Network error while following channel', 'destructive')
    }
  }

  // Load initial data
  useEffect(() => {
    // Load user preferences from localStorage
    const savedAutoLoadMore = localStorage.getItem('mytube-auto-load-more')
    if (savedAutoLoadMore !== null) {
      setAutoLoadMore(savedAutoLoadMore === 'true')
    }
    
    const savedFavoritesEnabled = localStorage.getItem('mytube-favorites-enabled')
    if (savedFavoritesEnabled !== null) {
      setFavoritesEnabled(savedFavoritesEnabled === 'true')
    }
    
    const savedFavoritesPaused = localStorage.getItem('mytube-favorites-paused')
    if (savedFavoritesPaused !== null) {
      setFavoritesPaused(savedFavoritesPaused === 'true')
    }

    const loadInitialData = async () => {
      try {
        await Promise.all([
          loadWatchedVideos(),
          loadFavoriteChannels(),
          loadFavoriteVideos(),
          loadNotes(),
          loadFollowedChannelsContent(true)
        ])
        if (favoriteChannels.length > 0) {
          await loadChannelVideos()
        }
      } catch (error) {
        addNotification('Failed to load initial data', 'Please refresh the page', 'destructive')
      }
    }
    
    if (!showSplashScreen) {
      loadInitialData()
    }
  }, [showSplashScreen, loadWatchedVideos, loadFavoriteChannels, loadFavoriteVideos, loadNotes, loadFollowedChannelsContent, loadChannelVideos, favoriteChannels.length, addNotification])

  // Load channel videos when favorite channels change
  useEffect(() => {
    if (!showSplashScreen && favoriteChannels.length > 0) {
      loadChannelVideos()
    }
  }, [favoriteChannels.length, showSplashScreen, loadChannelVideos])

  // Load followed channels content when page changes
  useEffect(() => {
    if (videoPage > 1 || playlistPage > 1) {
      console.log('Loading followed channels content for page change:', { videoPage, playlistPage })
      setFollowedChannelsLoading(true)
      const currentPage = videoPage
      const currentPlaylistPage = playlistPage
      
      fetch(
        `/api/followed-channels?maxVideos=50&maxPlaylists=20&includePlaylists=true&videoPage=${currentPage}&playlistPage=${currentPlaylistPage}&videosPerPage=${videosPerPage}&playlistsPerPage=${playlistsPerPage}`
      ).then(response => {
        if (response.ok) {
          return response.json()
        }
        throw new Error('Failed to load followed channels content')
      }).then(data => {
        console.log('Page change - received followed channels data:', {
          channels: data.channels?.length || 0,
          videos: data.videos?.length || 0,
          playlists: data.playlists?.length || 0
        })
        setFollowedChannelsContent(data)
        setFollowedChannelsVideos(data.videos || [])
        setFollowedChannelsPlaylists(data.playlists || [])
        setFollowedChannels(data.channels || [])
        setVideoPagination(data.pagination?.videos || null)
        setPlaylistPagination(data.pagination?.playlists || null)
      }).catch(error => {
        console.error('Error loading followed channels content:', error)
      }).finally(() => {
        setFollowedChannelsLoading(false)
      })
    }
  }, [videoPage, playlistPage])

  // Refresh data when switching tabs to ensure icons are up to date
  useEffect(() => {
    if (!showSplashScreen) {
      const refreshData = async () => {
        try {
          await Promise.all([
            loadWatchedVideos(),
            loadNotes()
          ])
        } catch (error) {
          console.error('Failed to refresh data:', error)
        }
      }
      refreshData()
    }
  }, [activeTab, showSplashScreen, loadWatchedVideos, loadNotes])

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

  useEffect(() => {
    if (multiSelectMode) {
      clearSelection()
    }
  }, [activeTab, multiSelectMode, clearSelection])

  const VideoCard = useCallback(({ video, showActions = true }: { video: Video | any, showActions?: boolean }) => {
    // Use video.videoId if available (for database videos), otherwise use video.id (for YouTube videos)
    const videoId = video.videoId || video.id
    const isFavorite = favoriteVideoIds.has(videoId)
    const isSelected = selectedItems.has(videoId)
    const thumbnailUrl = getThumbnailUrl(video)
    const channelName = getChannelName(video)
    const channelLogo = getChannelLogo(video)
    
    return (
      <Card className={`group relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-border/50 hover:border-primary/30 ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
      }`}>
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-3">
            {/* Thumbnail Section */}
            <div className="relative aspect-video w-full">
              <img
                src={thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover rounded-md"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = `https://via.placeholder.com/320x180/374151/ffffff?text=No+Thumbnail`
                }}
              />
              {video.duration && (
                <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5">
                  {formatDuration(video.duration)}
                </Badge>
              )}
              {/* Overlay Actions on Hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button
                  size="sm"
                  onClick={() => handleVideoSelect(video)}
                  className="bg-white/90 hover:bg-white text-black hover:scale-110 transition-transform"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Play
                </Button>
              </div>
            </div>
            
            {/* Content Section */}
            <div className="space-y-2">
              {/* Title */}
              <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                {video.title}
              </h3>
              
              {/* Channel Info */}
              <div className="flex items-center gap-2">
                {channelLogo && (
                  <img 
                    src={channelLogo} 
                    alt={channelName}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {channelName}
                  </p>
                  {getChannelHandle(video) && (
                    <span className="text-xs text-muted-foreground opacity-70 hidden sm:inline">
                      {getChannelHandle(video)}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Video Stats */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                {video.viewCount && (
                  <span>{formatViewCount(video.viewCount)}</span>
                )}
                {video.publishedAt && (
                  <>
                    <span>•</span>
                    <span>{formatPublishedAt(video.publishedAt)}</span>
                  </>
                )}
                {getChannelSubscriberCount(video) && (
                  <>
                    <span>•</span>
                    <span className="hidden sm:inline">{getChannelSubscriberCount(video)}</span>
                  </>
                )}
              </div>
              
              {/* Description - Hidden on mobile */}
              {video.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 hidden sm:block">
                  {video.description}
                </p>
              )}
            </div>
            
            {/* Action Buttons */}
            {showActions && (
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleVideoSelect(video)}
                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  {favoritesEnabled && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleFavorite(video)}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500"
                      disabled={favoritesPaused}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''} ${favoritesPaused ? 'opacity-50' : ''}`} />
                    </Button>
                  )}
                </div>
                {multiSelectMode && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleItemSelection(videoId)}
                    className="w-4 h-4"
                  />
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }, [favoriteVideoIds, selectedItems, multiSelectMode, toggleItemSelection, handleVideoSelect, toggleFavorite])

  const PlaylistCard = useCallback(({ playlist }: { playlist: Playlist }) => {
    const isSelected = selectedItems.has(playlist.id)
    const playlistId = playlist.id || playlist.playlistId
    const isExpanded = playlistId ? expandedPlaylists.has(playlistId) : false
    const isLoading = playlistId ? expandedPlaylistLoading.get(playlistId) || false : false
    const videos = playlistId ? expandedPlaylistVideos.get(playlistId) || [] : []
    const thumbnailUrl = playlist.thumbnail
    
    return (
      <Card className={`group relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-border/50 hover:border-primary/30 ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
      }`}>
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-3">
            {/* Thumbnail Section */}
            <div className="relative aspect-video w-full">
              <img
                src={thumbnailUrl}
                alt={playlist.title}
                className="w-full h-full object-cover rounded-md"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = `https://via.placeholder.com/320x180/374151/ffffff?text=Playlist`
                }}
              />
              <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5">
                {playlist.videoCount} videos
              </Badge>
              <Badge className="absolute top-2 left-2 bg-purple-600/90 text-white text-xs px-1.5 py-0.5">
                Playlist
              </Badge>
              
              {/* Expand/Collapse Button */}
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  togglePlaylistExpansion(playlist)
                }}
                className="absolute top-2 right-2 h-7 w-7 p-0 bg-black/80 hover:bg-black text-white hover:text-white z-10"
                title={isExpanded ? "Collapse playlist" : "Expand playlist"}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    loadPlaylistVideos(playlist)
                  }}
                  className="bg-white/90 hover:bg-white text-black hover:scale-110 transition-transform"
                  disabled={playlistVideosLoading}
                >
                  {playlistVideosLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-1" />
                  )}
                  Play
                </Button>
              </div>
            </div>
            
            {/* Content Section */}
            <div className="space-y-2">
              {/* Title */}
              <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                {playlist.title}
              </h3>
              
              {/* Channel Info */}
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {playlist.channelName}
                </p>
                <span className="text-xs text-muted-foreground opacity-70 hidden sm:inline">
                  @{playlist.channelName.toLowerCase().replace(/\s+/g, '')}
                </span>
              </div>
              
              {/* Playlist Stats */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <span>{playlist.videoCount} videos</span>
                {playlist.viewCount && (
                  <>
                    <span>•</span>
                    <span>{formatViewCount(playlist.viewCount)}</span>
                  </>
                )}
                {playlist.lastUpdatedAt && (
                  <>
                    <span>•</span>
                    <span className="hidden sm:inline">{playlist.lastUpdatedAt}</span>
                  </>
                )}
              </div>
              
              {/* Description - Hidden on mobile */}
              {playlist.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 hidden sm:block">
                  {playlist.description}
                </p>
              )}
            </div>
            
            {/* Action Section */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    loadPlaylistVideos(playlist)
                  }}
                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                  disabled={playlistVideosLoading}
                  title="View full playlist"
                >
                  {playlistVideosLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePlaylistExpansion(playlist)
                  }}
                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                  disabled={isLoading}
                  title={isExpanded ? "Collapse playlist" : "Expand playlist"}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {multiSelectMode && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleItemSelection(playlist.id)}
                  className="w-4 h-4"
                />
              )}
            </div>
            
            {/* Expanded Playlist Videos */}
            {isExpanded && (
              <ExpandedPlaylistVideos 
                playlist={playlist}
                videos={videos}
                isLoading={isLoading}
                onVideoSelect={handleVideoPlay}
              />
            )}
          </div>
        </CardContent>
      </Card>
    )
  }, [selectedItems, multiSelectMode, toggleItemSelection, loadPlaylistVideos, playlistVideosLoading, expandedPlaylists, expandedPlaylistLoading, expandedPlaylistVideos, togglePlaylistExpansion])

  // Expanded Playlist Videos Component - moved outside to avoid useState hook issue
  const ExpandedPlaylistVideos = ({ playlist, videos, isLoading, onVideoSelect }: { 
    playlist: Playlist, 
    videos: Video[], 
    isLoading: boolean,
    onVideoSelect: (video: Video) => void
  }) => {
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    
    const handlePreviousVideo = () => {
      setCurrentVideoIndex(prev => Math.max(0, prev - 1))
    }
    
    const handleNextVideo = () => {
      setCurrentVideoIndex(prev => Math.min(videos.length - 1, prev + 1))
    }
    
    const handlePlayVideo = (video: Video) => {
      onVideoSelect(video)
      setIsPlaying(true)
    }
    
    const handlePlayAll = () => {
      if (videos.length > 0) {
        onVideoSelect(videos[0])
        setIsPlaying(true)
      }
    }

    // Auto-advance to next video when current video finishes
    useEffect(() => {
      if (isPlaying && backgroundVideo && backgroundCurrentTime >= backgroundDuration - 1) {
        // Video is about to finish, advance to next
        if (currentVideoIndex < videos.length - 1) {
          handleNextVideo()
          setTimeout(() => {
            if (videos[currentVideoIndex + 1]) {
              onVideoSelect(videos[currentVideoIndex + 1])
            }
          }, 100)
        }
      }
    }, [backgroundCurrentTime, backgroundDuration, isPlaying, currentVideoIndex, videos.length])

    // Reset playing state when background video changes
    useEffect(() => {
      if (backgroundVideo) {
        const currentVideoId = backgroundVideo.videoId || backgroundVideo.id
        const currentPlaylistVideo = videos[currentVideoIndex]
        if (currentPlaylistVideo && (currentPlaylistVideo.videoId === currentVideoId || currentPlaylistVideo.id === currentVideoId)) {
          setIsPlaying(isBackgroundPlaying)
        } else {
          setIsPlaying(false)
        }
      }
    }, [backgroundVideo, isBackgroundPlaying, currentVideoIndex, videos])

    if (isLoading) {
      return (
        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            <span className="ml-2 text-sm text-muted-foreground">Loading playlist videos...</span>
          </div>
        </div>
      )
    }

    if (videos.length === 0) {
      return (
        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center py-4">
            <Music className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No videos found in this playlist</p>
          </div>
        </div>
      )
    }

    const currentVideo = videos[currentVideoIndex]

    return (
      <div className="mt-4 space-y-4">
        {/* Playlist Controls */}
        <div className="bg-gradient-to-r from-purple-50 via-purple-25 to-transparent dark:from-purple-900/20 dark:via-purple-800/10 dark:to-transparent rounded-xl p-4 border border-purple-200/50 dark:border-purple-800/30 shadow-sm">
          <div className="flex flex-col gap-4">
            {/* Current Video Info */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <img
                  src={getThumbnailUrl(currentVideo)}
                  alt={currentVideo.title}
                  className="w-16 h-10 object-cover rounded-md"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = `https://via.placeholder.com/64x40/374151/ffffff?text=Video`
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-purple-900 dark:text-purple-100 truncate">
                  {currentVideo?.title || 'No video selected'}
                </h4>
                <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                  <span>{currentVideoIndex + 1} of {videos.length}</span>
                  {currentVideo.duration && (
                    <>
                      <span>•</span>
                      <span>{formatDuration(currentVideo.duration)}</span>
                    </>
                  )}
                  {isPlaying && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Now Playing
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Playback Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousVideo}
                  disabled={currentVideoIndex === 0}
                  className="h-9 w-9 p-0"
                  title="Previous video"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                
                <Button
                  size="sm"
                  onClick={() => isPlaying ? pauseBackgroundVideo() : handlePlayVideo(currentVideo)}
                  className="h-9 px-4 bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
                  title={isPlaying ? "Pause" : "Play current video"}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Play
                    </>
                  )}
                </Button>
                
                <Button
                  size="sm"
                  onClick={handlePlayAll}
                  className="h-9 px-3 border-purple-300 text-purple-700 hover:bg-purple-50"
                  title="Play playlist from beginning"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Play All
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextVideo}
                  disabled={currentVideoIndex === videos.length - 1}
                  className="h-9 w-9 p-0"
                  title="Next video"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Volume and Progress */}
              <div className="flex-1 flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs text-purple-600 dark:text-purple-400 mb-1">
                    <span>Video {currentVideoIndex + 1}</span>
                    <span>{videos.length} total</span>
                  </div>
                  <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                    <div 
                      className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentVideoIndex + 1) / videos.length) * 100}%` }}
                    />
                  </div>
                </div>
                
                {backgroundVideo && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatTime(backgroundCurrentTime)}</span>
                    <span>/</span>
                    <span>{formatTime(backgroundDuration)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Videos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {videos.map((video, index) => (
            <div 
              key={video.videoId || video.id} 
              className={`relative group cursor-pointer transition-all duration-200 ${
                index === currentVideoIndex 
                  ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md' 
                  : 'hover:bg-muted/50 hover:shadow-sm'
              } rounded-lg p-3 border`}
              onClick={() => {
                setCurrentVideoIndex(index)
                handlePlayVideo(video)
              }}
            >
              <div className="flex gap-3">
                {/* Thumbnail */}
                <div className="relative flex-shrink-0">
                  <img
                    src={getThumbnailUrl(video)}
                    alt={video.title}
                    className="w-20 h-12 object-cover rounded-md"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = `https://via.placeholder.com/80x48/374151/ffffff?text=Video`
                    }}
                  />
                  {video.duration && (
                    <Badge className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 py-0">
                      {formatDuration(video.duration)}
                    </Badge>
                  )}
                  {index === currentVideoIndex && (
                    <div className="absolute inset-0 bg-purple-600/30 rounded-md flex items-center justify-center">
                      {isPlaying ? (
                        <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center">
                          <Pause className="w-3 h-3 text-purple-600" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center">
                          <Play className="w-3 h-3 text-purple-600" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Video Info */}
                <div className="flex-1 min-w-0">
                  <h5 className={`text-sm font-medium line-clamp-2 transition-colors ${
                    index === currentVideoIndex 
                      ? 'text-purple-900 dark:text-purple-100' 
                      : 'group-hover:text-purple-600 dark:group-hover:text-purple-400'
                  }`}>
                    {video.title}
                  </h5>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getChannelName(video)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {video.duration && (
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(video.duration)}
                      </span>
                    )}
                    {index === currentVideoIndex && isPlaying && (
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600 dark:text-green-400">Playing</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Video Number */}
                <div className="flex-shrink-0">
                  <Badge 
                    variant={index === currentVideoIndex ? "default" : "secondary"}
                    className={`text-xs ${
                      index === currentVideoIndex 
                        ? 'bg-purple-600 text-white' 
                        : ''
                    }`}
                  >
                    #{index + 1}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* View Full Playlist Button */}
        {videos.length >= 5 && (
          <div className="text-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPlaylistVideos(playlist)}
              className="text-purple-600 border-purple-300 hover:bg-purple-50 hover:text-purple-700"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              View Full Playlist ({playlist.videoCount} videos)
            </Button>
          </div>
        )}
      </div>
    )
  }

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
            {/* Followed Channels Section */}
            <div className="bg-gradient-to-r from-blue-10 via-blue-5 to-transparent rounded-2xl p-6 border border-blue-20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                    Your Followed Channels
                  </h2>
                  <p className="text-muted-foreground">Latest videos and playlists from your favorite channels</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadFollowedChannelsContent(true)}
                  disabled={followedChannelsLoading}
                >
                  {followedChannelsLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Refreshing</>
                  ) : (
                    <><ArrowDown className="w-4 h-4 mr-2" /> Refresh</>
                  )}
                </Button>
              </div>

              {/* Followed Channels Info */}
              {followedChannels.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {followedChannels.map((channel) => (
                    <Card key={channel.id} className="p-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={channel.thumbnail?.url || `https://via.placeholder.com/48x48/374151/ffffff?text=${channel.name.charAt(0)}`}
                          alt={channel.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{channel.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {channel.subscriberCount ? `${channel.subscriberCount.toLocaleString()} subscribers` : 'No subscriber count'}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {channel.videoCount?.toLocaleString() || 0} videos
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {followedChannelsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-muted-foreground">Loading content from your channels...</span>
                </div>
              )}

              {/* Show message when no channels are followed */}
              {!followedChannelsLoading && followedChannels.length === 0 && (
                <Card className="p-8 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <Users className="w-12 h-12 text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">No Channels Followed Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start by adding your favorite YouTube channels to see their latest content here.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                          onClick={() => setActiveTab('search')}
                          className="w-full sm:w-auto"
                        >
                          <Search className="w-4 h-4 mr-2" />
                          Search Channels
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

              {/* Followed Channels Videos */}
              {!followedChannelsLoading && followedChannelsVideos.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Latest Videos</h3>
                    <Badge variant="outline">
                      {videoPagination ? `${videoPagination.totalItems} videos` : `${followedChannelsVideos.length} videos`}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {followedChannelsVideos.slice(0, 12).map((video) => {
                      const videoId = video.videoId || video.id
                      const isFavorite = favoriteVideoIds.has(videoId)
                      return (
                        <Card key={videoId} className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                          <div className="relative">
                            <img
                              src={video.thumbnail?.url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                              alt={video.title}
                              className="w-full h-32 object-cover rounded-t-lg"
                              onClick={() => handleVideoPlay(video)}
                            />
                            {video.duration && (
                              <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-xs">
                                {formatDuration(video.duration)}
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
                            {favoritesEnabled && (
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
                            )}
                          </div>
                          <CardContent className="p-3">
                            <h3 
                              className="font-medium line-clamp-2 text-sm mb-1 cursor-pointer hover:text-primary transition-colors"
                              onClick={() => handleVideoPlay(video)}
                            >
                              {video.title}
                            </h3>
                            <p className="text-xs text-muted-foreground">{video.channelName}</p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-muted-foreground">
                                {video.viewCount ? `${video.viewCount.toLocaleString()} views` : 'No view count'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatPublishedAt(video.publishedAt)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Video Pagination */}
              {!followedChannelsLoading && videoPagination && videoPagination.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadPrevVideoPage}
                    disabled={!videoPagination.hasPreviousPage || followedChannelsLoading}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-3">
                    Page {videoPagination.currentPage} of {videoPagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadNextVideoPage}
                    disabled={!videoPagination.hasNextPage || followedChannelsLoading}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}

              {/* Followed Channels Playlists */}
              {!followedChannelsLoading && followedChannelsPlaylists.length > 0 && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Playlists</h3>
                    <Badge variant="outline">
                      {playlistPagination ? `${playlistPagination.totalItems} playlists` : `${followedChannelsPlaylists.length} playlists`}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {followedChannelsPlaylists.slice(0, 6).map((playlist) => (
                      <Card key={playlist.id} className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                        <div className="relative">
                          <img
                            src={playlist.thumbnail?.url || `https://via.placeholder.com/320x180/374151/ffffff?text=${encodeURIComponent(playlist.title)}`}
                            alt={playlist.title}
                            className="w-full h-32 object-cover rounded-t-lg"
                            onClick={() => {
                              setSelectedPlaylist(playlist)
                              setShowPlaylistVideos(true)
                            }}
                          />
                          <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-xs">
                            {playlist.videoCount} videos
                          </Badge>
                          {/* Play button overlay */}
                          <div 
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-t-lg cursor-pointer"
                            onClick={() => {
                              setSelectedPlaylist(playlist)
                              setShowPlaylistVideos(true)
                            }}
                          >
                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform">
                              <Play className="w-6 h-6 text-black ml-1" />
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <h3 
                            className="font-medium line-clamp-2 text-sm mb-1 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => {
                              setSelectedPlaylist(playlist)
                              setShowPlaylistVideos(true)
                            }}
                          >
                            {playlist.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">{playlist.channelName}</p>
                          {playlist.lastUpdatedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Updated {new Date(playlist.lastUpdatedAt).toLocaleDateString()}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Playlist Pagination */}
              {!followedChannelsLoading && playlistPagination && playlistPagination.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadPrevPlaylistPage}
                    disabled={!playlistPagination.hasPreviousPage || followedChannelsLoading}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-3">
                    Page {playlistPagination.currentPage} of {playlistPagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadNextPlaylistPage}
                    disabled={!playlistPagination.hasNextPage || followedChannelsLoading}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}

              {/* Stats Section */}
              {!followedChannelsLoading && followedChannelsContent && (
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{followedChannelsContent.stats?.totalChannels || 0}</p>
                      <p className="text-sm text-muted-foreground">Channels</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{followedChannelsContent.stats?.totalVideos || 0}</p>
                      <p className="text-sm text-muted-foreground">Videos</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{followedChannelsContent.stats?.totalPlaylists || 0}</p>
                      <p className="text-sm text-muted-foreground">Playlists</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {followedChannelsContent.stats?.totalViews ? `${(followedChannelsContent.stats.totalViews / 1000000).toFixed(1)}M` : '0'}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Views</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Existing content sections */}
            {channelVideos.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Latest from Favorite Channels</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channelVideos.slice(0, 6).map((video) => {
                    const videoId = video.videoId || video.id
                    const isFavorite = favoriteVideoIds.has(videoId)
                    return (
                      <Card key={videoId} className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                        <div className="relative">
                          <img
                            src={getSafeThumbnailUrl(video)}
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
                          {favoritesEnabled && (
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
                          )}
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
                    const videoId = video.videoId || video.id
                    const isFavorite = favoriteVideoIds.has(videoId)
                    return (
                      <Card key={videoId} className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                        <div className="relative">
                          <img
                            src={getSafeThumbnailUrl(video)}
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
                          {favoritesEnabled && (
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
                          )}
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
                    const videoId = video.videoId || video.id
                    const isFavorite = favoriteVideoIds.has(videoId)
                    return (
                      <Card key={videoId} className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                        <div className="relative">
                          <img
                            src={getSafeThumbnailUrl(video)}
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
                          {favoritesEnabled && (
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
                          )}
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

            {followedChannelsContent === null && channelVideos.length === 0 && watchedVideos.length === 0 && favoriteVideos.length === 0 && (
              <Card className="p-12 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <Play className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Welcome to MyTube</h3>
                    <p className="text-muted-foreground mb-4">
                      Discover the latest content from your followed channels, or explore YouTube by searching for videos and adding channels to your favorites.
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
                Search Content
              </h2>
              <div className="flex gap-3">
                <Input
                  placeholder="Search for videos, playlists, channels..."
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
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as any)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="all">All</option>
                  <option value="video">Videos</option>
                  <option value="playlist">Playlists</option>
                  <option value="channel">Channels</option>
                </select>
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
            {showPlaylistVideos && selectedPlaylist ? (
              <div className="space-y-6">
                {/* Playlist Header */}
                <div className="bg-gradient-to-r from-purple-50 via-purple-25 to-transparent dark:from-purple-900/20 dark:via-purple-800/10 dark:to-transparent rounded-xl p-6 border border-purple-200/50 dark:border-purple-800/30">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    {/* Back Button */}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPlaylistVideos(false)
                        setSelectedPlaylist(null)
                        setPlaylistVideos([])
                      }}
                      className="h-10 px-4 flex-shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    
                    {/* Playlist Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-purple-900 dark:text-purple-100 truncate">
                          {selectedPlaylist.title}
                        </h2>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200">
                          Playlist
                        </Badge>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-purple-700 dark:text-purple-300">
                          {selectedPlaylist.channelName}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1">
                          <Play className="w-3 h-3" />
                          {playlistVideos.length} of {selectedPlaylist.videoCount} videos loaded
                        </span>
                        {selectedPlaylist.viewCount && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span>{formatViewCount(selectedPlaylist.viewCount)}</span>
                          </>
                        )}
                      </div>
                      
                      {selectedPlaylist.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2 hidden sm:block">
                          {selectedPlaylist.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Playlist Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadPlaylistVideos(selectedPlaylist)}
                        disabled={playlistVideosLoading}
                        className="h-9 px-3"
                      >
                        {playlistVideosLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Refresh
                          </>
                        )}
                      </Button>
                      
                      {playlistVideos.length > 0 && (
                        <Button
                          size="sm"
                          onClick={() => {
                            if (playlistVideos.length > 0) {
                              handleVideoPlay(playlistVideos[0])
                            }
                          }}
                          className="h-9 px-3 bg-purple-600 hover:bg-purple-700"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Play All
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Playlist Videos */}
                {playlistVideosLoading ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                        <p className="text-lg font-medium text-purple-900 dark:text-purple-100">
                          Loading Playlist Videos...
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Fetching videos from "{selectedPlaylist.title}"
                        </p>
                      </div>
                    </div>
                    <VideoGridSkeleton count={8} />
                  </div>
                ) : playlistVideos.length > 0 ? (
                  <div className="space-y-6">
                    {/* Video Count Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          Playlist Videos ({playlistVideos.length})
                        </h3>
                        {selectedPlaylist.videoCount > playlistVideos.length && (
                          <Badge variant="outline" className="text-xs">
                            {selectedPlaylist.videoCount - playlistVideos.length} more available
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Sorted by playlist order
                      </div>
                    </div>
                    
                    {/* Videos Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {playlistVideos.map((video, index) => (
                        <div key={video.videoId || video.id} className="group">
                          {/* Video Number Badge */}
                          <div className="absolute top-2 left-2 z-10">
                            <Badge variant="secondary" className="bg-black/80 text-white text-xs px-2 py-1">
                              #{index + 1}
                            </Badge>
                          </div>
                          
                          {/* Video Card */}
                          <VideoCard 
                            video={video} 
                            showActions={true}
                          />
                        </div>
                      ))}
                    </div>
                    
                    {/* Load More Section */}
                    {selectedPlaylist.videoCount > playlistVideos.length && (
                      <div className="flex justify-center pt-4">
                        <Button
                          variant="outline"
                          onClick={() => loadPlaylistVideos(selectedPlaylist)}
                          disabled={playlistVideosLoading}
                          className="px-6"
                        >
                          {playlistVideosLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Load More Videos
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Empty State */
                  <div className="text-center py-12">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto">
                        <Music className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                        No Videos Found
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        This playlist appears to be empty or the videos could not be loaded. 
                        Try refreshing or check back later.
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          onClick={() => loadPlaylistVideos(selectedPlaylist)}
                          disabled={playlistVideosLoading}
                        >
                          {playlistVideosLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                          )}
                          Try Again
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setShowPlaylistVideos(false)
                            setSelectedPlaylist(null)
                            setPlaylistVideos([])
                          }}
                        >
                          Back to Search
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : searchResults ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold">
                      {searchResults.items.length > 0 
                        ? `Found ${searchResults.items.length} results` 
                        : 'No results found'
                      }
                    </h3>
                    {searchResults.items.length > 0 && (
                      <div className="flex items-center gap-4">
                        <div className="flex gap-2 text-sm text-muted-foreground">
                          <span>
                            {searchResults.items.filter(item => (item as any).type === 'video').length} videos
                          </span>
                          <span>•</span>
                          <span>
                            {searchResults.items.filter(item => (item as any).type === 'playlist').length} playlists
                          </span>
                        </div>
                        {hasMoreVideos && (
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
                    )}
                  </div>
                  {searchResults.items.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Showing results for "{currentSearchQuery}"
                    </div>
                  )}
                </div>
                
                {searchResults.items.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {searchResults.items.map((item) => {
                      if (item.type === 'playlist') {
                        return <PlaylistCard key={item.playlistId || item.id} playlist={item as Playlist} />
                      } else {
                        return <VideoCard key={(item as Video).videoId || item.id} video={item as Video} />
                      }
                    })}
                  </div>
                )}
                
                {hasMoreVideos && (
                  <div className="text-center py-6 col-span-full">
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
                <div id="load-more-trigger" className="h-1 col-span-full" />
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
            {/* YouTube URL Player Section */}
            <div className="bg-gradient-to-r from-blue-10 via-blue-5 to-transparent rounded-2xl p-4 sm:p-6 border border-blue-20">
              <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-4">
                Play YouTube Video by URL
              </h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste YouTube video URL (youtube.com, youtu.be, m.youtube.com, etc.)"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={playYouTubeUrl}
                    disabled={!youtubeUrl.trim() || loadingUrl}
                    className="px-4"
                  >
                    {loadingUrl ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Play
                  </Button>
                </div>
                {urlError && (
                  <p className="text-sm text-red-600">{urlError}</p>
                )}
                {urlSuccess && (
                  <p className="text-sm text-green-600">{urlSuccess}</p>
                )}
              </div>
            </div>

            {selectedVideo ? (
              <>
                {/* Video Note Component - Video Player */}
                <VideoNoteComponent 
                  videoId={selectedVideo.videoId || selectedVideo.id} 
                  videoTitle={selectedVideo.title}
                  channelName={getChannelName(selectedVideo)}
                  viewCount={selectedVideo.viewCount}
                  publishedAt={selectedVideo.publishedAt}
                  thumbnail={getThumbnailUrl(selectedVideo)}
                  isFavorited={favoriteVideoIds.has(selectedVideo.videoId || selectedVideo.id)}
                  favoritesEnabled={favoritesEnabled}
                  favoritesPaused={favoritesPaused}
                  onFavoriteToggle={() => toggleFavorite(selectedVideo)}
                  onPreviousVideo={handlePreviousVideo}
                  onNextVideo={handleNextVideo}
                  onNotesChange={loadNotes}
                />
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Video Selected</p>
                <p>Search and select a video or paste a YouTube URL to create video notes</p>
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
                  <VideoCard key={video.videoId || video.id} video={video} />
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
                      <div className="flex items-start gap-3 mb-3">
                        <img
                          src={getChannelThumbnailUrl(channel)}
                          alt={channel.name}
                          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium line-clamp-2 text-sm leading-tight mb-2">{channel.name}</h4>
                          <div className="space-y-1">
                            {channel.subscriberCount && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="w-3 h-3" />
                                <span>{formatViewCount(channel.subscriberCount)} subscribers</span>
                              </div>
                            )}
                            {channel.viewCount && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Eye className="w-3 h-3" />
                                <span>{formatViewCount(channel.viewCount)} total views</span>
                              </div>
                            )}
                            {channel.videoCount && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Play className="w-3 h-3" />
                                <span>{channel.videoCount.toLocaleString()} videos</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleFollowChannel(channel)}
                        className={`w-full transition-all duration-200 hover:scale-105 text-sm ${
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
                      <div className="flex items-start gap-3 mb-3">
                        <img
                          src={getChannelThumbnailUrl(channel)}
                          alt={channel.name}
                          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium line-clamp-2 text-sm leading-tight mb-2">{channel.name}</h4>
                          <div className="space-y-1">
                            {channel.subscriberCount && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="w-3 h-3" />
                                <span>{formatViewCount(channel.subscriberCount)} subscribers</span>
                              </div>
                            )}
                            {channel.viewCount && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Eye className="w-3 h-3" />
                                <span>{formatViewCount(channel.viewCount)} total views</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleFollowChannel(channel)}
                        variant="outline"
                        className="w-full text-sm"
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
                  <VideoCard key={video.videoId || video.id} video={video} />
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

      case 'notes':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-r from-green-10 via-green-5 to-transparent rounded-2xl p-4 sm:p-6 border border-green-20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent mb-2">
                    My Notes
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground">All your video notes in one place</p>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {allNotes.length}
                </div>
              </div>
            </div>

            {/* Search and Create Notes */}
            <div className="bg-card rounded-2xl p-3 sm:p-4 border">
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search notes by title, content, or channel..."
                    value={notesSearchQuery}
                    onChange={(e) => setNotesSearchQuery(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
                <Button
                  onClick={handleCreateNote}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Note</span>
                </Button>
              </div>
              
              {/* Multi-select controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={toggleMultiSelectMode}
                    variant={multiSelectMode ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                  >
                    {multiSelectMode ? (
                      <>
                        <X className="w-3 h-3 mr-1" />
                        Exit Multi-Select
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Multi-Select
                      </>
                    )}
                  </Button>
                  
                  {multiSelectMode && (
                    <>
                      <Button
                        onClick={selectAllNotes}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        {selectedNotes.size === filteredNotes.length ? (
                          <>
                            <X className="w-3 h-3 mr-1" />
                            Deselect All
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Select All
                          </>
                        )}
                      </Button>
                      
                      {selectedNotes.size > 0 && (
                        <Button
                          onClick={deleteSelectedNotes}
                          variant="destructive"
                          size="sm"
                          className="text-xs"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete ({selectedNotes.size})
                        </Button>
                      )}
                    </>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}
                  {multiSelectMode && selectedNotes.size > 0 && (
                    <span className="ml-2 text-primary">
                      ({selectedNotes.size} selected)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Notes List */}
            {notesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredNotes.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {filteredNotes.map((note) => (
                  <Card key={note.id} className={`p-3 sm:p-4 hover:shadow-md transition-shadow ${
                    multiSelectMode ? 'cursor-pointer' : ''
                  } ${
                    selectedNotes.has(note.id) ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    if (multiSelectMode) {
                      toggleNoteSelection(note.id)
                    }
                  }}>
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Multi-select checkbox */}
                      {multiSelectMode && (
                        <div className="flex-shrink-0 pt-1">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            selectedNotes.has(note.id)
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-muted-foreground bg-background'
                          }`}>
                            {selectedNotes.has(note.id) && (
                              <Check className="w-3 h-3" />
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Video Thumbnail */}
                      <div className="flex-shrink-0 w-20 h-14 sm:w-24 sm:h-16 bg-muted rounded-lg overflow-hidden"
                           onClick={(e) => {
                             e.stopPropagation()
                             if (!multiSelectMode) {
                               setSelectedVideo({
                                 id: note.videoId,
                                 videoId: note.videoId,
                                 title: note.title,
                                 channelName: note.channelName,
                                 thumbnail: note.thumbnail,
                               })
                               setActiveTab('player')
                             }
                           }}>
                        {note.thumbnail ? (
                          <img 
                            src={note.thumbnail} 
                            alt={note.title}
                            className="w-full h-full object-cover cursor-pointer"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center cursor-pointer">
                            <Play className="w-4 h-4 sm:w-6 sm:h-6 text-primary/60" />
                          </div>
                        )}
                      </div>

                      {/* Note Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 
                              className="font-semibold text-sm sm:text-base text-foreground mb-1 cursor-pointer hover:text-primary transition-colors line-clamp-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (!multiSelectMode) {
                                  setSelectedVideo({
                                    id: note.videoId,
                                    videoId: note.videoId,
                                    title: note.title,
                                    channelName: note.channelName,
                                    thumbnail: note.thumbnail,
                                  })
                                  setActiveTab('player')
                                }
                              }}
                            >
                              {note.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                              {note.channelName}
                            </p>
                            <p className="text-xs sm:text-sm text-foreground line-clamp-2 sm:line-clamp-3">
                              {note.note}
                            </p>
                            {note.isClip && (
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  Clip: {formatTime(note.startTime || 0)} - {formatTime(note.endTime || 0)}
                                </Badge>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            {!multiSelectMode && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditNote(note)
                                  }}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0 flex-shrink-0"
                                  title="Edit note"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteNote(note.id)
                                  }}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 flex-shrink-0"
                                  title="Delete note"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                  {notesSearchQuery ? 'No matching notes found' : 'No notes yet'}
                </h3>
                <p className="text-sm text-muted-foreground px-4">
                  {notesSearchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Start taking notes while watching videos to see them here'
                  }
                </p>
              </div>
            )}
          </div>
        )

      {/* Edit Note Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Note
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {editingNote && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Video Title</label>
                  <p className="text-sm text-muted-foreground">{editingNote.title}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Channel</label>
                  <p className="text-sm text-muted-foreground">{editingNote.channelName}</p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="note-content" className="text-sm font-medium">
                    Note Content
                  </label>
                  <textarea
                    id="note-content"
                    value={updatedNoteContent}
                    onChange={(e) => setUpdatedNoteContent(e.target.value)}
                    className="w-full min-h-[100px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter your note content here..."
                  />
                </div>
                
                {editingNote.isClip && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Clip Duration</label>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(editingNote.startTime || 0)} - {formatTime(editingNote.endTime || 0)}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false)
                setEditingNote(null)
                setUpdatedNoteContent('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNoteUpdate}
              disabled={!updatedNoteContent.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Note Dialog */}
      <Dialog open={createNoteDialogOpen} onOpenChange={setCreateNoteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Note
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="note-title" className="text-sm font-medium">
                Note Title *
              </label>
              <Input
                id="note-title"
                value={newNote.title}
                onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter note title..."
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="note-content" className="text-sm font-medium">
                Note Content *
              </label>
              <textarea
                id="note-content"
                value={newNote.content}
                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                className="w-full min-h-[120px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your note content here..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="video-title" className="text-sm font-medium">
                  Video Title (Optional)
                </label>
                <Input
                  id="video-title"
                  value={newNote.videoTitle}
                  onChange={(e) => setNewNote(prev => ({ ...prev, videoTitle: e.target.value }))}
                  placeholder="Related video title..."
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="channel-name" className="text-sm font-medium">
                  Channel Name (Optional)
                </label>
                <Input
                  id="channel-name"
                  value={newNote.channelName}
                  onChange={(e) => setNewNote(prev => ({ ...prev, channelName: e.target.value }))}
                  placeholder="Channel name..."
                  className="w-full"
                />
              </div>
            </div>
            
            {selectedVideo && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 Video info pre-filled from selected video: <strong>{selectedVideo?.title}</strong>
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateNoteDialogOpen(false)
                setNewNote({
                  title: '',
                  content: '',
                  videoId: '',
                  videoTitle: '',
                  channelName: '',
                  thumbnail: ''
                })
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNewNote}
              disabled={!newNote.title.trim() || !newNote.content.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      default:
        return null
    }
  }

  if (showSplashScreen) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return (
    <div className="h-full-screen bg-background flex flex-col overflow-hidden scale-container touch-manipulation">
      {/* Header - Always Visible */}
      <header className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2">
              {/* Back Button */}
              {canGoBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGoBack}
                  className="h-9 w-9 sm:h-10 sm:w-10 p-0 transition-all duration-200 hover:scale-105 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  title="Go back"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              )}
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-red-600 to-red-500 rounded-lg flex items-center justify-center">
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold">MyTube</h1>
              
              {/* Background Playback Indicator */}
              {backgroundVideo && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-800">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300 truncate max-w-32">
                    {backgroundVideo.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isBackgroundPlaying ? pauseBackgroundVideo : stopBackgroundVideo}
                    className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                    title={isBackgroundPlaying ? "Pause background video" : "Stop background video"}
                  >
                    {isBackgroundPlaying ? <Pause className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="md:hidden h-9 w-9 p-0 transition-all duration-200 hover:scale-105 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                title="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 transition-transform duration-200" />
                ) : (
                  <Menu className="w-5 h-5 transition-transform duration-200" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className={`h-9 w-9 sm:h-10 sm:w-10 p-0 relative transition-all duration-200 hover:scale-105 ${
                  showNotifications 
                    ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                    : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-background animate-bounce">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </Button>
              
              <ThemeSwitch />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="h-9 w-9 sm:h-10 sm:w-10 p-0 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={toggleMobileMenu}>
          <div 
            className="absolute top-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4">
              <nav className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="navigation" aria-label="Main navigation">
                {tabs.map((tab, index) => {
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabNavigationWithMobileMenu(tab.id)}
                      className={`group relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 ease-out ${
                        isActive 
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:scale-105'
                      }`}
                      style={{
                        transitionDelay: `${index * 50}ms`
                      }}
                      aria-label={`Navigate to ${tab.label}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <div className={`relative transition-all duration-300 ${
                        isActive ? 'scale-110' : 'scale-100 group-hover:scale-110'
                      }`}>
                        <tab.icon className={`w-5 h-5 transition-all duration-300 ${
                          isActive ? 'drop-shadow-md' : ''
                        }`} />
                        
                        {isActive && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-background rounded-full animate-pulse" />
                        )}
                      </div>
                      
                      <span className={`text-xs font-medium transition-all duration-300 leading-tight ${
                        isActive 
                          ? 'text-primary-foreground font-semibold' 
                          : 'text-muted-foreground group-hover:text-foreground'
                      }`}>
                        {tab.label}
                      </span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Notification Area - Below Header */}
      <div className={`bg-background/95 backdrop-blur-lg border-b border-border/50 transition-all duration-300 ease-in-out ${
        showNotifications ? 'max-h-96 opacity-100 shadow-sm' : 'max-h-0 opacity-0 overflow-hidden'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4">
          {/* Notification Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-2 h-2 bg-primary rounded-full animate-ping"></div>
              </div>
              <h2 className="text-base font-semibold text-foreground">Notifications</h2>
              {notifications.length > 0 && (
                <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full min-w-[20px] text-center">
                  {notifications.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllNotifications}
                  className="h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  Clear All
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                {showNotifications ? (
                  <ArrowDown className="w-4 h-4 rotate-180 transition-transform duration-200" />
                ) : (
                  <ArrowDown className="w-4 h-4 transition-transform duration-200" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Notification Content */}
          <div className="space-y-3 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border/50">
                  <Check className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-base font-medium text-foreground mb-1">All caught up!</h3>
                <p className="text-sm text-muted-foreground">No new notifications to show</p>
              </div>
            ) : (
              notifications.map((notification, index) => {
                const swipeState = swipeStates.get(notification.id) || { translateX: 0, isSwiping: false }
                const isSwipedLeft = swipeState.translateX < -50
                const isSwipedRight = swipeState.translateX > 50
                
                return (
                  <div
                    key={notification.id}
                    className={`group relative rounded-xl border-0 shadow-sm transition-all duration-300 animate-in slide-in-from-top-2 fade-in-0 ${
                      notification.variant === 'success'
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200/50 dark:border-green-800/30'
                        : notification.variant === 'destructive'
                        ? 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200/50 dark:border-red-800/30'
                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-800/30'
                    } hover:shadow-md hover:scale-[1.02]`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animationFillMode: 'both',
                      transform: `translateX(${swipeState.translateX}px)`,
                      opacity: Math.abs(swipeState.translateX) > 100 ? 0.5 : 1,
                      transition: swipeState.isSwiping ? 'none' : 'all 0.3s ease'
                    }}
                    onTouchStart={(e) => handleTouchStart(e, notification.id)}
                    onTouchMove={(e) => handleTouchMove(e, notification.id)}
                    onTouchEnd={(e) => handleTouchEnd(e, notification.id)}
                  >
                    {/* Swipe indicator overlay */}
                    {isSwipedLeft && (
                      <div className="absolute inset-y-0 left-0 w-12 bg-red-500/10 flex items-center justify-center rounded-l-xl">
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </div>
                    )}
                    {isSwipedRight && (
                      <div className="absolute inset-y-0 right-0 w-12 bg-green-500/10 flex items-center justify-center rounded-r-xl">
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                    
                    {/* Notification Card */}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* Icon Container */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          notification.variant === 'success'
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                            : notification.variant === 'destructive'
                            ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                            : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                        }`}>
                          {notification.variant === 'success' && (
                            <Check className="w-5 h-5" />
                          )}
                          {notification.variant === 'destructive' && (
                            <Trash2 className="w-5 h-5" />
                          )}
                          {notification.variant === 'info' && (
                            <Play className="w-5 h-5" />
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className={`text-sm font-semibold leading-tight ${
                              notification.variant === 'success'
                                ? 'text-green-800 dark:text-green-200'
                                : notification.variant === 'destructive'
                                ? 'text-red-800 dark:text-red-200'
                                : 'text-blue-800 dark:text-blue-200'
                            }`}>
                              {notification.title}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeNotification(notification.id)}
                              className="h-6 w-6 p-0 text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 rounded-md transition-all duration-200 flex-shrink-0"
                            >
                              <span className="text-lg leading-none">×</span>
                            </Button>
                          </div>
                          
                          {notification.description && (
                            <p className={`text-sm leading-relaxed mb-2 ${
                              notification.variant === 'success'
                                ? 'text-green-700 dark:text-green-300'
                                : notification.variant === 'destructive'
                                ? 'text-red-700 dark:text-red-300'
                                : 'text-blue-700 dark:text-blue-300'
                            }`}>
                              {notification.description}
                            </p>
                          )}
                          
                          {/* Timestamp */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {notification.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </span>
                            <span className="text-xs text-muted-foreground/50">•</span>
                            <span className="text-xs text-muted-foreground">
                              {getRelativeTime(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Bar for Auto-hide */}
                    {notification.autoHide && (
                      <div className="absolute bottom-0 left-0 h-0.5 bg-current opacity-20 animate-pulse"
                        style={{
                          animation: 'shrink 5s linear forwards',
                          animationDelay: `${index * 50}ms`
                        }}
                      />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Desktop Tabs Bar - Visible on desktop only */}
      <div className="hidden md:block bg-background/95 backdrop-blur-xl border-b border-border/50 sticky top-16 z-30 shadow-lg shadow-black/5 dark:shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 md:gap-2 py-4" role="navigation" aria-label="Main navigation">
            {tabs.map((tab, index) => {
              const isActive = activeTab === tab.id
              return (
                <div key={tab.id} className="relative">
                  <button
                    onClick={() => handleTabNavigation(tab.id)}
                    className={`group relative flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-3 rounded-xl text-xs md:text-sm font-medium transition-all duration-300 ease-out ${
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/30 dark:shadow-primary/40 scale-105 ring-2 ring-primary/20 ring-offset-2 ring-offset-background' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:scale-105 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/30'
                    }`}
                    style={{
                      transitionDelay: `${index * 50}ms`
                    }}
                    aria-label={`Navigate to ${tab.label}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {/* Icon with Animation */}
                    <div className={`relative transition-all duration-300 ${
                      isActive ? 'scale-110 rotate-6' : 'scale-100 group-hover:scale-110 group-hover:rotate-3'
                    }`}>
                      <tab.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-all duration-300 ${
                        isActive ? 'drop-shadow-lg drop-shadow-primary/30' : ''
                      }`} />
                      
                      {/* Active Indicator */}
                      {isActive && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-background rounded-full animate-pulse border-2 border-primary shadow-sm shadow-primary/30" />
                      )}
                    </div>
                    
                    {/* Label - Hidden on smaller screens */}
                    <span className="hidden sm:block font-medium">{tab.label}</span>
                    
                    {/* Hover Background Effect - REMOVED */}
                    {/* <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r from-primary/0 to-primary/10' 
                        : 'bg-gradient-to-r from-transparent to-transparent group-hover:from-muted/20 group-hover:to-muted/10'
                    }`} /> */}
                    
                    {/* Shimmer Effect for Active Tab */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" />
                      </div>
                    )}
                  </button>
                  
                  {/* Active Tab Underline */}
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full animate-pulse shadow-sm shadow-primary/30" />
                  )}
                </div>
              )
            })}
            
            {/* Spacer for alignment */}
            <div className="flex-1" />
            
            {/* Navigation Stats/Info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span>Active</span>
              </div>
              <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg">
                <span>{tabs.length} tabs</span>
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Tablet Navigation - Medium screens */}
      <div className="hidden sm:block md:hidden bg-background/95 backdrop-blur-xl border-b border-border/50 sticky top-16 z-30 shadow-md shadow-black/3 dark:shadow-black/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center justify-between py-3" role="navigation" aria-label="Main navigation">
            {tabs.map((tab, index) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabNavigation(tab.id)}
                  className={`group relative flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all duration-300 ease-out ${
                    isActive 
                      ? 'text-primary scale-105 shadow-md shadow-primary/20 dark:shadow-primary/30' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:scale-105 hover:shadow-sm hover:shadow-black/5 dark:hover:shadow-black/20'
                  }`}
                  style={{
                    transitionDelay: `${index * 30}ms`
                  }}
                  aria-label={`Navigate to ${tab.label}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className={`relative transition-all duration-300 ${
                    isActive ? 'scale-110' : 'scale-100 group-hover:scale-110'
                  }`}>
                    <tab.icon className={`w-4 h-4 transition-all duration-300 ${
                      isActive ? 'drop-shadow-sm drop-shadow-primary/20' : ''
                    }`} />
                    
                    {isActive && (
                      <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-sm shadow-primary/40" />
                    )}
                  </div>
                  
                  <span className={`text-[10px] font-medium leading-tight transition-all duration-300 ${
                    isActive 
                      ? 'text-primary font-semibold' 
                      : 'text-muted-foreground group-hover:text-foreground'
                  }`}>
                    {tab.label}
                  </span>
                  
                  {/* Hover Background Effect - REMOVED */}
                  {/* <div className="absolute inset-0 bg-primary/5 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 ease-out" /> */}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Always visible on mobile */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 z-40 shadow-2xl shadow-black/10 dark:shadow-black/40 transition-transform duration-300 ease-out ${
        mobileMenuOpen ? 'translate-y-full' : 'translate-y-0'
      }`}>
        <div className="relative">
          {/* Active Tab Indicator - REMOVED */}
          {/* <div 
            className="absolute top-2 h-10 bg-primary/10 rounded-full transition-all duration-300 ease-out shadow-sm shadow-primary/20"
            style={{
              width: `${100 / tabs.length}%`,
              left: `${(tabs.findIndex(tab => tab.id === activeTab) * 100) / tabs.length}%`,
            }}
          /> */}
          
          <nav className="flex items-center justify-around py-2 overflow-x-auto" role="navigation" aria-label="Main navigation">
            {tabs.map((tab, index) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabNavigation(tab.id)}
                  className={`group relative flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all duration-300 ease-out flex-shrink-0 min-w-0 ${
                    isActive 
                      ? 'text-primary scale-105 shadow-lg shadow-primary/25 dark:shadow-primary/35' 
                      : 'text-muted-foreground hover:text-foreground hover:scale-105 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/25'
                  }`}
                  style={{
                    transitionDelay: `${index * 25}ms`
                  }}
                  aria-label={`Navigate to ${tab.label}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Icon Container */}
                  <div className={`relative transition-all duration-300 ${
                    isActive ? 'scale-110' : 'scale-100 group-hover:scale-110'
                  }`}>
                    <tab.icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${
                      isActive ? 'drop-shadow-md drop-shadow-primary/25' : ''
                    }`} />
                    
                    {/* Active Indicator Dot */}
                    {isActive && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse shadow-sm shadow-primary/40" />
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={`text-[10px] sm:text-[11px] font-medium transition-all duration-300 leading-tight truncate ${
                    isActive 
                      ? 'text-primary font-semibold' 
                      : 'text-muted-foreground group-hover:text-foreground'
                  }`}>
                    {tab.label}
                  </span>
                  
                  {/* Hover Ripple Effect - REMOVED */}
                  {/* <div className="absolute inset-0 bg-primary/5 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 ease-out" /> */}
                </button>
              )
            })}
          </nav>
          
          {/* Safe Area Notch */}
          <div className="h-1 bg-gradient-to-t from-background/50 to-transparent" />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scroll-smooth touch-pan-y max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 pb-24 md:pb-6">
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

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings & Privacy
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Auto Load More Setting */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Auto Load More</label>
                  <p className="text-xs text-muted-foreground">
                    Automatically load more videos when scrolling
                  </p>
                </div>
                <Switch
                  checked={autoLoadMore}
                  onCheckedChange={setAutoLoadMore}
                  disabled={loading}
                />
              </div>

              {/* Favorites Module Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Favorites Module</h3>
                
                {/* Enable/Disable Favorites */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Enable Favorites</label>
                    <p className="text-xs text-muted-foreground">
                      Turn the favorites module on or off
                    </p>
                  </div>
                  <Switch
                    checked={favoritesEnabled}
                    onCheckedChange={(checked) => {
                      setFavoritesEnabled(checked)
                      localStorage.setItem('mytube-favorites-enabled', checked.toString())
                      if (!checked && activeTab === 'favorites') {
                        setActiveTab('home')
                      }
                    }}
                    disabled={loading}
                  />
                </div>

                {/* Pause/Resume Favorites */}
                {favoritesEnabled && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Pause Favorites</label>
                      <p className="text-xs text-muted-foreground">
                        Temporarily pause adding/removing favorites
                      </p>
                    </div>
                    <Switch
                      checked={favoritesPaused}
                      onCheckedChange={(checked) => {
                        setFavoritesPaused(checked)
                        localStorage.setItem('mytube-favorites-paused', checked.toString())
                        addNotification(
                          'Favorites ' + (checked ? 'Paused' : 'Resumed'), 
                          checked ? 'Cannot add/remove favorites while paused' : 'Favorites functionality resumed',
                          'info'
                        )
                      }}
                      disabled={loading}
                    />
                  </div>
                )}
              </div>

              {/* Data Statistics */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Data Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Watched Videos</span>
                    <span className="font-mono">{watchedVideos.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Favorite Channels</span>
                    <span className="font-mono">{favoriteChannels.length}</span>
                  </div>
                  {favoritesEnabled && (
                    <div className="flex justify-between text-xs">
                      <span>Favorite Videos</span>
                      <span className="font-mono">{favoriteVideos.length}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-medium pt-2 border-t">
                    <span>Total Items</span>
                    <span className="font-mono">
                      {watchedVideos.length + favoriteChannels.length + (favoritesEnabled ? favoriteVideos.length : 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Privacy Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Privacy</h3>
                
                <Alert>
                  <AlertDescription className="text-xs">
                    This will permanently delete all your data including watched videos, 
                    favorite channels, favorite videos, and all local settings.
                  </AlertDescription>
                </Alert>

                <Button
                  variant="destructive"
                  onClick={clearAllData}
                  disabled={loading || (
                    watchedVideos.length === 0 && 
                    favoriteChannels.length === 0 && 
                    (favoritesEnabled ? favoriteVideos.length : 0) === 0
                  )}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Clearing Data...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All Data
                    </>
                  )}
                </Button>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSettings(false)}
              disabled={loading}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Data Confirmation Dialog */}
      <Dialog open={showClearDataConfirmation} onOpenChange={setShowClearDataConfirmation}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Confirm Clear All Data
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                <strong>⚠️ Warning: This action cannot be undone!</strong>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This will permanently delete the following data:
              </p>
              
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-destructive rounded-full"></div>
                  <span>{watchedVideos.length} watched videos</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-destructive rounded-full"></div>
                  <span>{favoriteChannels.length} favorite channels</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-destructive rounded-full"></div>
                  <span>{favoriteVideos.length} favorite videos</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-destructive rounded-full"></div>
                  <span>All local settings and preferences</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-destructive rounded-full"></div>
                  <span>Search cache and navigation history</span>
                </li>
              </ul>
              
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>Total items to be deleted:</strong> {watchedVideos.length + favoriteChannels.length + (favoritesEnabled ? favoriteVideos.length : 0)} database records + all local data
                </p>
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground">
                Are you sure you want to continue? This action is irreversible.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowClearDataConfirmation(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmClearAllData}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Data
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}