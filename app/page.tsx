'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Home, 
  Search, 
  Play, 
  Pause,
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
  ExternalLink,
  Clock,
  History,
  MoreVertical,
  BookOpen
} from 'lucide-react'
import { searchVideos, formatViewCount, formatPublishedAt, formatDuration } from '@/lib/youtube'
import { validateSearchQuery } from '@/lib/validation'
import { getLoadingMessage, getConfirmationMessage, confirmationMessages } from '@/lib/loading-messages'
import type { Video as YouTubeVideo } from '@/lib/youtube'
import { convertYouTubeVideo, convertYouTubePlaylist, convertYouTubeChannel, convertToYouTubeVideo, convertDbVideoToSimple, type SimpleVideo, type SimplePlaylist, type SimpleChannel, type FavoriteVideo, type FavoriteChannel, type VideoNote, type ChannelSearchResult, type PaginationInfo, type FollowedChannelsContent } from '@/lib/type-compatibility'
import type { WatchedVideo } from '@/types/watched'
// Blacklist and Whitelist types
interface BlacklistedItem {
  id: string
  title: string
  type: 'video' | 'playlist' | 'channel'
  thumbnail?: string
  channelName?: string
  addedAt: string
}

interface WhitelistedItem {
  id: string
  title: string
  type: 'video' | 'playlist' | 'channel'
  thumbnail?: string
  channelName?: string
  addedAt: string
}
// Unified VideoCard component with enhanced design
import { VideoCard as UnifiedVideoCard, toVideoCardData, PlaylistCard, ChannelCard } from '@/components/video'
import { VideoCardSkeleton, VideoGridSkeleton } from '@/components/video-skeleton'
import { SplashScreen } from '@/components/splash-screen'
import { VideoNote as VideoNoteComponent } from '@/components/video-note'
import { NotesContainer } from '@/components/notes/NotesContainer'
import { NotebooksContainer } from '@/components/notebooks/NotebooksContainer'
import { NotebookView } from '@/components/notebooks/NotebookView'
import { ShareNotebookDialog } from '@/components/notebooks/ShareNotebookDialog'
import { FavoritesContainer } from '@/components/favorites/FavoritesContainer'
import { WatchedHistoryContainer } from '@/components/watched/WatchedHistoryContainer'
import { EnhancedClearData } from '@/components/enhanced-clear-data'
import { SettingsContainerEnhanced } from '@/components/settings/SettingsContainerEnhanced'
import { useWatchedHistory } from '@/hooks/useWatchedHistory'
import { BottomNavigation } from '@/components/navigation/BottomNavigation'
import { NavigationSpacer } from '@/components/navigation/NavigationSpacer'
import { useBackgroundPlayer } from '@/contexts/background-player-context'
import { useIncognito } from '@/contexts/incognito-context'
import { ThemeSwitch } from '@/components/theme-switch'
import { IncognitoBannerEnhanced } from '@/components/incognito-banner-enhanced'
import { IncognitoToggleEnhanced } from '@/components/incognito-toggle-enhanced'
import { QuickSettings } from '@/components/settings/QuickSettings'
import { ChannelsContainer } from '@/components/channels/ChannelsContainer'
import { useChannelAvatar } from '@/hooks/useChannelAvatar'
import { SearchResultsFilter } from '@/components/search/SearchResultsFilterEnhanced'
import { useToast } from '@/hooks/use-toast'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog'


// Enhanced types with better safety
type Tab = 'home' | 'search' | 'player' | 'channels' | 'favorites' | 'notes' | 'notebooks' | 'watched' | 'settings'

// Use SimpleVideo for internal state
type Video = SimpleVideo
type Playlist = SimplePlaylist
type Channel = SimpleChannel
type SearchResultItem = Video | Playlist | Channel

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
    settingsTitle
  } = useBackgroundPlayer()

  // Incognito mode context
  const { isIncognito } = useIncognito()

  // Watch history hook
  const { addToWatchedHistory, isVideoWatched } = useWatchedHistory()

  // Channel avatar hook
  const { getChannelAvatarUrl } = useChannelAvatar()

  // Toast hook
  const { toast } = useToast()

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
  const [showSplashScreen, setShowSplashScreen] = useState(true) // Re-enabled for debugging
  const [dynamicLoadingMessage, setDynamicLoadingMessage] = useState('')
  const [searchInputTimeout, setSearchInputTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isIntersectionLoading, setIsIntersectionLoading] = useState(false)
  const [hasTriggeredLoad, setHasTriggeredLoad] = useState(false)
  const [autoLoadMore, setAutoLoadMore] = useState(true) // Default to enabled
  const [searchCountdown, setSearchCountdown] = useState<number | null>(null)
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false) // Track follow operations
  
  // Blacklist and Whitelist states
  const [blacklisted, setBlacklisted] = useState<BlacklistedItem[]>([])
  const [whitelisted, setWhitelisted] = useState<WhitelistedItem[]>([])
  
  // Confirmation dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    type: 'blacklist' | 'whitelist'
    item: any
    itemType: string
    itemTitle: string
  }>({
    isOpen: false,
    type: 'blacklist',
    item: null,
    itemType: '',
    itemTitle: ''
  })
  
  // Database API functions
const fetchBlacklistedItems = async (): Promise<BlacklistedItem[]> => {
  try {
    const response = await fetch('/api/blacklist')
    if (!response.ok) throw new Error('Failed to fetch blacklist')
    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error('Error fetching blacklist:', error)
    return []
  }
}

const fetchWhitelistedItems = async (): Promise<WhitelistedItem[]> => {
  try {
    const response = await fetch('/api/whitelist')
    if (!response.ok) throw new Error('Failed to fetch whitelist')
    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error('Error fetching whitelist:', error)
    return []
  }
}

const addToBlacklist = async (item: any): Promise<boolean> => {
  try {
    const itemType = 'videoId' in item ? 'video' : 'playlistId' in item ? 'playlist' : 'channelId' in item ? 'channel' : 'unknown'
    if (itemType === 'unknown') return false
    
    const itemId = 'videoId' in item ? item.videoId : 'playlistId' in item ? item.playlistId : item.channelId
    const title = item.title || item.channelName || 'Unknown'
    
    const response = await fetch('/api/blacklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId,
        title,
        type: itemType,
        thumbnail: item.thumbnail,
        channelName: item.channelName
      })
    })
    return response.ok
  } catch (error) {
    console.error('Error adding to blacklist:', error)
    return false
  }
}

const addToWhitelist = async (item: any): Promise<boolean> => {
  try {
    const itemType = 'videoId' in item ? 'video' : 'playlistId' in item ? 'playlist' : 'channelId' in item ? 'channel' : 'unknown'
    if (itemType === 'unknown') return false
    
    const itemId = 'videoId' in item ? item.videoId : 'playlistId' in item ? item.playlistId : item.channelId
    const title = item.title || item.channelName || 'Unknown'
    
    const response = await fetch('/api/whitelist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId,
        title,
        type: itemType,
        thumbnail: item.thumbnail,
        channelName: item.channelName
      })
    })
    return response.ok
  } catch (error) {
    console.error('Error adding to whitelist:', error)
    return false
  }
}

// Load blacklist and whitelist from database on mount
  useEffect(() => {
    const loadItems = async () => {
      try {
        const [blacklistedData, whitelistedData] = await Promise.all([
          fetchBlacklistedItems(),
          fetchWhitelistedItems()
        ])
        setBlacklisted(blacklistedData)
        setWhitelisted(whitelistedData)
        handleBlacklistChange(blacklistedData)
        handleWhitelistChange(whitelistedData)
      } catch (error) {
        console.error('Error loading blacklist/whitelist from database:', error)
      }
    }
    
    loadItems()
  }, [])
  
  // Data states

  // Global timeout to force splash screen to hide after maximum time
  useEffect(() => {
    const globalTimeout = setTimeout(() => {
      if (showSplashScreen) {
        console.log('App: Global timeout - forcing splash screen to hide')
        setShowSplashScreen(false)
      }
    }, 20000) // 20 seconds maximum

    return () => clearTimeout(globalTimeout)
  }, [showSplashScreen])

  const [favoriteChannels, setFavoriteChannels] = useState<FavoriteChannel[]>([])
  const [favoriteVideos, setFavoriteVideos] = useState<FavoriteVideo[]>([])
  const [allNotes, setAllNotes] = useState<VideoNote[]>([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [notesSearchQuery, setNotesSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<VideoNote | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [updatedNoteContent, setUpdatedNoteContent] = useState('')
  const [updatedNoteTitle, setUpdatedNoteTitle] = useState('')
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
  
  // Notebook view states
  const [selectedNotebook, setSelectedNotebook] = useState<any>(null)
  const [notebookNotes, setNotebookNotes] = useState<VideoNote[]>([])
  const [notebookNotesLoading, setNotebookNotesLoading] = useState(false)
  const [showNotebookView, setShowNotebookView] = useState(false)
  const [shareNotebookDialogOpen, setShareNotebookDialogOpen] = useState(false)
  const [notesForNotebook, setNotesForNotebook] = useState<VideoNote[]>([])
  
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
  const [channelSearchTimeout, setChannelSearchTimeout] = useState<NodeJS.Timeout | null>(null)
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
  const [showClearDataConfirmation, setShowClearDataConfirmation] = useState(false)
  const [showEnhancedClearData, setShowEnhancedClearData] = useState(false)
  const [dataStatistics, setDataStatistics] = useState<any>(null)
  const [favoritesEnabled, setFavoritesEnabled] = useState(true)
  const [favoritesPaused, setFavoritesPaused] = useState(false)
  
  

  // Network status state
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'checking'>('online')
  const [retryCount, setRetryCount] = useState(0)

  // Check network connectivity
  const checkNetworkConnectivity = async (): Promise<boolean> => {
    try {
      setNetworkStatus('checking')
      // Try to fetch a simple endpoint to check connectivity
      const response = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      })
      const isOnline = response.ok
      setNetworkStatus(isOnline ? 'online' : 'offline')
      return isOnline
    } catch (error) {
      console.warn('Network connectivity check failed:', error)
      setNetworkStatus('offline')
      // Don't throw error, just return false
      return false
    }
  }

  // Utility function for retrying fetch requests
  const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 3): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      let timeoutId: NodeJS.Timeout | undefined
      
      try {
        // Create timeout signal manually for better compatibility
        const controller = new AbortController()
        timeoutId = setTimeout(() => {
          controller.abort()
        }, 30000) // 30 second timeout

        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            ...options.headers
          },
          cache: 'no-store',
          signal: controller.signal
        })
        
        // Clear timeout if request succeeds
        if (timeoutId) clearTimeout(timeoutId)
        return response
      } catch (error) {
        // Clear timeout if request fails
        if (timeoutId) clearTimeout(timeoutId)
        
        console.warn(`Fetch attempt ${i + 1} failed for ${url}:`, error)
        
        // Don't check connectivity on first attempt to avoid circular dependency
        if (i === 0) {
          // First attempt failed, just continue to retry
        } else {
          // On subsequent attempts, check connectivity
          const isConnected = await checkNetworkConnectivity()
          if (!isConnected) {
            console.warn('Network connectivity issue detected, skipping further retries')
            throw new Error('Network connectivity issue detected')
          }
        }
        
        if (i === retries - 1) throw error
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
      }
    }
    throw new Error('Max retries exceeded')
  }

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

  

  // Show dynamic loading message
  const showDynamicLoading = useCallback((operation: 'search' | 'loadMore' | 'favorites' | 'channels' | 'general') => {
    const message = getLoadingMessage(operation)
    setDynamicLoadingMessage(message)
    return message
  }, [])

  // Show dynamic confirmation message
  const showDynamicConfirmation = useCallback((operation: keyof typeof confirmationMessages, ...args: unknown[]) => {
    const message = getConfirmationMessage(operation, args)
    setDynamicLoadingMessage('')
  }, [])

  // Handle splash screen completion
  const handleSplashComplete = useCallback(() => {
    console.log('App: Splash screen completed, hiding splash screen')
    setShowSplashScreen(false)
  }, [])

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
      { id: 'notes' as Tab, icon: FileText, label: 'Notes' },
      { id: 'notebooks' as Tab, icon: BookOpen, label: 'Notebooks' },
      { id: 'favorites' as Tab, icon: Heart, label: 'Favorites' },
      { id: 'channels' as Tab, icon: User, label: 'Channels' },
      { id: 'watched' as Tab, icon: History, label: 'Watch History' },
      { id: 'settings' as Tab, icon: Settings, label: 'Settings' },
    ]
    
    // Remove favorites tab if disabled
    if (!favoritesEnabled) {
      const favoritesIndex = baseTabs.findIndex(tab => tab.id === 'favorites')
      if (favoritesIndex !== -1) {
        baseTabs.splice(favoritesIndex, 1)
      }
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
      
    }
  }, [activeTab, tabs, triggerHapticFeedback, showPlaylistVideos])

  // Back button functionality
  const handleGoBack = useCallback(() => {
    if (activeTab === 'player' && previousTab !== 'player') {
      // Special case for player - go back to previous tab
      setActiveTab(previousTab)
      setNavigationHistory(prev => prev.slice(0, -1)) // Remove player from history
      triggerHapticFeedback()
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
          
        }
      }
    } else if (activeTab !== 'home') {
      // If no history, go to home
      setActiveTab('home')
      setNavigationHistory(['home'])
      triggerHapticFeedback()
      
    }
  }, [activeTab, previousTab, navigationHistory, tabs, triggerHapticFeedback])

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
          ? ['home', 'search', 'player', 'notes', 'notebooks', 'favorites', 'channels', 'watched', 'settings']
          : ['home', 'search', 'player', 'notes', 'notebooks', 'channels', 'watched', 'settings']
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
  }, [activeTab, handleTabNavigation])

  // Keyboard navigation for tabs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const tabs: Tab[] = favoritesEnabled 
        ? ['home', 'search', 'player', 'notes', 'notebooks', 'favorites', 'channels', 'watched', 'settings']
        : ['home', 'search', 'player', 'notes', 'notebooks', 'channels', 'watched', 'settings']
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
  }, [activeTab, handleTabNavigation])

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
    return getChannelAvatarUrl(channel)
  }, [getChannelAvatarUrl])

  // Safe channel logo extraction for video cards
  const getChannelLogo = useCallback((video: Video | any): string | null => {
    return getChannelAvatarUrl(video.channel || video)
  }, [getChannelAvatarUrl])

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
  

  const loadFavoriteChannels = useCallback(async (): Promise<FavoriteChannel[]> => {
    try {
      const response = await fetchWithRetry('/api/channels')
      if (!response.ok) {
        console.error('Response status:', response.status, response.statusText)
        throw new Error(`Failed to fetch favorite channels: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      setFavoriteChannels(data || [])
      return data || []
    } catch (error) {
      console.error('Failed to load favorite channels:', error)
      setFavoriteChannels([])
      
      return []
    }
  }, [])

  const loadFavoriteVideos = useCallback(async (): Promise<void> => {
    try {
      const response = await fetchWithRetry('/api/favorites')
      if (!response.ok) {
        console.error('Response status:', response.status, response.statusText)
        throw new Error(`Failed to fetch favorite videos: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      // Convert database videos to SimpleVideo format
      const convertedVideos = (data || []).map((video: FavoriteVideo) => convertDbVideoToSimple(video))
      setFavoriteVideos(convertedVideos)
    } catch (error) {
      console.error('Failed to load favorite videos:', error)
      setFavoriteVideos([])
      
    }
  }, [])

  const loadNotes = useCallback(async (): Promise<void> => {
    try {
      setNotesLoading(true)
      const response = await fetchWithRetry('/api/notes')
      if (!response.ok) {
        console.error('Response status:', response.status, response.statusText)
        throw new Error(`Failed to fetch notes: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      setAllNotes(data || [])
    } catch (error) {
      console.error('Failed to load notes:', error)
      setAllNotes([])
      
    } finally {
      setNotesLoading(false)
    }
  }, [])

  // Retry loading all data when network comes back online
  const retryLoadingAllData = useCallback(async () => {
    setRetryCount(prev => prev + 1)
    try {
      await Promise.all([
        loadFavoriteChannels(),
        loadFavoriteVideos(),
        loadNotes()
      ])
      setRetryCount(0)
      
    } catch (error) {
      console.error('Failed to reload data:', error)
      if (retryCount < 3) {
        setTimeout(retryLoadingAllData, 2000 * (retryCount + 1))
      } else {
        
      }
    }
  }, [loadFavoriteChannels, loadFavoriteVideos, loadNotes, retryCount])

  const deleteNote = async (noteId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete note')
      
      setAllNotes(prev => prev.filter(note => note.id !== noteId))
      
    } catch (error) {
      console.error('Failed to delete note:', error)
      
    }
  }

  const updateNote = async (noteId: string, newTitle: string, newContent: string): Promise<void> => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          title: newTitle,
          note: newContent 
        })
      })
      if (!response.ok) throw new Error('Failed to update note')
      
      const updatedNoteData = await response.json()
      setAllNotes(prev => prev.map(note => 
        note.id === noteId ? { ...note, title: newTitle, note: newContent } : note
      ))
      
    } catch (error) {
      console.error('Failed to update note:', error)
      
    }
  }

  const handleEditNote = (note: any) => {
    setEditingNote(note)
    setUpdatedNoteContent(note.note || '')
    setUpdatedNoteTitle(note.title || '')
    setEditDialogOpen(true)
  }

  const handleSaveNoteUpdate = async () => {
    if (editingNote && updatedNoteTitle.trim() && updatedNoteContent.trim()) {
      await updateNote(editingNote.id, updatedNoteTitle.trim(), updatedNoteContent.trim())
      setEditDialogOpen(false)
      setEditingNote(null)
      setUpdatedNoteContent('')
      setUpdatedNoteTitle('')
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
        channelThumbnail: getChannelThumbnailUrl(selectedVideo.channel || selectedVideo),
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
          
        } else {
          throw new Error('Failed to create note')
        }
      } catch (error) {
        console.error('Failed to create note:', error)
        
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
    } catch (error) {
      console.error('Failed to delete notes:', error)
      
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
      
      // Clear all localStorage including playback positions
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('playback-position-') || key.startsWith('mytube-'))) {
          localStorage.removeItem(key)
        }
      }
      
      // Clear search cache
      setSearchCache(new Map())
      
      // Clear all state
      setFavoriteChannels([])
      setFavoriteVideos([])
      setChannelVideos([])
      setChannelSearchResults([])
      setSearchResults(null)
      setSelectedVideo(null)
      setSelectedItems(new Set())
      setMultiSelectMode(false)
      
      // Reload fresh data
      await Promise.all([
        loadFavoriteChannels(),
        loadFavoriteVideos()
      ])
      
    } catch (error) {
      console.error('Failed to clear all data:', error)
      
    } finally {
      setLoading(false)
    }
  }

  const fetchDataStatistics = async () => {
    try {
      const response = await fetch('/api/clear-all-data')
      const data = await response.json()
      
      if (data.statistics) {
        setDataStatistics(data.statistics)
      }
    } catch (error) {
      console.error('Failed to fetch data statistics:', error)
    }
  }

  const handleEnhancedClearData = async (options: any): Promise<void> => {
    try {
      setLoading(true)
      setShowEnhancedClearData(false)
      
      // Clear selected database data
      const response = await fetch('/api/clear-selective-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options)
      })
      
      if (!response.ok) {
        throw new Error('Failed to clear selected data')
      }
      
      const result = await response.json()
      
      // Clear localStorage based on options
      if (options.localStorage || options.searchCache || options.userPreferences) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key) {
            let shouldRemove = false
            
            if (options.localStorage && key.startsWith('playback-position-')) {
              shouldRemove = true
            }
            
            if (options.searchCache && key.startsWith('mytube-search-cache')) {
              shouldRemove = true
            }
            
            if (options.userPreferences && key.startsWith('mytube-') && !key.startsWith('playback-position-')) {
              shouldRemove = true
            }
            
            if (shouldRemove) {
              localStorage.removeItem(key)
            }
          }
        }
      }
      
      // Clear search cache if selected
      if (options.searchCache) {
        setSearchCache(new Map())
      }
      
      // Clear relevant state based on options
      if (options.favoriteChannels) {
        setFavoriteChannels([])
      }
      
      if (options.favoriteVideos) {
        setFavoriteVideos([])
      }
      
      // Reload fresh data
      await Promise.all([
        loadFavoriteChannels(),
        loadFavoriteVideos()
      ])
      
      setDataStatistics(null)
      
    } catch (error) {
      console.error('Failed to clear selected data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadChannelVideos = useCallback(async (channels?: FavoriteChannel[]) => {
    const channelsToLoad = channels || favoriteChannels
    if (channelsToLoad.length === 0) return
    
    setChannelVideosLoading(true)
    try {
      const videoPromises = channelsToLoad.map(async (channel) => {
        try {
          const response = await fetch(`/api/youtube/channel/${channel.channelId}?includeVideos=true&maxVideos=5`)
          if (response.ok) {
            const channelData = await response.json()
            return { channel, videos: channelData.videos || [] }
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
        console.log('Frontend received followed channels data:', JSON.stringify({
          channelsCount: data.channels?.length || 0,
          videosCount: data.videos?.length || 0,
          playlistsCount: data.playlists?.length || 0,
          totalVideos: data.stats?.totalVideos || 0,
          totalPlaylists: data.stats?.totalPlaylists || 0,
          hasData: !!(data.videos?.length || data.playlists?.length)
        }, null, 2))
        setFollowedChannelsContent(data)
        setFollowedChannelsVideos(data.videos || [])
        setFollowedChannelsPlaylists(data.playlists || [])
        setFollowedChannels(data.channels || [])
        setVideoPagination(data.pagination?.videos || null)
        setPlaylistPagination(data.pagination?.playlists || null)
        console.log('Followed channels content loaded:', JSON.stringify({
          videosCount: data.videos?.length || 0,
          playlistsCount: data.playlists?.length || 0,
          channelsCount: data.channels?.length || 0,
          hasVideos: !!(data.videos?.length),
          hasPlaylists: !!(data.playlists?.length),
          videoPage: data.pagination?.videos?.currentPage,
          playlistPage: data.pagination?.playlists?.currentPage
        }, null, 2))
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

  const handleSearch = async (append: boolean = false) => {
    const trimmedQuery = searchQuery.trim()
    
    if (append && !currentSearchQuery.trim()) {
      setHasMoreVideos(false)
      return
    }
    
    // Validate search query
    const validation = validateSearchQuery(append ? currentSearchQuery : trimmedQuery)
    if (!validation.isValid) {
      
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
        
        if (!append) setSearchResults(null)
        return
      }
      
      if (!data.items || data.items.length === 0) {
        if (!append) {
          
          setSearchResults({ items: [] })
          setCachedResults(queryToUse, [], null, false, searchType)
        } else {
          
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
        // Convert YouTube videos, playlists, and channels to SimpleVideo/SimplePlaylist/SimpleChannel format
        const convertedItems = data.items.map((item: any) => {
          if (item.type === 'playlist') {
            return convertYouTubePlaylist(item)
          } else if (item.type === 'channel') {
            return convertYouTubeChannel(item)
          } else {
            return convertYouTubeVideo(item)
          }
        })
        const newItems = convertedItems.filter((item: SearchResultItem) => !existingVideoIds.has(item.id))
        
        if (newItems.length > 0) {
          finalItems = [...searchResults.items, ...newItems]
        } else {
          finalItems = searchResults.items
          
        }
      } else {
        // Convert YouTube videos, playlists, and channels to SimpleVideo/SimplePlaylist/SimpleChannel format
        finalItems = data.items.map((item: any) => {
          if (item.type === 'playlist') {
            return convertYouTubePlaylist(item)
          } else if (item.type === 'channel') {
            return convertYouTubeChannel(item)
          } else {
            const convertedVideo = convertYouTubeVideo(item)
            return convertedVideo
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
      
      // Apply blacklist/whitelist filtering to playlist videos
      const filteredPlaylistVideos = convertedVideos.filter(video => {
        // Check if video is explicitly blacklisted
        const isExplicitlyBlacklisted = blacklisted.some(listItem => 
          listItem.type === 'video' && listItem.itemId === video.videoId
        )
        
        // Check if video is from a blocked channel
        const isFromBlockedChannel = blacklisted.some(listItem => 
          listItem.type === 'channel' && listItem.itemId === video.channelId
        )
        
        // Check if video is explicitly whitelisted
        const isExplicitlyWhitelisted = whitelisted.some(listItem => 
          listItem.type === 'video' && listItem.itemId === video.videoId
        )
        
        // Check if video is from a whitelisted channel
        const isFromWhitelistedChannel = whitelisted.some(listItem => 
          listItem.type === 'channel' && listItem.itemId === video.channelId
        )
        
        // Apply whitelist rules first (whitelist takes precedence)
        if (whitelisted.length > 0) {
          // Show if explicitly whitelisted or from whitelisted channel
          return isExplicitlyWhitelisted || isFromWhitelistedChannel
        }
        
        // Apply blacklist rules
        if (blacklisted.length > 0) {
          // Hide if explicitly blacklisted or from blocked channel
          return !isExplicitlyBlacklisted && !isFromBlockedChannel
        }
        
        // No filtering rules, show all videos
        return true
      })
      
      if (filteredPlaylistVideos.length === 0) {
        console.log('All playlist videos were filtered out by blacklist/whitelist rules')
      } else {
        setPlaylistVideos(filteredPlaylistVideos)
        showDynamicConfirmation('playlistLoaded', [playlist.title, filteredPlaylistVideos.length])
      }
      
      // Switch to search tab to show playlist videos
      setActiveTab('search')
      
    } catch (error) {
      console.error('Failed to load playlist videos:', error)
      const errorMessage = error instanceof Error ? error.message : 'Could not load playlist videos'
      
      
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
        
        // Apply blacklist/whitelist filtering to playlist videos
        const filteredPlaylistVideos = convertedVideos.filter(video => {
          // Check if video is explicitly blacklisted
          const isExplicitlyBlacklisted = blacklisted.some(listItem => 
            listItem.type === 'video' && listItem.itemId === video.videoId
          )
          
          // Check if video is from a blocked channel
          const isFromBlockedChannel = blacklisted.some(listItem => 
            listItem.type === 'channel' && listItem.itemId === video.channelId
          )
          
          // Check if video is explicitly whitelisted
          const isExplicitlyWhitelisted = whitelisted.some(listItem => 
            listItem.type === 'video' && listItem.itemId === video.videoId
          )
          
          // Check if video is from a whitelisted channel
          const isFromWhitelistedChannel = whitelisted.some(listItem => 
            listItem.type === 'channel' && listItem.itemId === video.channelId
          )
          
          // Apply whitelist rules first (whitelist takes precedence)
          if (whitelisted.length > 0) {
            // Show if explicitly whitelisted or from whitelisted channel
            return isExplicitlyWhitelisted || isFromWhitelistedChannel
          }
          
          // Apply blacklist rules
          if (blacklisted.length > 0) {
            // Hide if explicitly blacklisted or from blocked channel
            return !isExplicitlyBlacklisted && !isFromBlockedChannel
          }
          
          // No filtering rules, show all videos
          return true
        })
        
        setExpandedPlaylistVideos(prev => new Map(prev).set(playlistId, filteredPlaylistVideos))
        setExpandedPlaylists(prev => new Set(prev).add(playlistId))
        
        if (convertedVideos.length > 0) {
          
        }
        
      } catch (error) {
        console.error('Failed to expand playlist:', error)
        
      } finally {
        setExpandedPlaylistLoading(prev => {
          const newMap = new Map(prev)
          newMap.delete(playlistId)
          return newMap
        })
      }
    }
  }

  // Debounced search for input changes - waits for user to finish typing
  const debouncedSearch = useCallback((query: string) => {
    // Clear any existing timeout
    if (searchInputTimeout) {
      clearTimeout(searchInputTimeout)
      setSearchInputTimeout(null)
    }
    
    // Clear any existing countdown
    if (searchCountdown !== null) {
      setSearchCountdown(null)
    }
    
    // Only search if query has meaningful content
    const trimmedQuery = query.trim()
    if (trimmedQuery && trimmedQuery.length >= 2) {
      let countdown = 2 // Start countdown from 2 seconds
      setSearchCountdown(countdown)
      
      // Update countdown every second
      const countdownInterval = setInterval(() => {
        countdown -= 1
        setSearchCountdown(countdown)
        
        if (countdown <= 0) {
          clearInterval(countdownInterval)
          setSearchCountdown(null)
        }
      }, 1000)
      
      const timeout = setTimeout(() => {
        clearInterval(countdownInterval)
        setSearchCountdown(null)
        // Double-check that the query is still valid and hasn't changed
        if (searchQuery.trim() === trimmedQuery) {
          handleSearch(false)
        }
      }, 2000) // 2s delay to give users more time to finish typing
      
      setSearchInputTimeout(timeout)
    } else if (!trimmedQuery) {
      // Clear results immediately if query is empty
      setSearchResults(null)
      setHasMoreVideos(false)
      setCurrentSearchQuery('')
      setContinuationToken(null)
      setSearchCountdown(null)
    }
  }, [searchInputTimeout, searchQuery, handleSearch, searchCountdown])

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    // Show typing indicator or clear results for short queries
    if (value.trim().length < 2) {
      setSearchResults(null)
      setHasMoreVideos(false)
      setCurrentSearchQuery('')
      setContinuationToken(null)
      setSearchCountdown(null)
    } else {
      // Trigger debounced search for longer queries
      debouncedSearch(value)
    }
  }

  const handleVideoPlay = async (video: Video, startTime?: number) => {
    console.log('handleVideoPlay called:', video.title, 'startTime:', startTime) // Debug log
    setPreviousTab(activeTab) // Track the previous tab
    setSelectedVideo(video)
    setActiveTab('player')
    
    // Update navigation history for player
    setNavigationHistory(prev => [...prev, 'player'])
    
    // Add to watch history immediately when video is played
    // Check if video is already watched to avoid duplicates
    const isAlreadyWatched = isVideoWatched(video.videoId || video.id)
    
    if (!isAlreadyWatched) {
      await addToWatchedHistory({
        videoId: video.videoId || video.id,
        title: video.title,
        channelName: video.channelName,
        thumbnail: video.thumbnail,
        duration: video.duration,
        viewCount: video.viewCount
      })
      console.log('Added to watch history:', video.title)
    } else {
      console.log('Video already in watch history:', video.title)
    }
  }

  const handleFavoritesVideoPlay = (favoriteVideo: FavoriteVideo) => {
    // Convert FavoriteVideo to Video format
    const video = {
      videoId: favoriteVideo.videoId,
      id: favoriteVideo.videoId,
      title: favoriteVideo.title,
      channelName: favoriteVideo.channelName,
      thumbnail: favoriteVideo.thumbnail,
      duration: favoriteVideo.duration,
      viewCount: favoriteVideo.viewCount,
      publishedAt: null, // Favorite videos don't have publishedAt
      description: ''
    }
    
    // Use the same handleVideoPlay function to switch to player
    handleVideoPlay(video)
  }

  const handleWatchedVideoPlay = (watchedVideo: WatchedVideo) => {
    // Convert WatchedVideo to Video format
    const video = {
      videoId: watchedVideo.videoId,
      id: watchedVideo.videoId,
      title: watchedVideo.title,
      channelName: watchedVideo.channelName,
      thumbnail: watchedVideo.thumbnail,
      duration: watchedVideo.duration,
      viewCount: watchedVideo.viewCount,
      publishedAt: null, // Watched videos don't have publishedAt
      description: ''
    }
    
    // Use the same handleVideoPlay function to switch to player
    handleVideoPlay(video)
  }

  const handleChannelSelect = (channel: FavoriteChannel) => {
    // Handle channel selection - could open channel details or switch to channel view
    console.log('Channel selected:', channel.name)
    // For now, just open the channel in YouTube
    window.open(`https://youtube.com/channel/${channel.channelId}`, '_blank')
  }

  const handleNotesVideoPlay = (note: VideoNote) => {
    // Convert VideoNote to Video format
    const video = {
      videoId: note.videoId,
      id: note.videoId,
      title: note.title,
      channelName: note.channelName,
      thumbnail: note.thumbnail,
      duration: undefined, // Notes don't have duration
      viewCount: undefined, // Notes don't have view count
      publishedAt: null, // Notes don't have publishedAt
      description: note.note
    }
    
    // Use the same handleVideoPlay function to switch to player
    handleVideoPlay(video)
  }

  const handleNotebookSelect = async (notebook: any) => {
    try {
      setSelectedNotebook(notebook)
      setShowNotebookView(true)
      
      // Fetch notebook notes
      setNotebookNotesLoading(true)
      const response = await fetch(`/api/notebooks/${notebook.id}/notes`)
      const data = await response.json()
      
      if (data.success) {
        setNotebookNotes(data.notes)
      } else {
        console.error('Failed to fetch notebook notes:', data.error)
      }
    } catch (error) {
      console.error('Error selecting notebook:', error)
    } finally {
      setNotebookNotesLoading(false)
    }
  }

  const handleAddNoteToNotebook = (selectedNotes: VideoNote[]) => {
    // Set the notes for selection - the dialog will be opened when user switches to notebooks tab
    setNotesForNotebook(selectedNotes)
  }

  const handleBackToNotebooks = () => {
    setShowNotebookView(false)
    setSelectedNotebook(null)
    setNotebookNotes([])
  }

  const handleNotebookShare = () => {
    setShareNotebookDialogOpen(true)
  }

  const handleCreateNoteForNotebook = async (noteData: {
    title: string
    content: string
    videoId?: string
    videoTitle?: string
    channelName?: string
    thumbnail?: string
  }) => {
    try {
      // Create the note first
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: noteData.videoId || 'manual-note',
          title: noteData.title,
          channelName: noteData.channelName || 'Manual Note',
          thumbnail: noteData.thumbnail || '',
          note: noteData.content,
          fontSize: 16,
          startTime: null,
          endTime: null,
          isClip: false
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create note: ${response.status}`)
      }

      const createdNote = await response.json()

      // If we have a selected notebook, add the note to it
      if (selectedNotebook) {
        const addResponse = await fetch(`/api/notebooks/${selectedNotebook.id}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            noteId: createdNote.id
          })
        })

        if (!addResponse.ok) {
          throw new Error(`Failed to add note to notebook: ${addResponse.status}`)
        }

        // Refresh notebook notes
        const notebookResponse = await fetch(`/api/notebooks/${selectedNotebook.id}/notes`)
        const notebookData = await notebookResponse.json()
        
        if (notebookData.success) {
          setNotebookNotes(notebookData.notes)
        }
      }

      // Refresh all notes
      await loadNotes()
      
    } catch (error) {
      console.error('Failed to create note for notebook:', error)
      throw error
    }
  }

  // Get filtered search results based on blacklist/whitelist
  const getFilteredSearchResults = useCallback(() => {
    if (!searchResults?.items) return searchResults
    
    // Helper function to check if an item matches a blacklist/whitelist entry
    const itemMatches = (item: any, listItem: BlacklistedItem | WhitelistedItem) => {
      // Check by type match
      const itemType = 'videoId' in item ? 'video' : 'playlistId' in item ? 'playlist' : 'channelId' in item ? 'channel' : 'unknown'
      if (listItem.type !== itemType) return false
      
      // PRIMARY: Check by YouTube ID matching (most accurate)
      if (listItem.type === 'video' && 'videoId' in item && listItem.itemId === item.videoId) {
        return true
      }
      if (listItem.type === 'playlist' && 'playlistId' in item && listItem.itemId === item.playlistId) {
        return true
      }
      if (listItem.type === 'channel' && 'channelId' in item && listItem.itemId === item.channelId) {
        return true
      }
      
      // FALLBACK: Check by exact title match (less accurate)
      if (listItem.title.toLowerCase() === item.title?.toLowerCase()) {
        return true
      }
      
      // FALLBACK: Check by channel name match (for channels)
      if (listItem.channelName && listItem.channelName.toLowerCase() === item.channelName?.toLowerCase()) {
        return true
      }
      
      return false
    }

    // Helper function to check if a video is from a blocked channel
    const isFromBlockedChannel = (item: any) => {
      if (!('channelId' in item)) return false
      
      return blacklisted.some(listItem => 
        listItem.type === 'channel' && listItem.itemId === item.channelId
      )
    }

    // Helper function to check if a video is from a whitelisted channel
    const isFromWhitelistedChannel = (item: any) => {
      if (!('channelId' in item)) return false
      
      return whitelisted.some(listItem => 
        listItem.type === 'channel' && listItem.itemId === item.channelId
      )
    }

    // Helper function to check if item is explicitly blacklisted/whitelisted
    const isExplicitlyBlacklisted = (item: any) => {
      return blacklisted.some(listItem => itemMatches(item, listItem))
    }

    const isExplicitlyWhitelisted = (item: any) => {
      return whitelisted.some(listItem => itemMatches(item, listItem))
    }

    // Filter items based on blacklist/whitelist rules
    const filteredItems = searchResults.items.filter(item => {
      const itemType = 'videoId' in item ? 'video' : 'playlistId' in item ? 'playlist' : 'channelId' in item ? 'channel' : 'unknown'
      
      // RULE 1: If whitelist has items, only show whitelisted content
      if (whitelisted.length > 0) {
        // Allow if explicitly whitelisted
        if (isExplicitlyWhitelisted(item)) {
          return true
        }
        
        // For videos, also allow if from whitelisted channel
        if (itemType === 'video' && isFromWhitelistedChannel(item)) {
          return true
        }
        
        // For playlists, check if playlist is whitelisted
        if (itemType === 'playlist' && isExplicitlyWhitelisted(item)) {
          return true
        }
        
        // For channels, check if channel is whitelisted
        if (itemType === 'channel' && isExplicitlyWhitelisted(item)) {
          return true
        }
        
        // Not whitelisted, hide it
        return false
      }
      
      // RULE 2: If blacklist has items, exclude blacklisted content
      if (blacklisted.length > 0) {
        // Hide if explicitly blacklisted
        if (isExplicitlyBlacklisted(item)) {
          return false
        }
        
        // For videos, also hide if from blocked channel
        if (itemType === 'video' && isFromBlockedChannel(item)) {
          return false
        }
        
        // For playlists, hide if playlist is blacklisted
        if (itemType === 'playlist' && isExplicitlyBlacklisted(item)) {
          return false
        }
        
        // For channels, hide if channel is blacklisted
        if (itemType === 'channel' && isExplicitlyBlacklisted(item)) {
          return false
        }
        
        // Not blacklisted, show it
        return true
      }
      
      // No filtering rules, show everything
      return true
    })
    
    return {
      ...searchResults,
      items: filteredItems
    }
  }, [searchResults, blacklisted, whitelisted])

  // Handlers for adding items to blacklist/whitelist
  const handleAddToBlacklist = useCallback(async (item: any) => {
    const itemType = 'videoId' in item ? 'video' : 'playlistId' in item ? 'playlist' : 'channelId' in item ? 'channel' : 'unknown'
    const itemTitle = item.title || item.channelName || 'Unknown'
    
    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      type: 'blacklist',
      item,
      itemType,
      itemTitle
    })
  }, [])

  const handleAddToWhitelist = useCallback(async (item: any) => {
    const itemType = 'videoId' in item ? 'video' : 'playlistId' in item ? 'playlist' : 'channelId' in item ? 'channel' : 'unknown'
    const itemTitle = item.title || item.channelName || 'Unknown'
    
    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      type: 'whitelist',
      item,
      itemType,
      itemTitle
    })
  }, [])

  // Confirm action handler
  const handleConfirmAction = useCallback(async () => {
    const { type, item, itemType, itemTitle } = confirmDialog
    
    try {
      let success = false
      let actionText = ''
      
      if (type === 'blacklist') {
        success = await addToBlacklist(item)
        actionText = 'blocked'
        if (success) {
          // Refresh blacklist from database
          const updatedBlacklist = await fetchBlacklistedItems()
          setBlacklisted(updatedBlacklist)
          handleBlacklistChange(updatedBlacklist)
        }
      } else if (type === 'whitelist') {
        success = await addToWhitelist(item)
        actionText = 'allowed'
        if (success) {
          // Refresh whitelist from database
          const updatedWhitelist = await fetchWhitelistedItems()
          setWhitelisted(updatedWhitelist)
          handleWhitelistChange(updatedWhitelist)
        }
      }
      
      // Show toast notification
      if (success) {
        toast({
          title: `Success!`,
          description: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} "${itemTitle}" has been ${actionText}.`,
          variant: 'default',
        })
      } else {
        toast({
          title: `Error!`,
          description: `Failed to ${actionText} ${itemType} "${itemTitle}". Please try again.`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error(`Error in handleConfirmAction:`, error)
      toast({
        title: `Error!`,
        description: `An unexpected error occurred. Please try again.`,
        variant: 'destructive',
      })
    } finally {
      // Close confirmation dialog
      setConfirmDialog({
        isOpen: false,
        type: 'blacklist',
        item: null,
        itemType: '',
        itemTitle: ''
      })
    }
  }, [confirmDialog, toast])

  // Cancel action handler
  const handleCancelAction = useCallback(() => {
    setConfirmDialog({
      isOpen: false,
      type: 'blacklist',
      item: null,
      itemType: '',
      itemTitle: ''
    })
    
    toast({
      title: `Cancelled`,
      description: `Action has been cancelled.`,
      variant: 'default',
    })
  }, [toast])

  // Memoized callbacks for SearchResultsFilter to prevent infinite loops
  const handleBlacklistChange = useCallback((blacklisted: BlacklistedItem[]) => {
    console.log('Blacklist updated:', blacklisted)
  }, [])

  const handleWhitelistChange = useCallback((whitelisted: WhitelistedItem[]) => {
    console.log('Whitelist updated:', whitelisted)
  }, [])

  const handleVideoSelect = (video: Video) => {
    console.log('handleVideoSelect called:', video.title) // Debug log
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

    // Remove duplicates and current video
    const uniqueVideos = allVideos.filter((video, index, self) => 
      index === self.findIndex((v) => v.id === video.id) && video.id !== selectedVideo.id
    )

    if (uniqueVideos.length === 0) {
      
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
      
    } else {
      
    }
  }, [selectedVideo, searchResults, channelVideos, favoriteVideos, handleVideoPlay])

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

    // Remove duplicates and current video
    const uniqueVideos = allVideos.filter((video, index, self) => 
      index === self.findIndex((v) => v.id === video.id) && video.id !== selectedVideo.id
    )

    if (uniqueVideos.length === 0) {
      
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
      
    } else {
      
    }
  }, [selectedVideo, searchResults, channelVideos, favoriteVideos, handleVideoPlay])

  const toggleFavorite = async (video: Video) => {
    // Check if favorites are enabled
    if (!favoritesEnabled) {
      
      return
    }
    
    // Check if favorites are paused
    if (favoritesPaused) {
      
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
            channelThumbnail: getChannelThumbnailUrl(video.channel || video),
            thumbnail: thumbnailUrl,
            duration: typeof video.duration === 'string' ? video.duration : 
                       (typeof video.duration === 'number' ? video.duration.toString() : undefined),
            viewCount: typeof video.viewCount === 'number' ? video.viewCount : 
                       (typeof video.viewCount === 'string' && /^\d+$/.test(video.viewCount) ? parseInt(video.viewCount, 10) : undefined)
          })
        })
        
        if (response.ok) {
          showDynamicConfirmation('favorites', 'add')
          await loadFavoriteVideos()
        } else {
          
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      
    } finally {
      setDynamicLoadingMessage('')
    }
  }

  // Update channel search results when favorite channels change (but not during follow operations)
  useEffect(() => {
    if (channelSearchResults.length > 0 && !isUpdatingFollow) {
      setChannelSearchResults(prev => 
        prev.map(channel => ({
          ...channel,
          isFavorite: favoriteChannels.some(c => c.channelId === channel.channelId)
        }))
      )
    }
  }, [favoriteChannels, isUpdatingFollow])

  const handleChannelSearch = async (): Promise<void> => {
    const trimmedQuery = channelSearchQuery.trim()
    if (!trimmedQuery) {
      
      return
    }

    setChannelSearchLoading(true)

    try {
      const response = await fetch(`/api/youtube/search-channels?query=${encodeURIComponent(trimmedQuery)}`)
      if (!response.ok) throw new Error('Failed to search channels')
      
      const data = await response.json()
      
      // Add isFavorite property to each channel based on favoriteChannels
      const channelsWithFavoriteStatus = (data.items || []).map((channel: any) => ({
        ...channel,
        isFavorite: favoriteChannels.some(c => c.channelId === channel.channelId)
      }))
      
      setChannelSearchResults(channelsWithFavoriteStatus)
    } catch (error) {
      console.error('Error searching channels:', error)
      
      setChannelSearchResults([])
    } finally {
      setChannelSearchLoading(false)
    }
  }

  // Debounced channel search effect - triggers search when user stops typing
  useEffect(() => {
    // Clear existing timeout
    if (channelSearchTimeout) {
      clearTimeout(channelSearchTimeout)
    }

    // Set new timeout to search after user stops typing (500ms delay)
    const newTimeout = setTimeout(() => {
      handleChannelSearch()
    }, 500)

    setChannelSearchTimeout(newTimeout)

    // Cleanup function to clear timeout on unmount or when dependencies change
    return () => {
      if (newTimeout) {
        clearTimeout(newTimeout)
      }
    }
  }, [channelSearchQuery]) // Only depend on channelSearchQuery

  const handleFollowChannel = async (channel: any) => {
    try {
      setIsUpdatingFollow(true) // Prevent useEffect from overriding our updates
      const isFollowing = favoriteChannels.some(c => c.channelId === channel.channelId)
      
      if (isFollowing) {
        const response = await fetch(`/api/channels/${channel.channelId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          // Optimistically update search results to reflect unfollow immediately
          setChannelSearchResults(prev => 
            prev.map(c => c.channelId === channel.channelId ? { ...c, isFavorite: false } : c)
          )
          
          // Then reload favorite channels to sync with backend
          await loadFavoriteChannels()
        } else {
          
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
          // Optimistically update search results to reflect follow immediately
          setChannelSearchResults(prev => 
            prev.map(c => c.channelId === channel.channelId ? { ...c, isFavorite: true } : c)
          )
          
          // Then reload favorite channels to sync with backend
          await loadFavoriteChannels()
        } else {
          
        }
      }
    } catch (error) {
      console.error('Error following channel:', error)
      
    } finally {
      setIsUpdatingFollow(false) // Re-enable useEffect updates
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
      console.log('App: Starting initial data load')
      try {
        console.log('App: Loading favorite channels, videos, and notes...')
        const results = await Promise.all([
          loadFavoriteChannels(),
          loadFavoriteVideos(),
          loadNotes()
        ])
        console.log('App: Initial data load completed', results)
        
        // The second result is favoriteChannels data
        const favoriteChannelsData = results[1]
        if (favoriteChannelsData && favoriteChannelsData.length > 0) {
          console.log('App: Loading channel videos for', favoriteChannelsData.length, 'channels')
          await loadChannelVideos(favoriteChannelsData)
        }
      } catch (error) {
        console.error('App: Failed to load initial data:', error)
      }
    }
    
    // Debug splash screen state changes
    console.log('App: showSplashScreen changed to:', showSplashScreen)
    if (!showSplashScreen) {
      console.log('App: Splash screen hidden, triggering initial data load')
      loadInitialData()
      
      // Add a fallback timeout to show the app even if data loading fails
      setTimeout(() => {
        console.log('App: Fallback timeout - showing app regardless of data load status')
        // The app should already be visible, but this ensures we're not stuck
      }, 5000) // 5 seconds after splash screen
    }
  }, [showSplashScreen, loadFavoriteChannels, loadFavoriteVideos, loadNotes])

  // Load followed channels content when favorite channels change
  useEffect(() => {
    if (!showSplashScreen && favoriteChannels.length > 0) {
      loadChannelVideos()
      // Load followed channels content when there are channels to follow
      if (followedChannelsContent === null) {
        loadFollowedChannelsContent(true)
      }
    }
  }, [favoriteChannels.length, showSplashScreen, loadChannelVideos, followedChannelsContent])

  // Monitor network status and retry when connection is restored
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await checkNetworkConnectivity()
      if (isConnected && networkStatus === 'offline') {
        // Network came back online, retry loading data
        retryLoadingAllData()
      }
    }

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000)
    
    // Also check when browser comes back online
    const handleOnline = () => {
      setNetworkStatus('online')
      retryLoadingAllData()
    }
    
    const handleOffline = () => {
      setNetworkStatus('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [networkStatus, checkNetworkConnectivity, retryLoadingAllData])

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

  // Refresh data when switching to certain tabs to ensure data is up to date
  useEffect(() => {
    if (!showSplashScreen && activeTab === 'notes') {
      const refreshData = async () => {
        try {
          await Promise.all([
            loadNotes()
          ])
        } catch (error) {
          console.error('Failed to refresh data:', error)
        }
      }
      refreshData()
    }
  }, [activeTab, showSplashScreen, loadNotes])

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
    const videoId = video.videoId || video.id
    const isFavorite = favoriteVideoIds.has(videoId)
    const isSelected = selectedItems.has(videoId)
    
    return (
      <UnifiedVideoCard
        video={toVideoCardData(video)}
        variant="default"
        showActions={showActions}
        isSelectable={multiSelectMode}
        isSelected={isSelected}
        onPlay={handleVideoSelect}
        onFavorite={toggleFavorite}
        onSelect={(videoId, selected) => toggleItemSelection(videoId)}
        onAddToBlacklist={handleAddToBlacklist}
        onAddToWhitelist={handleAddToWhitelist}
        isBlacklisted={isBlacklisted}
        isWhitelisted={isWhitelisted}
        size="md"
      />
    )
  }, [favoriteVideoIds, selectedItems, multiSelectMode, toggleItemSelection, handleVideoSelect, toggleFavorite])

  const ChannelCard = useCallback(({ channel }: { channel: Channel }) => {
    return (
      <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-border/50 hover:border-primary/30">
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-3">
            {/* Channel Header */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={channel.thumbnail}
                  alt={channel.name}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = `https://via.placeholder.com/48x48/374151/ffffff?text=${encodeURIComponent(channel.name[0] || '?')}`
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base truncate">{channel.name}</h3>
                {channel.handle && (
                  <p className="text-xs text-muted-foreground">@{channel.handle}</p>
                )}
                {channel.subscriberCount && (
                  <p className="text-xs text-muted-foreground">{channel.subscriberCount} subscribers</p>
                )}
              </div>
            </div>
            
            {/* Channel Stats */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-3">
                {channel.videoCount && (
                  <span>{channel.videoCount.toLocaleString()} videos</span>
                )}
                {channel.viewCount && (
                  <span>{channel.viewCount.toLocaleString()} views</span>
                )}
              </div>
            </div>
            
            {/* Channel Description */}
            {channel.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {channel.description}
              </p>
            )}
            
            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button
                size="sm"
                variant={channel.isFavorite ? "secondary" : "default"}
                onClick={() => handleFollowChannel(channel)}
                className="text-xs"
              >
                {channel.isFavorite ? (
                  <>
                    <Users className="w-3 h-3 mr-1" />
                    Following
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 mr-1" />
                    Follow
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }, [handleFollowChannel])

  const PlaylistCard = useCallback(({ playlist }: { playlist: Playlist }) => {
    const isSelected = selectedItems.has(playlist.id)
    const playlistId = playlist.id || playlist.playlistId
    const isExpanded = playlistId ? expandedPlaylists.has(playlistId) : false
    const isLoading = playlistId ? expandedPlaylistLoading.get(playlistId) || false : false
    const videos = playlistId ? expandedPlaylistVideos.get(playlistId) || [] : []
    const thumbnailUrl = playlist.thumbnail
    
    return (
      <Card className={`group relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] border-border/50 hover:border-primary/40 bg-card ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
      }`}>
        <CardContent className="p-2 sm:p-2.5 sm:p-3 md:p-3 lg:p-3">
          <div className="space-y-2 sm:space-y-2.5 sm:space-y-3">
            {/* Thumbnail Section - Optimized for Mobile */}
            <div className="relative aspect-video w-full overflow-hidden rounded-md shadow-md ring-1 ring-border/10 max-h-32 sm:max-h-36 sm:max-h-40 md:max-h-44 lg:max-h-48">
              <img
                src={thumbnailUrl}
                alt={playlist.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = `https://via.placeholder.com/320x180/1f2937/ffffff?text=Playlist`
                }}
              />
              
              {/* Enhanced Dark Overlay for Better Mobile Button Visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent pointer-events-none"></div>
              
              {/* Video Count Badge - Smaller on Mobile */}
              <div className="absolute bottom-1.5 sm:bottom-2 sm:bottom-2.5 right-1.5 sm:right-2 sm:right-2.5 bg-foreground/95 backdrop-blur-md text-background text-sm font-semibold px-1.5 sm:px-2 sm:px-2 py-0.5 sm:py-1 sm:py-1 rounded shadow-lg border border-background/10">
                {playlist.videoCount} videos
              </div>
              
              {/* Playlist Badge - Smaller on Mobile */}
              <div className="absolute top-1.5 sm:top-2 sm:top-2.5 left-1.5 sm:left-2 sm:left-2.5 bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-bold px-1.5 sm:px-2 py-0.5 rounded shadow-lg border border-primary/30 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                Playlist
              </div>
              
              {/* Mobile-First Persistent Action Bar - Always Visible on Mobile */}
              <div className="sm:hidden absolute bottom-1.5 left-1.5 right-1.5 flex justify-between items-end pointer-events-none">
                <div className="flex gap-1.5 pointer-events-auto">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      loadPlaylistVideos(playlist)
                    }}
                    className="h-10 w-10 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground rounded-full p-0 transition-all duration-200 hover:scale-110 shadow-lg border-2 border-primary/30 backdrop-blur-sm"
                    disabled={playlistVideosLoading}
                    title="Play playlist"
                  >
                    {playlistVideosLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePlaylistExpansion(playlist)
                    }}
                    className={`h-10 w-10 rounded-full p-0 transition-all duration-200 hover:scale-110 shadow-lg border-2 backdrop-blur-sm ${
                      isExpanded 
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary/30' 
                        : 'bg-background/95 hover:bg-background text-foreground border-background/30'
                    }`}
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
              </div>

              {/* Desktop Play Button Overlay - Hover Only */}
              <div className="hidden sm:block absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-md flex items-center justify-center">
                <Button
                  size="lg"
                  onClick={(e) => {
                    e.stopPropagation()
                    loadPlaylistVideos(playlist)
                  }}
                  className="bg-background/95 hover:bg-background text-foreground hover:scale-110 transition-all duration-300 shadow-2xl h-10 w-10 sm:h-11 sm:w-11 sm:h-12 sm:w-12 rounded-full p-0 border-2 border-background/50"
                  disabled={playlistVideosLoading}
                  title="Play playlist"
                >
                  {playlistVideosLoading ? (
                    <Loader2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 sm:w-5 sm:h-5 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 sm:w-4.5 sm:h-4.5 sm:w-5 sm:h-5 ml-1" fill="currentColor" />
                  )}
                </Button>
              </div>
              
              {/* Desktop Quick Actions - Top Right - Hover Only */}
              <div className="hidden sm:block absolute top-1.5 sm:top-2 sm:top-2.5 right-1.5 sm:right-2 sm:right-2.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePlaylistExpansion(playlist)
                  }}
                  className={`h-7 w-7 sm:h-8 sm:w-8 sm:h-9 sm:w-9 rounded-full p-0 transition-all duration-200 hover:scale-110 shadow-lg ${
                    isExpanded 
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                      : 'bg-background/90 hover:bg-background text-foreground'
                  }`}
                  disabled={isLoading}
                  title={isExpanded ? "Collapse playlist" : "Expand playlist"}
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 sm:w-4.5 sm:h-4.5 animate-spin" />
                  ) : isExpanded ? (
                    <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 sm:w-4.5 sm:h-4.5" />
                  ) : (
                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 sm:w-4.5 sm:h-4.5" />
                  )}
                </Button>
                
                {multiSelectMode && (
                  <div className="bg-white/90 rounded-full p-1 shadow-lg">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleItemSelection(playlist.id)}
                      className="w-3 h-3 sm:w-4 sm:h-4 sm:w-4.5 sm:h-4.5"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Content Section - Optimized for Mobile */}
            <div className="space-y-1.5 sm:space-y-2 sm:space-y-2.5">
              {/* Title - Smaller on Mobile */}
              <h3 className="font-bold text-sm sm:text-base md:text-lg lg:text-lg line-clamp-2 group-hover:text-primary transition-colors leading-tight min-h-[1.8em] sm:min-h-[2em] sm:min-h-[2.4em]">
                {playlist.title}
              </h3>
              
              {/* Channel Info - More Compact */}
              <div className="flex items-start gap-1.5 sm:gap-2 sm:gap-2.5">
                <div className="relative">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-7 lg:h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md">
                    {playlist.channelName ? playlist.channelName.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-card"></div>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <p className="text-sm sm:text-base text-muted-foreground font-medium truncate hover:text-foreground transition-colors">
                    {playlist.channelName}
                  </p>
                  {playlist.channelName && (
                    <span className="text-sm text-muted-foreground/70 hidden sm:hidden sm:inline md:inline lg:inline">
                      @{playlist.channelName.toLowerCase().replace(/\s+/g, '')}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Playlist Stats - More Compact */}
              <div className="flex items-center gap-1.5 sm:gap-2 sm:gap-2.5 text-sm text-muted-foreground flex-wrap">
                <span className="font-semibold text-foreground/80 text-sm">{playlist.videoCount} videos</span>
                {playlist.viewCount && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="text-sm">{formatViewCount(playlist.viewCount)}</span>
                  </>
                )}
                {playlist.lastUpdatedAt && (
                  <>
                    <span className="text-muted-foreground/40 hidden sm:hidden sm:inline md:inline lg:inline">•</span>
                    <span className="hidden sm:hidden sm:inline md:inline lg:inline text-sm">{playlist.lastUpdatedAt}</span>
                  </>
                )}
              </div>
              
              {/* Description - Hidden on smaller screens */}
              {playlist.description && (
                <p className="text-sm text-muted-foreground line-clamp-1 sm:line-clamp-2 sm:line-clamp-3 hidden md:block lg:block leading-relaxed">
                  {playlist.description}
                </p>
              )}
            </div>
            
            {/* Bottom Action Bar - Desktop Only */}
            <div className="hidden sm:block flex items-center justify-between pt-2 sm:pt-2.5 sm:pt-3 border-t border-border/60 bg-muted/20 rounded-b-lg -mx-2 sm:-mx-2.5 sm:-mx-3 md:-mx-3 lg:-mx-3 px-2 sm:px-2.5 sm:px-3 md:px-3 lg:px-3">
              <div className="flex gap-1.5 sm:gap-2 sm:gap-2.5">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    loadPlaylistVideos(playlist)
                  }}
                  className="h-7 w-7 sm:h-8 sm:w-8 sm:h-9 sm:w-9 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground rounded-full p-0 transition-all duration-200 hover:scale-110 shadow-md"
                  disabled={playlistVideosLoading}
                  title="Play playlist"
                >
                  {playlistVideosLoading ? (
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 sm:w-4.5 sm:h-4.5 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3 sm:w-4 sm:h-4 sm:w-4.5 sm:h-4.5 ml-0.5" fill="currentColor" />
                  )}
                </Button>
                
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePlaylistExpansion(playlist)
                  }}
                  className={`h-7 w-7 sm:h-8 sm:w-8 sm:h-9 sm:w-9 rounded-full p-0 transition-all duration-200 hover:scale-110 shadow-md ${
                    isExpanded 
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                      : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                  }`}
                  disabled={isLoading}
                  title={isExpanded ? "Collapse playlist" : "Expand playlist"}
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 sm:w-4.5 sm:h-4.5 animate-spin" />
                  ) : isExpanded ? (
                    <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 sm:w-4.5 sm:h-4.5" />
                  ) : (
                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 sm:w-4.5 sm:h-4.5" />
                  )}
                </Button>
              </div>
              
              {multiSelectMode && (
                <div className="bg-muted/50 rounded-full p-0.5">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleItemSelection(playlist.id)}
                    className="w-3 h-3 sm:w-4 sm:h-4 sm:w-4.5 sm:h-4.5"
                  />
                </div>
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
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-base text-muted-foreground">Loading playlist videos...</span>
          </div>
        </div>
      )
    }

    if (videos.length === 0) {
      return (
        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center py-4">
            <Music className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-base text-muted-foreground">No videos found in this playlist</p>
          </div>
        </div>
      )
    }

    const currentVideo = videos[currentVideoIndex]

    return (
      <div className="mt-4 space-y-4">
        {/* Playlist Controls */}
        <div className="bg-gradient-to-r from-primary/50 via-primary/25 to-transparent dark:from-primary/95 dark:via-primary/90 dark:to-transparent rounded-xl p-4 border border-border shadow-sm">
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
                <h4 className="font-medium text-foreground truncate">
                  {currentVideo?.title || 'No video selected'}
                </h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
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
                  className="h-9 px-4 bg-primary hover:bg-primary/90 flex items-center gap-2"
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
                  className="h-9 px-3 border-border text-primary hover:bg-muted"
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
                  <div className="flex items-center justify-between text-xs text-primary dark:text-primary mb-1">
                    <span>Video {currentVideoIndex + 1}</span>
                    <span>{videos.length} total</span>
                  </div>
                  <div className="w-full bg-muted dark:bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary dark:bg-primary h-2 rounded-full transition-all duration-300"
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
        
        {/* Videos Grid - Mobile Optimized */}
        <div className="grid-mobile-3 mobile-content">
          {videos.map((video, index) => (
            <div 
              key={video.videoId || video.id} 
              className={`relative group cursor-pointer transition-all duration-200 ${
                index === currentVideoIndex 
                  ? 'ring-primary bg-muted shadow-md' 
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
                    <Badge className="absolute bottom-1 right-1 bg-foreground/80 text-background text-xs px-1 py-0">
                      {formatDuration(video.duration)}
                    </Badge>
                  )}
                  {index === currentVideoIndex && (
                    <div className="absolute inset-0 bg-primary/30 rounded-md flex items-center justify-center">
                      {isPlaying ? (
                        <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center">
                          <Pause className="w-3 h-3 text-primary" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center">
                          <Play className="w-3 h-3 text-primary" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Video Info */}
                <div className="flex-1 min-w-0">
                  <h5 className={`text-sm font-medium line-clamp-2 transition-colors ${
                    index === currentVideoIndex 
                      ? 'text-foreground' 
                      : 'group-hover:text-primary dark:group-hover:text-primary'
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
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                        <span className="text-xs text-primary">Playing</span>
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
                        ? 'bg-primary text-white' 
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
              className="text-primary border-border hover:bg-muted hover:text-primary"
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
            {/* Home page content removed */}
          </div>
        )
      case 'search':
        return (
          <div className="space-y-6">
            {/* Search Header */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-4 sm:p-6 border border-border">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent mb-4">
                Search Content
              </h2>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex-1 relative">
                  <Input
                    placeholder={
                      searchQuery.trim().length < 2 
                        ? "Type at least 2 characters to search..." 
                        : searchCountdown !== null
                        ? `Searching in ${searchCountdown}...`
                        : "Searching will start automatically when you stop typing..."
                    }
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (searchInputTimeout) {
                          clearTimeout(searchInputTimeout)
                          setSearchInputTimeout(null)
                        }
                        setSearchCountdown(null)
                        handleSearch(false)
                      }
                    }}
                    className="flex-1 text-sm sm:text-base pr-10 h-11 min-h-[44px] text-base"
                  />
                  {searchQuery.trim().length >= 2 && (searchInputTimeout || searchCountdown !== null) && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-pulse text-xs text-muted-foreground">
                        {searchCountdown !== null ? (
                          <span className="text-xs font-mono">{searchCountdown}</span>
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as any)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-xs sm:text-sm h-11 min-h-[44px] touch-manipulation mobile-touch-feedback"
                >
                  <option value="all">All</option>
                  <option value="video">Videos</option>
                  <option value="playlist">Playlists</option>
                  <option value="channel">Channels</option>
                </select>
                <Button
                  onClick={() => handleSearch(false)}
                  disabled={loading}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 px-4 py-2 sm:py-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Search Results */}
            {showPlaylistVideos && selectedPlaylist ? (
              <div className="space-y-6">
                {/* Playlist Header */}
                <div className="bg-gradient-to-r from-primary/50 via-primary/25 to-transparent dark:from-primary/95 dark:via-primary/90 dark:to-transparent rounded-xl p-4 sm:p-6 border border-border">
                  <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center">
                    {/* Back Button */}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPlaylistVideos(false)
                        setSelectedPlaylist(null)
                        setPlaylistVideos([])
                      }}
                      className="h-8 sm:h-10 px-3 flex-shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Back</span>
                    </Button>
                    
                    {/* Playlist Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 mb-2">
                        <h2 className="text-lg sm:text-xl font-bold text-foreground truncate flex-1 min-w-0">
                          {selectedPlaylist.title}
                        </h2>
                        <Badge variant="secondary" className="bg-muted text-foreground dark:bg-muted dark:text-foreground text-xs sm:text-sm">
                          Playlist
                        </Badge>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                        <span className="font-medium truncate">
                          {selectedPlaylist.channelName}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <div className="flex items-center gap-1">
                          <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{playlistVideos.length} of {selectedPlaylist.videoCount} videos</span>
                        </div>
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
                        className="h-8 sm:h-9 px-2 sm:px-3"
                      >
                        {playlistVideosLoading ? (
                          <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            <span className="hidden sm:inline">Refresh</span>
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
                          className="h-8 sm:h-9 px-2 sm:px-3 bg-primary hover:bg-primary/90"
                        >
                          <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">Play</span>
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
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                        <p className="text-lg font-medium text-foreground">
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
                    
                    {/* Videos Grid - Mobile Optimized */}
                    <div className="grid-mobile-2 mobile-content">
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
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <Music className="w-8 h-8 text-primary dark:text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">
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
                {/* Search Results Filter */}
                <SearchResultsFilter
                  searchType={searchType}
                  onSearchTypeChange={setSearchType}
                  searchResults={getFilteredSearchResults()}
                  onBlacklistChange={handleBlacklistChange}
                  onWhitelistChange={handleWhitelistChange}
                  onAddToBlacklist={handleAddToBlacklist}
                  onAddToWhitelist={handleAddToWhitelist}
                  className="mb-4"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold">
                      {getFilteredSearchResults().items.length > 0 
                        ? `Search Results` 
                        : 'No results found'
                      }
                    </h3>
                    {getFilteredSearchResults().items.length > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span>
                          {getFilteredSearchResults().items.filter(item => (item as any).type === 'video').length} videos
                        </span>
                        {getFilteredSearchResults().items.filter(item => (item as any).type === 'playlist').length > 0 && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span>
                              {getFilteredSearchResults().items.filter(item => (item as any).type === 'playlist').length} playlists
                            </span>
                          </>
                        )}
                        {getFilteredSearchResults().items.filter(item => (item as any).type === 'channel').length > 0 && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span>
                              {getFilteredSearchResults().items.filter(item => (item as any).type === 'channel').length} channels
                            </span>
                          </>
                        )}
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
                  {getFilteredSearchResults().items.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {currentSearchQuery && `Showing filtered results for "${currentSearchQuery}"`}
                    </div>
                  )}
                </div>
                
                {/* Filtered Search Results */}
                {getFilteredSearchResults().items.length > 0 && (
                  <div className="grid-mobile-2 mobile-content">
                    {getFilteredSearchResults().items
                      .filter((item) => {
                        if (searchType === 'all') return true
                        return (item as any).type === searchType
                      })
                      .map((item) => {
                        if (item.type === 'playlist') {
                          const isBlacklisted = blacklisted.some(listItem => 
                            listItem.id === (item as Playlist).playlistId && listItem.type === 'playlist'
                          )
                          const isWhitelisted = whitelisted.some(listItem => 
                            listItem.id === (item as Playlist).playlistId && listItem.type === 'playlist'
                          )
                          return (
                            <div key={item.playlistId || item.id} className="relative group">
                              <PlaylistCard playlist={item as Playlist} />
                              {/* Status indicator */}
                              {isBlacklisted && (
                                <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                                  Blacklisted
                                </div>
                              )}
                              {isWhitelisted && (
                                <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                                  Whitelisted
                                </div>
                              )}
                              {/* Blacklist/Whitelist overlay buttons */}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 w-8 p-0 bg-black/70 hover:bg-black/80 text-white"
                                  onClick={() => handleAddToBlacklist(item)}
                                  title="Add to Blacklist"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-8 w-8 p-0 bg-green-600/70 hover:bg-green-600/80 text-white"
                                  onClick={() => handleAddToWhitelist(item)}
                                  title="Add to Whitelist"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )
                        } else if (item.type === 'channel') {
                          const isBlacklisted = blacklisted.some(listItem => 
                            listItem.id === (item as Channel).channelId && listItem.type === 'channel'
                          )
                          const isWhitelisted = whitelisted.some(listItem => 
                            listItem.id === (item as Channel).channelId && listItem.type === 'channel'
                          )
                          return (
                            <div key={item.channelId || item.id} className="relative group">
                              <ChannelCard channel={item as Channel} />
                              {/* Status indicator */}
                              {isBlacklisted && (
                                <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                                  Blacklisted
                                </div>
                              )}
                              {isWhitelisted && (
                                <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                                  Whitelisted
                                </div>
                              )}
                              {/* Blacklist/Whitelist overlay buttons */}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 w-8 p-0 bg-black/70 hover:bg-black/80 text-white"
                                  onClick={() => handleAddToBlacklist(item)}
                                  title="Add to Blacklist"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-8 w-8 p-0 bg-green-600/70 hover:bg-green-600/80 text-white"
                                  onClick={() => handleAddToWhitelist(item)}
                                  title="Add to Whitelist"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )
                        } else {
                          const isBlacklisted = blacklisted.some(listItem => 
                            listItem.id === (item as Video).videoId && listItem.type === 'video'
                          )
                          const isWhitelisted = whitelisted.some(listItem => 
                            listItem.id === (item as Video).videoId && listItem.type === 'video'
                          )
                          return (
                            <div key={(item as Video).videoId || item.id} className="relative group">
                              <UnifiedVideoCard 
                                video={item as Video} 
                                onPlay={handleVideoSelect}
                                onAddToBlacklist={handleAddToBlacklist}
                                onAddToWhitelist={handleAddToWhitelist}
                                isBlacklisted={isBlacklisted}
                                isWhitelisted={isWhitelisted}
                              />
                              {/* Blacklist/Whitelist overlay buttons */}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 w-8 p-0 bg-black/70 hover:bg-black/80 text-white"
                                  onClick={() => handleAddToBlacklist(item)}
                                  title="Add to Blacklist"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-8 w-8 p-0 bg-green-600/70 hover:bg-green-600/80 text-white"
                                  onClick={() => handleAddToWhitelist(item)}
                                  title="Add to Whitelist"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )
                        }
                      })}
                  </div>
                )}
                
                {hasMoreVideos && (
                  <div className="text-center py-6 col-span-full">
                    {!autoLoadMore && (
                      <div className="text-sm text-muted-foreground mb-2">
                        Auto-loading is disabled. Click button below to load more videos.
                      </div>
                    )}
                    <Button
                      onClick={() => handleSearch(true)}
                      disabled={loadingMore}
                      variant="outline"
                      className="w-full sm:w-auto px-4 py-2"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          <span className="hidden sm:inline">Loading more...</span>
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
              <div className="text-center py-8 sm:py-12 text-muted-foreground">
                <Search className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg sm:text-xl font-medium mb-2">Search for Videos</p>
                <p className="text-sm sm:text-base">Enter a search query above to find YouTube videos</p>
              </div>
            )}
          </div>
        )

      case 'player':
        return (
          <div className="space-y-6">
            {selectedVideo ? (
              <>
                {/* Video Note Component - Video Player */}
                <VideoNoteComponent 
                  videoId={selectedVideo.videoId || selectedVideo.id} 
                  videoTitle={selectedVideo.title}
                  channelName={getChannelName(selectedVideo)}
                  channelThumbnail={getChannelThumbnailUrl(selectedVideo.channel || selectedVideo)}
                  viewCount={selectedVideo.viewCount}
                  publishedAt={selectedVideo.publishedAt}
                  thumbnail={getThumbnailUrl(selectedVideo)}
                  description={selectedVideo.description}
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
                <p>Search for videos from the Search tab, then select any video to start watching and creating notes</p>
              </div>
            )}
          </div>
        )

      case 'channels':
        return <ChannelsContainer 
          onChannelSelect={handleChannelSelect}
          onAddToBlacklist={handleAddToBlacklist}
          onAddToWhitelist={handleAddToWhitelist}
          isBlacklisted={(channelId) => blacklisted.some(item => item.itemId === channelId && item.type === 'channel')}
          isWhitelisted={(channelId) => whitelisted.some(item => item.itemId === channelId && item.type === 'channel')}
        />

      case 'favorites':
        return <FavoritesContainer onVideoPlay={handleFavoritesVideoPlay} />

      case 'watched':
        return <WatchedHistoryContainer onVideoPlay={handleWatchedVideoPlay} />

      case 'notes':
        return <NotesContainer 
          videoData={selectedVideo ? {
            videoId: selectedVideo.videoId,
            title: selectedVideo.title,
            channelName: selectedVideo.channelName,
            thumbnail: selectedVideo.thumbnail
          } : undefined}
          onVideoPlay={handleNotesVideoPlay}
          onAddToNotebook={handleAddNoteToNotebook}
        />

      case 'notebooks':
        return showNotebookView && selectedNotebook ? (
          <>
            <NotebookView
              notebook={selectedNotebook}
              notes={notebookNotes}
              onBack={handleBackToNotebooks}
              onNotePlay={handleVideoPlay}
              onNoteEdit={handleEditNote}
              onNoteUnlink={async (noteId: string, notebookId: string) => {
                try {
                  const response = await fetch(`/api/notes/${noteId}/notebooks/${notebookId}`, {
                    method: 'DELETE'
                  })
                  const data = await response.json()
                  if (data.success) {
                    // Refresh notebook notes
                    const notesResponse = await fetch(`/api/notebooks/${notebookId}/notes`)
                    const notesData = await notesResponse.json()
                    if (notesData.success) {
                      setNotebookNotes(notesData.notes)
                    }
                  } else {
                    alert('Failed to unlink note: ' + data.error)
                  }
                } catch (error) {
                  alert('Error unlinking note: ' + error)
                }
              }}
              onShare={handleNotebookShare}
              onNoteCreate={handleCreateNoteForNotebook}
            />
            
            <ShareNotebookDialog
              open={shareNotebookDialogOpen}
              onOpenChange={setShareNotebookDialogOpen}
              notebook={selectedNotebook}
              noteCount={notebookNotes.length}
            />
          </>
        ) : (
          <NotebooksContainer 
            onNotebookSelect={handleNotebookSelect}
            onAddNoteToNotebook={handleAddNoteToNotebook}
            notesForSelection={notesForNotebook}
          />
        )

      {/* Edit Note Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[500px] mx-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Edit className="w-5 h-5 sm:w-6 sm:h-6" />
              Edit Note
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Edit the title and content of your note
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {editingNote && (
              <>
                <div className="space-y-2">
                  <label htmlFor="note-title" className="text-sm font-medium">
                    Note Title
                  </label>
                  <Input
                    id="note-title"
                    value={updatedNoteTitle}
                    onChange={(e) => setUpdatedNoteTitle(e.target.value)}
                    placeholder="Enter note title..."
                    className="w-full"
                  />
                </div>
                
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
                setUpdatedNoteTitle('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNoteUpdate}
              disabled={!updatedNoteTitle.trim() || !updatedNoteContent.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Note Dialog */}
      <Dialog open={createNoteDialogOpen} onOpenChange={setCreateNoteDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[500px] mx-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
              Create New Note
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Create a new note for the current video
            </DialogDescription>
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

      case 'settings':
        return (
          <SettingsContainerEnhanced
            autoLoadMore={autoLoadMore}
            setAutoLoadMore={setAutoLoadMore}
            favoritesEnabled={favoritesEnabled}
            setFavoritesEnabled={setFavoritesEnabled}
            favoritesPaused={favoritesPaused}
            setFavoritesPaused={setFavoritesPaused}
            favoriteChannels={favoriteChannels}
            favoriteVideos={favoriteVideos}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            loading={loading}
            onClearAllData={clearAllData}
            dataStatistics={dataStatistics}
            fetchDataStatistics={fetchDataStatistics}
          />
        )

      default:
        return null
    }
  }

  if (showSplashScreen) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return (
    <div className={`h-screen bg-background flex flex-col overflow-hidden touch-manipulation ${
      isIncognito ? 'incognito-mode' : ''
    }`}>
      {/* Incognito Banner */}
      <IncognitoBannerEnhanced />
      
      {/* Header - Always Visible */}
      <header className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50 shadow-sm flex-shrink-0 sticky-support">
        <div className="w-full px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-12 sm:h-14 md:h-16">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Back Button */}
              {canGoBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGoBack}
                  className="h-11 w-11 min-h-[44px] min-w-[44px] p-0 transition-all duration-200 hover:scale-105 hover:bg-muted/50 text-muted-foreground hover:text-foreground touch-manipulation mobile-touch-feedback"
                  title="Go back"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              )}
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gradient-to-r from-red-600 to-red-500 rounded-lg flex items-center justify-center">
                <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" />
              </div>
              <h1 className="text-base sm:text-lg md:text-xl font-bold">MyTube</h1>
              
              {/* Background Playback Indicator */}
              {backgroundVideo && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full border border-border">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-foreground truncate max-w-32">
                    {backgroundVideo.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isBackgroundPlaying ? pauseBackgroundVideo : stopBackgroundVideo}
                    className="h-6 w-6 p-0 text-primary hover:text-primary/80 hover:bg-muted"
                    title={isBackgroundPlaying ? "Pause background video" : "Stop background video"}
                  >
                    {isBackgroundPlaying ? <Pause className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  </Button>
                </div>
              )}
              
              {/* Network Status Indicator */}
              {networkStatus === 'offline' && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-destructive/10 dark:bg-destructive/30 rounded-full border border-destructive/20 dark:border-destructive/80">
                  <div className="w-2 h-2 bg-destructive rounded-full"></div>
                  <span className="text-xs font-medium text-destructive dark:text-destructive-foreground">
                    Offline
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={retryLoadingAllData}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive/70 hover:bg-destructive/10 dark:hover:bg-destructive/50"
                    title="Retry connection"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
              )}
              
              {networkStatus === 'checking' && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/30 rounded-full border border-yellow-200 dark:border-yellow-800">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                    Checking...
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="md:hidden h-11 w-11 min-h-[44px] min-w-[44px] p-0 transition-all duration-200 hover:scale-105 hover:bg-muted/50 text-muted-foreground hover:text-foreground touch-manipulation mobile-touch-feedback"
                title="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 transition-transform duration-200" />
                ) : (
                  <Menu className="w-5 h-5 transition-transform duration-200" />
                )}
              </Button>
              
              <ThemeSwitch />
              <QuickSettings />
              <IncognitoToggleEnhanced />
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
            <div className="w-full px-3 sm:px-4 py-4">
              <nav className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="navigation" aria-label="Main navigation">
                {tabs.map((tab, index) => {
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabNavigationWithMobileMenu(tab.id)}
                      className={`group relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 ease-out min-h-[60px] touch-manipulation mobile-touch-feedback ${
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


      {/* Desktop Tabs Bar - Visible on desktop only */}
      <div className="hidden md:block bg-background/95 backdrop-blur-xl border-b border-border/50 sticky top-16 z-30 shadow-lg shadow-black/5 dark:shadow-black/20 sticky-support">
        <div className="w-full px-4 sm:px-6 lg:px-8">
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
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
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
      <div className="hidden sm:block md:hidden bg-background/95 backdrop-blur-xl border-b border-border/50 sticky top-16 z-30 shadow-md shadow-black/3 dark:shadow-black/15 sticky-support">
        <div className="w-full px-4 sm:px-6">
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
      <div className={`md:hidden fixed bottom-0 left-0 right-0 w-full bg-background/95 backdrop-blur-xl border-t border-border/50 z-40 shadow-2xl shadow-black/10 dark:shadow-black/40 transition-transform duration-300 ease-out ${
        mobileMenuOpen ? 'translate-y-0' : 'translate-y-0'
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
          
          <nav className="flex items-center justify-around py-2 w-full" role="navigation" aria-label="Main navigation">
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
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto scroll-smooth touch-pan-y w-full px-3 sm:px-4 lg:px-6 pt-4 sm:pt-6 pb-20 sm:pb-24 md:pt-16 md:pb-8 lg:pb-8">
          {dynamicLoadingMessage && (
          <div className="mb-6 p-3 sm:p-4 bg-muted border border-border rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-foreground">{dynamicLoadingMessage}</span>
            </div>
          </div>
        )}
        
        {renderContent()}
        </div>
      </main>

      {/* Enhanced Clear Data Dialog */}
      <Dialog open={showEnhancedClearData} onOpenChange={setShowEnhancedClearData}>
        <DialogContent className="max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
          <EnhancedClearData
            statistics={dataStatistics}
            onClearData={handleEnhancedClearData}
            onCancel={() => {
              setShowEnhancedClearData(false)
              setDataStatistics(null)
            }}
            loading={loading}
          />
        </DialogContent>
      </Dialog>

      {/* Legacy Clear Data Confirmation Dialog */}
      <Dialog open={showClearDataConfirmation} onOpenChange={setShowClearDataConfirmation}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[425px] mx-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2 text-destructive text-lg sm:text-xl">
              <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
              Confirm Clear All Data
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              This action will permanently delete all your data and cannot be undone
            </DialogDescription>
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
                  <strong>Total items to be deleted:</strong> {favoriteChannels.length + (favoritesEnabled ? favoriteVideos.length : 0)} database records + all local data
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

      {/* Confirmation Dialog for Blacklist/Whitelist Actions */}
      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && handleCancelAction()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirmDialog.type === 'blacklist' ? (
                <>
                  <X className="w-5 h-5 text-destructive" />
                  Block {confirmDialog.itemType.charAt(0).toUpperCase() + confirmDialog.itemType.slice(1)}
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 text-green-600" />
                  Allow {confirmDialog.itemType.charAt(0).toUpperCase() + confirmDialog.itemType.slice(1)}
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {confirmDialog.type === 'blacklist' ? 'block' : 'allow'} the {confirmDialog.itemType} "{confirmDialog.itemTitle}"?
              {confirmDialog.type === 'blacklist' && (
                <span className="block mt-2 text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ Blocked items will be hidden from search results and recommendations.
                </span>
              )}
              {confirmDialog.type === 'whitelist' && (
                <span className="block mt-2 text-sm text-green-600 dark:text-green-400">
                  ✓ Whitelisted items will always appear in search results.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelAction}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmAction}
              className={confirmDialog.type === 'blacklist' ? 'bg-destructive hover:bg-destructive/90' : 'bg-green-600 hover:bg-green-700'}
            >
              {confirmDialog.type === 'blacklist' ? 'Block' : 'Allow'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}