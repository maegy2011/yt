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
  ChevronLeft
} from 'lucide-react'
import { searchVideos, formatViewCount, formatPublishedAt, formatDuration } from '@/lib/youtube'
import { validateSearchQuery, validateYouTubeUrl } from '@/lib/validation'
import { getLoadingMessage, getConfirmationMessage, confirmationMessages } from '@/lib/loading-messages'
import type { Video, Channel } from '@/lib/youtube'
import { VideoCardSkeleton, VideoGridSkeleton } from '@/components/video-skeleton'
import { SplashScreen } from '@/components/splash-screen'
import { VideoNote } from '@/components/video-note'

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
  // Core state
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [previousTab, setPreviousTab] = useState<Tab>('home')
  const [navigationHistory, setNavigationHistory] = useState<Tab[]>(['home'])
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
  const [showClearDataConfirmation, setShowClearDataConfirmation] = useState(false)
  
  // YouTube URL player state
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [loadingUrl, setLoadingUrl] = useState(false)
  const [urlError, setUrlError] = useState('')
  const [urlSuccess, setUrlSuccess] = useState('')
  const [clipboardHasYouTubeUrl, setClipboardHasYouTubeUrl] = useState(false)
  const [clipboardChecking, setClipboardChecking] = useState(false)
  
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
  const showDynamicConfirmation = useCallback((operation: keyof typeof confirmationMessages, ...args: any[]) => {
    const message = getConfirmationMessage(operation, ...args)
    addNotification('Success!', message, 'success')
    setDynamicLoadingMessage('')
  }, [addNotification])

  // Handle splash screen completion
  const handleSplashComplete = useCallback(() => {
    setShowSplashScreen(false)
    addNotification('Welcome!', 'MyTube is ready to use', 'success')
  }, [addNotification])

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
        addNotification('Failed to load initial data', 'Please refresh the page', 'destructive')
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

  // Tab definitions
  const tabs = useMemo(() => [
    { id: 'home' as Tab, icon: Home, label: 'Home' },
    { id: 'search' as Tab, icon: Search, label: 'Search' },
    { id: 'player' as Tab, icon: Play, label: 'Player' },
    { id: 'watched' as Tab, icon: Clock, label: 'Watched' },
    { id: 'channels' as Tab, icon: User, label: 'Channels' },
    { id: 'favorites' as Tab, icon: Heart, label: 'Favorites' },
  ], [])

  // Enhanced tab navigation with haptic feedback
  const handleTabNavigation = useCallback((tabId: Tab) => {
    setPreviousTab(activeTab)
    setActiveTab(tabId)
    triggerHapticFeedback()
    
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
  }, [activeTab, tabs, addNotification, triggerHapticFeedback])

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
        const tabs: Tab[] = ['home', 'search', 'player', 'watched', 'channels', 'favorites']
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

      const tabs: Tab[] = ['home', 'search', 'player', 'watched', 'channels', 'favorites']
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
      setChannelVideos([])
    } finally {
      setChannelVideosLoading(false)
    }
  }

  // YouTube URL player functions
  const checkClipboardAndPaste = useCallback(async () => {
    setClipboardChecking(true)
    try {
      const { checkClipboardForYouTubeVideo, getVideoIdFromClipboard } = await import('@/lib/youtube-utils')
      const hasYouTubeUrl = await checkClipboardForYouTubeVideo()
      
      if (hasYouTubeUrl) {
        const videoId = await getVideoIdFromClipboard()
        if (videoId) {
          // Try to get the full clipboard text for the URL
          const clipboardText = await navigator.clipboard.readText()
          setYoutubeUrl(clipboardText)
          setUrlError('')
          addNotification('Clipboard Pasted', 'YouTube URL pasted from clipboard', 'success')
        }
      }
    } catch (error) {
      console.error('Error checking clipboard:', error)
      addNotification('Clipboard Error', 'Failed to access clipboard', 'destructive')
    } finally {
      setClipboardChecking(false)
    }
  }, [addNotification])

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
          title: data.title || 'Unknown Video',
          channel: {
            name: data.channelName || 'Unknown Channel',
            id: data.channelId || 'unknown'
          },
          thumbnail: {
            url: data.thumbnail || `https://img.youtube.com/vi/${data.videoId}/mqdefault.jpg`,
            width: 320,
            height: 180
          },
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

  // Check clipboard for YouTube URL on component mount and when switching to player tab
  useEffect(() => {
    if (activeTab === 'player' && navigator.clipboard) {
      const checkClipboard = async () => {
        try {
          const { checkClipboardForYouTubeVideo } = await import('@/lib/youtube-utils')
          const hasYouTubeUrl = await checkClipboardForYouTubeVideo()
          setClipboardHasYouTubeUrl(hasYouTubeUrl)
        } catch (error) {
          // Silently fail clipboard checking
          setClipboardHasYouTubeUrl(false)
        }
      }
      
      checkClipboard()
      
      // Set up interval to check clipboard when user focuses back to the window
      const handleFocus = () => {
        checkClipboard()
      }
      
      window.addEventListener('focus', handleFocus)
      return () => window.removeEventListener('focus', handleFocus)
    }
  }, [activeTab])

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
      const cachedResults = getCachedResults(validatedQuery)
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
        addNotification('Search Error', data.error, 'destructive')
        if (!append) setSearchResults(null)
        return
      }
      
      if (!data.items || data.items.length === 0) {
        if (!append) {
          addNotification('No Results', `No videos found for "${queryToUse}"`, 'info')
          setSearchResults({ items: [] })
          setCachedResults(queryToUse, [], null, false)
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
      
      let finalItems: Video[]
      if (append && searchResults?.items) {
        const existingVideoIds = new Set(searchResults.items.map(v => v.id))
        const newVideos = data.items.filter((video: Video) => !existingVideoIds.has(video.id))
        
        if (newVideos.length > 0) {
          finalItems = [...searchResults.items, ...newVideos]
        } else {
          finalItems = searchResults.items
          addNotification('No New Videos', 'All videos already loaded', 'info')
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
      addNotification('Search Failed', 'An error occurred while searching. Please try again.', 'destructive')
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
    setPreviousTab(activeTab) // Track the previous tab
    setSelectedVideo(video)
    setActiveTab('player')
    
    // Update navigation history for player
    setNavigationHistory(prev => [...prev, 'player'])
    
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

  const handleNextVideo = useCallback(() => {
    if (!selectedVideo) return

    // Get all available video lists
    const allVideos: Video[] = []
    
    // Add search results if available
    if (searchResults?.items) {
      allVideos.push(...searchResults.items)
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
      allVideos.push(...searchResults.items)
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
          addNotification('Error', 'Failed to remove from favorites', 'destructive')
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
    const isFavorite = favoriteVideoIds.has(video.id)
    const isSelected = selectedItems.has(video.id)
    const thumbnailUrl = getThumbnailUrl(video)
    const channelName = getChannelName(video)
    const channelLogo = getChannelLogo(video)
    
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
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  {channelLogo && (
                    <img 
                      src={channelLogo} 
                      alt={channelName}
                      className="w-4 h-4 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <span className="truncate">{channelName}</span>
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
  }, [favoriteVideoIds, selectedItems, multiSelectMode, getThumbnailUrl, getChannelName, getChannelLogo, toggleItemSelection, toggleFavorite])

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
                    onClick={checkClipboardAndPaste}
                    disabled={!clipboardHasYouTubeUrl || clipboardChecking}
                    variant="outline"
                    className="px-3"
                    title={clipboardHasYouTubeUrl ? "Paste from clipboard" : "No YouTube URL in clipboard"}
                  >
                    {clipboardChecking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )}
                  </Button>
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
                <VideoNote 
                  videoId={selectedVideo.id} 
                  videoTitle={selectedVideo.title}
                  channelName={getChannelName(selectedVideo)}
                  viewCount={selectedVideo.viewCount}
                  publishedAt={selectedVideo.publishedAt}
                  thumbnail={getThumbnailUrl(selectedVideo)}
                  onPreviousVideo={handlePreviousVideo}
                  onNextVideo={handleNextVideo}
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
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
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
      <div className="hidden lg:block bg-background/95 backdrop-blur-xl border-b border-border/50 sticky top-16 z-30 shadow-lg shadow-black/5 dark:shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 py-4" role="navigation" aria-label="Main navigation">
            {tabs.map((tab, index) => {
              const isActive = activeTab === tab.id
              return (
                <div key={tab.id} className="relative">
                  <button
                    onClick={() => handleTabNavigation(tab.id)}
                    className={`group relative flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 ease-out ${
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
                      <tab.icon className={`w-4 h-4 transition-all duration-300 ${
                        isActive ? 'drop-shadow-lg drop-shadow-primary/30' : ''
                      }`} />
                      
                      {/* Active Indicator */}
                      {isActive && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-background rounded-full animate-pulse border-2 border-primary shadow-sm shadow-primary/30" />
                      )}
                    </div>
                    
                    {/* Label */}
                    <span className="font-medium">{tab.label}</span>
                    
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
      <div className="hidden md:block lg:hidden bg-background/95 backdrop-blur-xl border-b border-border/50 sticky top-16 z-30 shadow-md shadow-black/3 dark:shadow-black/15">
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 z-40 shadow-2xl shadow-black/10 dark:shadow-black/40">
        <div className="relative">
          {/* Active Tab Indicator - REMOVED */}
          {/* <div 
            className="absolute top-2 h-10 bg-primary/10 rounded-full transition-all duration-300 ease-out shadow-sm shadow-primary/20"
            style={{
              width: `${100 / tabs.length}%`,
              left: `${(tabs.findIndex(tab => tab.id === activeTab) * 100) / tabs.length}%`,
            }}
          /> */}
          
          <nav className="flex items-center justify-around py-2" role="navigation" aria-label="Main navigation">
            {tabs.map((tab, index) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabNavigation(tab.id)}
                  className={`group relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 ease-out ${
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
                    <tab.icon className={`w-5 h-5 transition-all duration-300 ${
                      isActive ? 'drop-shadow-md drop-shadow-primary/25' : ''
                    }`} />
                    
                    {/* Active Indicator Dot */}
                    {isActive && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse shadow-sm shadow-primary/40" />
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={`text-[11px] font-medium transition-all duration-300 leading-tight ${
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
                  <div className="flex justify-between text-xs">
                    <span>Favorite Videos</span>
                    <span className="font-mono">{favoriteVideos.length}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium pt-2 border-t">
                    <span>Total Items</span>
                    <span className="font-mono">
                      {watchedVideos.length + favoriteChannels.length + favoriteVideos.length}
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
                    favoriteVideos.length === 0
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
                  <strong>Total items to be deleted:</strong> {watchedVideos.length + favoriteChannels.length + favoriteVideos.length} database records + all local data
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