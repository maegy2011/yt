'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Home, 
  Search, 
  Play, 
  Clock, 
  Heart, 
  FileText, 
  User, 
  Check,
  Loader2,
  Edit,
  ArrowLeft,
  Settings
} from 'lucide-react'
import { searchVideos, formatViewCount, formatPublishedAt, formatDuration } from '@/lib/youtube'
import { getLoadingMessage, getConfirmationMessage, confirmationMessages } from '@/lib/loading-messages'
import type { Video, Channel } from '@/lib/youtube'
import { VideoCardSkeleton, VideoGridSkeleton } from '@/components/video-skeleton'
import { SplashScreen } from '@/components/splash-screen'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'

// Safe JSON parsing utility
const safeJsonParse = async (response: Response): Promise<any> => {
  try {
    const text = await response.text()
    
    // Check if response is empty
    if (!text.trim()) {
      console.warn('Empty response received')
      return {}
    }
    
    // Try to parse JSON
    return JSON.parse(text)
  } catch (error) {
    console.error('JSON parsing error:', error)
    // Try to get the response text for debugging (without clone to avoid issues)
    try {
      const responseClone = response.clone()
      const text = await responseClone.text()
      console.error('Response text that failed to parse:', text.substring(0, 200) + (text.length > 200 ? '...' : ''))
    } catch (cloneError) {
      console.error('Could not read response text for debugging:', cloneError)
    }
    return {}
  }
}

// Enhanced types with better safety
type Tab = 'home' | 'search' | 'player' | 'watched' | 'channels' | 'explore' | 'notes' | 'favorites' | 'config'

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
  isFollowed?: boolean
}

interface VideoNote extends BaseVideoData {
  note: string
  fontSize: number
  isArchived: boolean
}

interface SearchResults {
  items: Video[]
  error?: string
}

export default function MyTubeApp() {
  const { toast } = useToast()
  
  // Core state
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [previousTab, setPreviousTab] = useState<Tab>('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [watchedVideosFilter, setWatchedVideosFilter] = useState('') // Separate filter for watched videos
  const [channelSearchQuery, setChannelSearchQuery] = useState('') // Separate search for channels
  const [discoverChannelsQuery, setDiscoverChannelsQuery] = useState('') // Search for discovering channels
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string | null>(null) // Filter by channel on homepage
  const [discoveredChannels, setDiscoveredChannels] = useState<any[]>([]) // Store discovered channels
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [multiSelectMode, setMultiSelectMode] = useState(false)
  const [showSplashScreen, setShowSplashScreen] = useState(true)
  const [dynamicLoadingMessage, setDynamicLoadingMessage] = useState('')
  
  // Data states
  const [watchedVideos, setWatchedVideos] = useState<WatchedVideo[]>([])
  const [favoriteChannels, setFavoriteChannels] = useState<FavoriteChannel[]>([])
  const [favoriteVideos, setFavoriteVideos] = useState<FavoriteVideo[]>([])
  const [recentVideosFromChannels, setRecentVideosFromChannels] = useState<Video[]>([])
  const [videoNotes, setVideoNotes] = useState<VideoNote[]>([])
  
  // Infinite scroll states
  const [continuationToken, setContinuationToken] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMoreVideos, setHasMoreVideos] = useState(false)
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>('') // Track the query for pagination
  
  // Search cache
  const [searchCache, setSearchCache] = useState<Map<string, { items: Video[], continuation: string | null, hasMore: boolean, timestamp: number }>>(new Map())
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache
  
  // Dialog states
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [currentNote, setCurrentNote] = useState('')
  const [currentNoteVideo, setCurrentNoteVideo] = useState<Video | null>(null)
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null)
  const [noteFontSize, setNoteFontSize] = useState(16)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)

  // Enhanced toast system with dynamic messages
  const showToast = useCallback((title: string, description?: string, variant: 'success' | 'destructive' | 'info' = 'info') => {
    toast({
      title,
      description,
      variant,
    })
  }, [toast])

  // Show dynamic loading message
  const showDynamicLoading = useCallback((operation: 'search' | 'loadMore' | 'favorites' | 'notes' | 'channels' | 'explore' | 'general') => {
    const message = getLoadingMessage(operation)
    setDynamicLoadingMessage(message)
    return message
  }, [])

  // Show dynamic confirmation message
  const showDynamicConfirmation = useCallback((operation: keyof typeof confirmationMessages, ...args: any[]) => {
    const message = getConfirmationMessage(operation, ...args)
    showToast('Success!', message, 'success')
    setDynamicLoadingMessage('')
  }, [showToast, getConfirmationMessage])

  // Data loading functions
  const loadWatchedVideos = async (): Promise<void> => {
    try {
      const response = await fetch('/api/watched')
      if (!response.ok) throw new Error('Failed to fetch watched videos')
      const data = await safeJsonParse(response)
      setWatchedVideos(data || [])
    } catch (error) {
      console.error('Failed to load watched videos:', error)
      setWatchedVideos([])
    }
  }

  const loadRecentVideosFromChannels = async (): Promise<void> => {
    try {
      const response = await fetch('/api/channels/recent')
      if (response.ok) {
        const data = await safeJsonParse(response)
        setRecentVideosFromChannels(data.videos || [])
      }
    } catch (error) {
      console.error('Failed to load recent videos from channels:', error)
      setRecentVideosFromChannels([])
    }
  }

  const loadFavoriteChannels = async (): Promise<void> => {
    try {
      const response = await fetch('/api/channels')
      if (!response.ok) throw new Error('Failed to fetch favorite channels')
      const data = await safeJsonParse(response)
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
      const data = await safeJsonParse(response)
      setFavoriteVideos(data || [])
    } catch (error) {
      console.error('Failed to load favorite videos:', error)
      setFavoriteVideos([])
    }
  }

  const loadVideoNotes = async (): Promise<void> => {
    try {
      const response = await fetch('/api/notes')
      if (!response.ok) throw new Error('Failed to fetch video notes')
      const data = await safeJsonParse(response)
      setVideoNotes((data || []).filter((note: VideoNote) => !note.isArchived))
    } catch (error) {
      console.error('Failed to load video notes:', error)
      setVideoNotes([])
    }
  }

  // Refresh all related data when notes are updated
  const refreshRelatedData = async (): Promise<void> => {
    await Promise.all([
      loadVideoNotes(),
      loadFavoriteVideos(),
      loadWatchedVideos() // Refresh watched videos to show updated notes/favorites
    ])
  }

  // Handle splash screen completion
  const handleSplashComplete = useCallback(() => {
    setShowSplashScreen(false)
    showToast('Welcome!', 'MyTube is ready to use', 'success')
  }, [showToast])

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await refreshRelatedData()
        await loadFavoriteChannels()
        await loadRecentVideosFromChannels()
      } catch (error) {
        showToast('Failed to load initial data', 'Please refresh the page', 'destructive')
      }
    }
    
    // Only load initial data after splash screen is complete
    if (!showSplashScreen) {
      loadInitialData()
    }
  }, [showSplashScreen, refreshRelatedData, loadFavoriteChannels, loadRecentVideosFromChannels, showToast])

  // Refresh watched videos when notes or favorites change to ensure status indicators are always up-to-date
  useEffect(() => {
    if (watchedVideos.length > 0) {
      // Only refresh if we have watched videos and notes/favorites have changed
      const timer = setTimeout(() => {
        loadWatchedVideos()
      }, 500) // Small delay to avoid excessive calls
      
      return () => clearTimeout(timer)
    }
  }, [videoNotes.length, favoriteVideos.length, loadWatchedVideos])

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
    }, CACHE_DURATION) // Clean up every cache duration
    
    return () => clearInterval(cleanupInterval)
  }, [clearExpiredCache])

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
      
      // Only handle horizontal swipes with limited vertical movement
      if (Math.abs(swipeDistance) > minSwipeDistance && verticalDistance < maxVerticalDistance) {
        const tabs: Tab[] = ['home', 'search', 'player', 'watched', 'channels', 'explore', 'notes', 'favorites', 'config']
        const currentIndex = tabs.indexOf(activeTab)
        
        if (swipeDistance > 0) {
          // Swipe right - go to previous tab
          if (currentIndex > 0) {
            const newTab = tabs[currentIndex - 1]
            setActiveTab(newTab)
            showToast('Tab Navigation', `Switched to ${newTab}`, 'info')
          }
        } else {
          // Swipe left - go to next tab
          if (currentIndex < tabs.length - 1) {
            const newTab = tabs[currentIndex + 1]
            setActiveTab(newTab)
            showToast('Tab Navigation', `Switched to ${newTab}`, 'info')
          }
        }
      }
    }

    // Add touch event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    // Cleanup
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [activeTab, showToast])

  // Keyboard navigation for tabs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard navigation when not in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const tabs: Tab[] = ['home', 'search', 'player', 'watched', 'channels', 'explore', 'notes', 'favorites', 'config']
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

  // Safe thumbnail extraction
  const getThumbnailUrl = useCallback((video: Video | any): string => {
    if (video.thumbnail?.url) return video.thumbnail.url
    if (video.thumbnail) return video.thumbnail
    if (video.id) return `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`
    return '/placeholder-video.png'
  }, [])

  // Safe channel name extraction
  const getChannelName = useCallback((video: Video | any): string => {
    return video.channel?.name || video.channelName || 'Unknown Channel'
  }, [])

  const handleSearch = async (append: boolean = false) => {
    const trimmedQuery = searchQuery.trim()
    
    // Safety check for pagination
    if (append && !currentSearchQuery.trim()) {
      setHasMoreVideos(false)
      return
    }
    
    if (!trimmedQuery && !append) {
      showToast('Search Query Required', 'Please enter a search query', 'info')
      return
    }
    
    if (!append) {
      // New search - validate and set new query
      if (!trimmedQuery) {
        showToast('Search Query Required', 'Please enter a search query', 'info')
        return
      }
      
      // Check cache first for new searches
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
      setCurrentSearchQuery(trimmedQuery) // Set the current search query for pagination
    } else {
      // Pagination - always use stored query
      setLoadingMore(true)
      showDynamicLoading('loadMore')
      if (!currentSearchQuery) {
        setHasMoreVideos(false)
        setDynamicLoadingMessage('')
        return
      }
    }
    
    try {
      // Always use currentSearchQuery for pagination, new query for initial search
      const queryToUse = append ? currentSearchQuery : trimmedQuery
      // Search for channels when in explore tab, videos otherwise
      const searchType = activeTab === 'explore' ? 'channel' : 'video'
      const params = new URLSearchParams({
        query: queryToUse,
        type: searchType
      })
      
      // Add continuation token if loading more
      if (append && continuationToken) {
        params.append('continuation', continuationToken)
      }

      const response = await fetch(`/api/youtube/search?${params}`)
      if (!response.ok) {
        throw new Error(`Failed to search ${searchType}s`)
      }

      const data = await safeJsonParse(response)
      
      if (data.error) {
        showToast('Search Error', data.error, 'destructive')
        if (!append) setSearchResults(null)
        return
      }
      
      if (!data.items || data.items.length === 0) {
        if (!append) {
          const itemType = searchType === 'channel' ? 'channels' : 'videos'
          showToast('No Results', `No ${itemType} found for "${queryToUse}"`, 'info')
          setSearchResults({ items: [] })
          // Cache empty results
          setCachedResults(queryToUse, [], null, false)
        } else {
          const itemType = searchType === 'channel' ? 'channels' : 'videos'
          showToast(`No More ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`, `No more ${itemType} found for this search`, 'info')
        }
        setHasMoreVideos(false)
        return
      }
      
      // Ensure the returned data matches our expected query
      if (data.query && data.query !== queryToUse) {
        console.warn('Search query mismatch:', { 
          expected: queryToUse, 
          received: data.query 
        })
      }
      
      let finalItems: any[]
      if (append && searchResults?.items) {
        // Append new items to existing results
        const existingItemIds = new Set(searchResults?.items?.map(item => item.id) || [])
        const newItems = data.items.filter((item: any) => !existingItemIds.has(item.id))
        
        if (newItems.length > 0) {
          finalItems = [...searchResults.items, ...newItems]
          setSearchResults({
            items: finalItems
          })
          showDynamicConfirmation('search', finalItems.length)
        } else {
          if (data.items.length === 0) {
            // No items returned from continuation - likely reached the end
            const itemType = searchType === 'channel' ? 'Channels' : 'Videos'
            showToast(`No More ${itemType}`, 'You\'ve reached the end of the search results', 'info')
            setHasMoreVideos(false)
          } else {
            // All returned items were duplicates
            const itemType = searchType === 'channel' ? 'Channels' : 'Videos'
            showToast(`No New ${itemType}`, 'All available items have been loaded', 'info')
          }
          finalItems = searchResults.items
        }
      } else {
        // Replace with new search results
        finalItems = data.items
        setSearchResults(data)
        showDynamicConfirmation('search', finalItems.length)
      }
      
      // Update pagination state
      setContinuationToken(data.continuation)
      setHasMoreVideos(data.hasMore !== false && !!data.continuation)
      
      // Cache the results (only cache initial searches, not pagination)
      if (!append) {
        setCachedResults(queryToUse, finalItems, data.continuation, data.hasMore !== false && !!data.continuation)
      }
      
      console.log('Search state updated:', {
        query: queryToUse,
        isPagination: append,
        totalVideos: finalItems.length,
        newVideosLoaded: append ? data.items?.length || 0 : 0,
        hasMore: data.hasMore,
        hasContinuation: !!data.continuation,
        page: data.page,
        cached: !append && getCachedResults(queryToUse) !== null
      })
      
    } catch (error) {
      showToast('Search Failed', 'Search failed. Please try again.', 'destructive')
      console.error('Search error:', error)
      if (!append) setSearchResults(null)
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setDynamicLoadingMessage('')
    }
  }

  const handleChannelSearch = async () => {
    const trimmedQuery = discoverChannelsQuery.trim()
    
    if (!trimmedQuery) {
      showToast('Search Query Required', 'Please enter a channel name to search', 'info')
      return
    }
    
    setLoading(true)
    showDynamicLoading('explore')
    
    try {
      const params = new URLSearchParams({
        query: trimmedQuery,
        type: 'channel'
      })

      const response = await fetch(`/api/youtube/search?${params}`)
      if (!response.ok) {
        throw new Error('Failed to search channels')
      }

      const data = await safeJsonParse(response)
      
      if (data.error) {
        showToast('Search Error', data.error, 'destructive')
        setDiscoveredChannels([])
        return
      }
      
      if (!data.items || data.items.length === 0) {
        showToast('No Results', `No channels found for "${trimmedQuery}"`, 'info')
        setDiscoveredChannels([])
        return
      }
      
      setDiscoveredChannels(data.items)
      showToast('Channels Found', `Found ${data.items.length} channel${data.items.length > 1 ? 's' : ''}`, 'success')
      console.log('Channel search results:', data.items)
      
    } catch (error) {
      showToast('Search Failed', 'Channel search failed. Please try again.', 'destructive')
      console.error('Channel search error:', error)
      setDiscoveredChannels([])
    } finally {
      setLoading(false)
      setDynamicLoadingMessage('')
    }
  }

  const loadMoreVideos = useCallback(async () => {
    if (!hasMoreVideos || loadingMore || loading) {
      console.log('Load more blocked:', { hasMoreVideos, loadingMore, loading })
      return
    }
    
    if (!continuationToken) {
      console.log('No continuation token available')
      setHasMoreVideos(false)
      return
    }
    
    if (!currentSearchQuery.trim()) {
      console.log('No current search query available')
      return
    }
    
    // Check if we have cached continuation data
    const cachedResults = getCachedResults(currentSearchQuery)
    if (cachedResults && cachedResults.continuation === continuationToken && cachedResults.items.length > (searchResults?.items?.length || 0)) {
      console.log('Using cached continuation data')
      const newItems = cachedResults.items.slice(searchResults!.items.length)
      setSearchResults({
        items: [...searchResults!.items, ...newItems]
      })
      setContinuationToken(cachedResults.continuation)
      setHasMoreVideos(cachedResults.hasMore)
      showToast('More Videos Loaded', `Loaded ${newItems.length} cached videos`, 'success')
      return
    }
    
    console.log('Triggering load more videos for query:', currentSearchQuery)
    await handleSearch(true)
  }, [hasMoreVideos, loadingMore, loading, continuationToken, currentSearchQuery, searchResults, getCachedResults])

  // Infinite scroll using Intersection Observer
  useEffect(() => {
    if (activeTab !== 'search') return

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting && hasMoreVideos && !loadingMore && !loading) {
          console.log('Scroll sentinel detected, loading more videos')
          loadMoreVideos()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '200px' // Increased margin for earlier loading
      }
    )

    const sentinel = document.getElementById('scroll-sentinel')
    if (sentinel) {
      observer.observe(sentinel)
      console.log('Scroll sentinel observer attached')
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel)
        console.log('Scroll sentinel observer detached')
      }
    }
  }, [activeTab, hasMoreVideos, loadingMore, loading, loadMoreVideos])

  // Helper function to extract the correct YouTube video ID from various video object structures
  const extractYouTubeVideoId = useCallback((video: Video | any): string => {
    // Handle different video object structures that might come from different sources
    let youtubeVideoId = video.id
    
    // If the video has a videoId property (from watched videos), use that instead
    if (video.videoId && video.videoId !== video.id) {
      youtubeVideoId = video.videoId
    }
    
    // Validate that the ID looks like a YouTube video ID (not a database cuid)
    // YouTube video IDs are typically 11 characters and contain alphanumeric characters, hyphens, and underscores
    if (youtubeVideoId && 
        typeof youtubeVideoId === 'string' && 
        youtubeVideoId.length >= 10 && 
        youtubeVideoId.length <= 12 && 
        /^[a-zA-Z0-9_-]+$/.test(youtubeVideoId) &&
        !youtubeVideoId.includes('test') && // Filter out test IDs
        !youtubeVideoId.match(/^\d+$/)) { // Filter out numeric-only IDs
      // This looks like a valid YouTube video ID
      return youtubeVideoId
    } else {
      // Try to extract from thumbnail URL as fallback
      const thumbnailUrl = getThumbnailUrl(video)
      const thumbnailMatch = thumbnailUrl.match(/\/vi\/([^\/\?]+)/)
      if (thumbnailMatch && thumbnailMatch[1]) {
        const extractedId = thumbnailMatch[1]
        // Validate the extracted ID
        if (extractedId.length >= 10 && 
            extractedId.length <= 12 && 
            /^[a-zA-Z0-9_-]+$/.test(extractedId) &&
            !extractedId.includes('test') &&
            !extractedId.match(/^\d+$/)) {
          return extractedId
        }
      }
      
      // If it's a database ID (longer than 11 chars), try to extract from other properties
      if (video.videoId && 
          typeof video.videoId === 'string' &&
          video.videoId.length >= 10 && 
          video.videoId.length <= 12 && 
          /^[a-zA-Z0-9_-]+$/.test(video.videoId) &&
          !video.videoId.includes('test') &&
          !video.videoId.match(/^\d+$/)) {
        return video.videoId
      }
      
      // Final fallback: return empty string to prevent crashes
      // This prevents playing invalid videos but doesn't crash the app
      return ''
    }
  }, [getThumbnailUrl])

  const handleVideoPlay = async (video: Video) => {
    setSelectedVideo(video)
    setPreviousTab(activeTab) // Store the current tab before switching to player
    setActiveTab('player')
    
    // Add to watched videos
    try {
      const thumbnailUrl = getThumbnailUrl(video)
      const youtubeVideoId = extractYouTubeVideoId(video)
      
      // Only add to watched if we have a valid YouTube video ID
      if (youtubeVideoId) {
        await fetch('/api/watched', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: youtubeVideoId,
            title: video.title,
            channelName: getChannelName(video),
            thumbnail: thumbnailUrl,
            duration: video.duration,
            viewCount: video.viewCount
          })
        })
      }
      await loadWatchedVideos()
    } catch (error) {
      console.error('Failed to add to watched:', error)
      showToast('Tracking Failed', 'Failed to track video', 'destructive')
    }
  }

  const handleBackToPrevious = () => {
    setActiveTab(previousTab)
    setSelectedVideo(null)
  }

  const toggleFavorite = async (video: Video) => {
    try {
      const youtubeVideoId = extractYouTubeVideoId(video)
      
      // Only proceed if we have a valid YouTube video ID
      if (!youtubeVideoId) {
        showToast('Invalid Video', 'Cannot favorite invalid video', 'destructive')
        return
      }
      
      const isFavorite = favoriteVideoIds.has(youtubeVideoId)
      const thumbnailUrl = getThumbnailUrl(video)
      
      if (isFavorite) {
        // Remove from favorites
        showDynamicLoading('favorites')
        const response = await fetch(`/api/favorites/${youtubeVideoId}`, { 
          method: 'DELETE' 
        })
        
        if (response.ok) {
          showDynamicConfirmation('favorites', 'remove')
          // Immediately update the local state to provide instant feedback
          setFavoriteVideos(prev => prev.filter(fav => fav.videoId !== youtubeVideoId))
          // Then refresh from server to ensure consistency
          await refreshRelatedData()
        } else {
          const errorData = await safeJsonParse(response)
          console.error('Delete failed:', errorData)
          showToast('Failed to Remove', errorData.error || 'Failed to remove from favorites', 'destructive')
        }
      } else {
        // Add to favorites
        showDynamicLoading('favorites')
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: youtubeVideoId,
            title: video.title,
            channelName: getChannelName(video),
            thumbnail: thumbnailUrl,
            duration: video.duration,
            viewCount: video.viewCount
          })
        })
        
        if (response.ok) {
          showDynamicConfirmation('favorites', 'add')
          await refreshRelatedData()
        } else {
          const errorData = await safeJsonParse(response)
          if (errorData.error === 'Already exists') {
            showToast('Already in Favorites', 'Video already in your favorites', 'info')
            // Sync local state if it was already favorited
            await refreshRelatedData()
          } else {
            console.error('Add failed:', errorData)
            showToast('Failed to Add', errorData.error || 'Failed to add to favorites', 'destructive')
          }
        }
      }
    } catch (error) {
      console.error('Favorite toggle error:', error)
      showToast('Error', 'Failed to update favorites', 'destructive')
    } finally {
      setDynamicLoadingMessage('')
    }
  }

  const toggleFavoriteChannel = async (channel: Channel) => {
    try {
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: channel.id,
          name: channel.name,
          thumbnail: channel.thumbnail?.url,
          subscriberCount: channel.subscriberCount || 0
        })
      })
      
      if (response.ok) {
        showToast('Channel Added', 'Channel added to favorites', 'success')
        await loadFavoriteChannels()
        await loadRecentVideosFromChannels()
      } else {
        const data = await safeJsonParse(response)
        if (data.error === 'Already exists') {
          await fetch(`/api/channels/${channel.id}`, { method: 'DELETE' })
          showToast('Channel Removed', 'Channel removed from favorites', 'info')
          await loadFavoriteChannels()
          await loadRecentVideosFromChannels()
        }
      }
    } catch (error) {
      showToast('Error', 'Failed to update channel favorites', 'destructive')
      console.error('Channel favorite error:', error)
    }
  }

  const addNote = async () => {
    if (!currentNoteVideo || !currentNote.trim()) {
      showToast('Note Required', 'Please enter a note', 'info')
      return
    }
    
    try {
      const thumbnailUrl = getThumbnailUrl(currentNoteVideo)
      
      if (currentNoteId) {
        // Update existing note
        const response = await fetch(`/api/notes/${currentNoteId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            note: currentNote,
            fontSize: noteFontSize
          })
        })
        
        if (response.ok) {
          showToast('Note Updated', 'Note updated successfully', 'success')
        } else {
          showToast('Update Failed', 'Failed to update note', 'destructive')
          return
        }
      } else {
        // Create new note
        const youtubeVideoId = extractYouTubeVideoId(currentNoteVideo)
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: youtubeVideoId,
            title: currentNoteVideo.title,
            channelName: getChannelName(currentNoteVideo),
            thumbnail: thumbnailUrl,
            note: currentNote,
            fontSize: noteFontSize
          })
        })
        
        if (response.ok) {
          showToast('Note Added', 'Note added successfully', 'success')
        } else {
          showToast('Add Failed', 'Failed to add note', 'destructive')
          return
        }
      }
      
      setNoteDialogOpen(false)
      setCurrentNote('')
      setCurrentNoteVideo(null)
      setCurrentNoteId(null)
      await refreshRelatedData()
    } catch (error) {
      showToast('Save Failed', 'Failed to save note', 'destructive')
      console.error('Save note error:', error)
    }
  }

  const deleteNote = async (noteId: string) => {
    setNoteToDelete(noteId)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return
    
    try {
      showDynamicLoading('notes')
      const response = await fetch(`/api/notes/${noteToDelete}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        showDynamicConfirmation('notes', 'delete')
        await refreshRelatedData()
        setDeleteConfirmOpen(false)
        setNoteToDelete(null)
      } else {
        const errorData = await safeJsonParse(response)
        showToast('Delete Failed', errorData.error || 'Failed to delete note', 'destructive')
      }
    } catch (error) {
      showToast('Error', 'Failed to delete note', 'destructive')
      console.error('Delete note error:', error)
    } finally {
      setDynamicLoadingMessage('')
    }
  }

  const editNote = (note: VideoNote) => {
    setCurrentNoteVideo({
      id: note.videoId,
      title: note.title,
      channelName: note.channelName,
      thumbnail: note.thumbnail,
      channel: { name: note.channelName }
    } as any)
    setCurrentNote(note.note)
    setCurrentNoteId(note.id)
    setNoteFontSize(note.fontSize)
    setNoteDialogOpen(true)
  }

  // Cleanup function to fix duplicate watched videos
  const cleanupWatchedVideos = async (): Promise<void> => {
    try {
      showDynamicLoading('general')
      const response = await fetch('/api/watched/cleanup', {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        showToast('Cleanup Complete', result.message, 'success')
        await loadWatchedVideos() // Reload the watched videos
      } else {
        const errorData = await safeJsonParse(response)
        showToast('Cleanup Failed', errorData.error || 'Failed to cleanup watched videos', 'destructive')
      }
    } catch (error) {
      console.error('Cleanup error:', error)
      showToast('Cleanup Error', 'Failed to cleanup watched videos', 'destructive')
    } finally {
      setDynamicLoadingMessage('')
    }
  }

  // Function to fix incorrect video IDs in watched videos
  const fixIncorrectVideoIds = async (): Promise<void> => {
    try {
      showDynamicLoading('general')
      const response = await fetch('/api/watched/fix-ids', {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        showToast('Fix Complete', result.message, 'success')
        await refreshRelatedData() // Reload all data
      } else {
        const errorData = await safeJsonParse(response)
        showToast('Fix Failed', errorData.error || 'Failed to fix video IDs', 'destructive')
      }
    } catch (error) {
      console.error('Fix error:', error)
      showToast('Fix Error', 'Failed to fix video IDs', 'destructive')
    } finally {
      setDynamicLoadingMessage('')
    }
  }

  // Helper function to check if a video has been watched
  const isVideoWatched = useCallback((videoId: string): boolean => {
    return watchedVideos.some(watched => watched.videoId === videoId)
  }, [watchedVideos])

  // Helper function to get notes for a specific video
  const getVideoNotes = useCallback((videoId: string): VideoNote[] => {
    return videoNotes.filter(note => note.videoId === videoId)
  }, [videoNotes])

  // Helper function to check if a video has any notes
  const hasVideoNotes = useCallback((videoId: string): boolean => {
    return videoNotes.some(note => note.videoId === videoId)
  }, [videoNotes])

  // Helper function to get the count of notes for a video
  const getVideoNotesCount = useCallback((videoId: string): number => {
    return videoNotes.filter(note => note.videoId === videoId).length
  }, [videoNotes])

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
    setMultiSelectMode(false)
  }, [])

  // Memoized computed values
  const favoriteVideoIds = useMemo(() => 
    new Set(favoriteVideos.map(fav => fav.videoId)), 
    [favoriteVideos]
  )

  const hasFavorites = useMemo(() => 
    favoriteVideos.length > 0 || favoriteChannels.length > 0,
    [favoriteVideos, favoriteChannels]
  )

  const tabs = useMemo(() => [
    { id: 'home' as Tab, icon: Home, label: 'Home' },
    { id: 'search' as Tab, icon: Search, label: 'Search' },
    { id: 'player' as Tab, icon: Play, label: 'Player' },
    { id: 'watched' as Tab, icon: Clock, label: 'Watched' },
    { id: 'channels' as Tab, icon: User, label: 'Channels' },
    { id: 'explore' as Tab, icon: Search, label: 'Explore' },
    { id: 'notes' as Tab, icon: FileText, label: 'Notes' },
    { id: 'favorites' as Tab, icon: Heart, label: 'Favorites' },
    { id: 'config' as Tab, icon: Settings, label: 'Config' },
  ], [])

  // Clear selection when switching tabs
  useEffect(() => {
    if (multiSelectMode) {
      clearSelection()
    }
  }, [activeTab, multiSelectMode, clearSelection])

  // Clear search queries when switching away from respective tabs
  useEffect(() => {
    if (activeTab !== 'search') {
      setSearchQuery('')
    }
    if (activeTab !== 'watched') {
      setWatchedVideosFilter('')
    }
  }, [activeTab])

  const VideoCard = useCallback(({ video, showActions = true }: { video: Video | any, showActions?: boolean }) => {
    const youtubeVideoId = extractYouTubeVideoId(video)
    const isFavorite = youtubeVideoId ? favoriteVideoIds.has(youtubeVideoId) : false
    const isWatched = youtubeVideoId ? isVideoWatched(youtubeVideoId) : false
    const isSelected = youtubeVideoId ? selectedItems.has(youtubeVideoId) : false
    const thumbnailUrl = getThumbnailUrl(video)
    const channelName = getChannelName(video)
    const hasNotes = youtubeVideoId ? hasVideoNotes(youtubeVideoId) : false
    const notesCount = youtubeVideoId ? getVideoNotesCount(youtubeVideoId) : 0
    const videoNotesList = youtubeVideoId ? getVideoNotes(youtubeVideoId) : []
    
    return (
      <Card className={`relative group hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}>
        <CardContent className="p-3">
          <div className="flex gap-3">
            {multiSelectMode && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleItemSelection(youtubeVideoId)}
                className="mt-1"
                aria-label={`Select video: ${video.title}`}
              />
            )}
            <div className="relative flex-shrink-0">
              <img
                src={thumbnailUrl}
                alt={video.title}
                className="w-32 h-24 object-cover rounded-lg bg-muted"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-video.png'
                }}
                loading="lazy"
              />
              {video.duration && (
                <Badge className="absolute bottom-1 right-1 text-xs bg-black/80" aria-label={`Duration: ${formatDuration(video.duration)}`}>
                  {formatDuration(video.duration)}
                </Badge>
              )}
              
              {/* Status Indicators */}
              <div className="absolute top-1 left-1 flex gap-1">
                {isWatched && (
                  <div 
                    className="bg-green-600 text-white rounded-full p-1" 
                    aria-label="Video watched"
                  >
                    <Clock className="w-3 h-3" />
                  </div>
                )}
                {isFavorite && (
                  <div 
                    className="bg-red-600 text-white rounded-full p-1" 
                    aria-label="Video favorited"
                  >
                    <Heart className="w-3 h-3 fill-current" />
                  </div>
                )}
              </div>
              
              {hasNotes && (
                <div 
                  className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-1 cursor-pointer hover:bg-blue-700 transition-colors" 
                  aria-label={`${notesCount} note${notesCount > 1 ? 's' : ''} - Click to view notes`}
                  onClick={() => {
                    setActiveTab('notes')
                    showToast('Notes Tab', `Viewing ${notesCount} note${notesCount > 1 ? 's' : ''} for "${video.title}"`, 'info')
                  }}
                >
                  <FileText className="w-3 h-3" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm line-clamp-2 mb-1" id={`video-title-${youtubeVideoId}`}>
                {video.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-1">{channelName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {video.viewCount && <span aria-label={`${video.viewCount} views`}>{formatViewCount(video.viewCount)}</span>}
                {video.publishedAt && <span aria-label={`Published ${formatPublishedAt(video.publishedAt)}`}>• {formatPublishedAt(video.publishedAt)}</span>}
                {hasNotes && <span aria-label={`${notesCount} note${notesCount > 1 ? 's' : ''}`} className="text-blue-600 font-medium">• {notesCount} note{notesCount > 1 ? 's' : ''}</span>}
              </div>
              
              {/* Show notes preview if available */}
              {hasNotes && videoNotesList.length > 0 && (
                <div 
                  className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors"
                  onClick={() => {
                    setActiveTab('notes')
                    showToast('Notes Tab', `Viewing ${notesCount} note${notesCount > 1 ? 's' : ''} for "${video.title}"`, 'info')
                  }}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <FileText className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      {notesCount} note{notesCount > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                    {videoNotesList[0].note.length > 60 
                      ? `${videoNotesList[0].note.substring(0, 60)}...` 
                      : videoNotesList[0].note}
                  </p>
                  {notesCount > 1 && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      +{notesCount - 1} more note{notesCount > 2 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}
              
              {showActions && (
                <div className="flex gap-1 mt-2" role="group" aria-label="Video actions">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const youtubeVideoId = extractYouTubeVideoId(video)
                      if (!youtubeVideoId) {
                        showToast('Invalid Video', 'Cannot play invalid video', 'destructive')
                        return
                      }
                      setPreviousTab(activeTab) // Set previous tab to current active tab
                      handleVideoPlay(video)
                    }}
                    className="h-7 px-2"
                    aria-label={`Play video: ${video.title}`}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Play
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleFavorite(video)}
                    className={`h-7 px-2 transition-colors ${isFavorite ? 'text-red-500 hover:text-red-600 bg-red-50 border-red-200' : 'hover:bg-accent'}`}
                    aria-label={`${isFavorite ? 'Remove from' : 'Add to'} favorites: ${video.title}`}
                  >
                    <Heart className={`w-3 h-3 transition-colors ${isFavorite ? 'fill-current text-red-500' : ''}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCurrentNoteVideo(video)
                      setNoteDialogOpen(true)
                    }}
                    className="h-7 px-2"
                    aria-label={`Add note for: ${video.title}`}
                  >
                    <FileText className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }, [favoriteVideoIds, selectedItems, multiSelectMode, getThumbnailUrl, getChannelName, toggleItemSelection, handleVideoPlay, toggleFavorite, hasVideoNotes, getVideoNotesCount, getVideoNotes, isVideoWatched, extractYouTubeVideoId, showToast])

  // Watched Video Card Component with date/time display
  const WatchedVideoCard = useCallback(({ video }: { video: WatchedVideo }) => {
    const isFavorite = favoriteVideoIds.has(video.videoId)
    const thumbnailUrl = getThumbnailUrl(video)
    const channelName = getChannelName(video)
    const hasNotes = hasVideoNotes(video.videoId)
    const notesCount = getVideoNotesCount(video.videoId)
    const videoNotesList = getVideoNotes(video.videoId)
    
    return (
      <Card className="relative group hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex gap-3">
            <div className="relative flex-shrink-0">
              <img
                src={thumbnailUrl}
                alt={video.title}
                className="w-32 h-24 object-cover rounded-lg bg-muted"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-video.png'
                }}
                loading="lazy"
              />
              {video.duration && (
                <Badge className="absolute bottom-1 right-1 text-xs bg-black/80" aria-label={`Duration: ${formatDuration(video.duration)}`}>
                  {formatDuration(video.duration)}
                </Badge>
              )}
              {hasNotes && (
                <div 
                  className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-1 cursor-pointer hover:bg-blue-700 transition-colors" 
                  aria-label={`${notesCount} note${notesCount > 1 ? 's' : ''} - Click to view notes`}
                  onClick={() => {
                    setActiveTab('notes')
                    showToast('Notes Tab', `Viewing ${notesCount} note${notesCount > 1 ? 's' : ''} for "${video.title}"`, 'info')
                  }}
                >
                  <FileText className="w-3 h-3" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm line-clamp-2 mb-1" id={`video-title-${video.id}`}>
                {video.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-1">{channelName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                {video.viewCount && <span aria-label={`${video.viewCount} views`}>{formatViewCount(video.viewCount)}</span>}
                <span aria-label={`Watched on ${new Date(video.watchedAt).toLocaleDateString()}`} className="text-blue-600 font-medium">
                  Watched {new Date(video.watchedAt).toLocaleDateString()}
                </span>
                <span aria-label={`Watched at ${new Date(video.watchedAt).toLocaleTimeString()}`} className="text-muted-foreground">
                  {new Date(video.watchedAt).toLocaleTimeString()}
                </span>
                {hasNotes && <span aria-label={`${notesCount} note${notesCount > 1 ? 's' : ''}`} className="text-blue-600 font-medium">• {notesCount} note{notesCount > 1 ? 's' : ''}</span>}
              </div>
              
              {/* Show notes preview if available */}
              {hasNotes && videoNotesList.length > 0 && (
                <div 
                  className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors"
                  onClick={() => {
                    setActiveTab('notes')
                    showToast('Notes Tab', `Viewing ${notesCount} note${notesCount > 1 ? 's' : ''} for "${video.title}"`, 'info')
                  }}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <FileText className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      {notesCount} note{notesCount > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                    {videoNotesList[0].note.length > 60 
                      ? `${videoNotesList[0].note.substring(0, 60)}...` 
                      : videoNotesList[0].note}
                  </p>
                  {notesCount > 1 && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      +{notesCount - 1} more note{notesCount > 2 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex gap-1 mt-2" role="group" aria-label="Video actions">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Create video object with proper ID for playback
                    const videoObject = {
                      id: video.videoId,
                      title: video.title,
                      channelName: video.channelName,
                      thumbnail: video.thumbnail,
                      duration: video.duration,
                      viewCount: video.viewCount,
                      channel: { name: video.channelName }
                    }
                    setPreviousTab('watched') // Set previous tab to watched
                    handleVideoPlay(videoObject as any)
                  }}
                  className="h-7 px-2"
                  aria-label={`Play video: ${video.title}`}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Play
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Create video object with proper ID for favorite toggle
                    const videoObject = {
                      id: video.videoId,
                      title: video.title,
                      channelName: video.channelName,
                      thumbnail: video.thumbnail,
                      duration: video.duration,
                      viewCount: video.viewCount,
                      channel: { name: video.channelName }
                    }
                    toggleFavorite(videoObject as any)
                  }}
                  className={`h-7 px-2 transition-colors ${isFavorite ? 'text-red-500 hover:text-red-600 bg-red-50 border-red-200' : 'hover:bg-accent'}`}
                  aria-label={`${isFavorite ? 'Remove from' : 'Add to'} favorites: ${video.title}`}
                >
                  <Heart className={`w-3 h-3 transition-colors ${isFavorite ? 'fill-current text-red-500' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCurrentNoteVideo({
                      id: video.videoId,
                      title: video.title,
                      channelName: video.channelName,
                      thumbnail: video.thumbnail,
                      duration: video.duration,
                      viewCount: video.viewCount,
                      channel: { name: video.channelName }
                    } as any)
                    setNoteDialogOpen(true)
                  }}
                  className="h-7 px-2"
                  aria-label={`Add note for: ${video.title}`}
                >
                  <FileText className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }, [favoriteVideoIds, getThumbnailUrl, getChannelName, handleVideoPlay, toggleFavorite, hasVideoNotes, getVideoNotesCount, getVideoNotes, showToast])

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Home</h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={multiSelectMode ? "default" : "outline"}
                  onClick={() => setMultiSelectMode(!multiSelectMode)}
                >
                  {multiSelectMode ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 border border-current rounded" />}
                </Button>
                {multiSelectMode && selectedItems.size > 0 && (
                  <Button size="sm" onClick={clearSelection}>
                    Clear ({selectedItems.size})
                  </Button>
                )}
              </div>
            </div>
            
            {/* Animated Followed Channels Bar */}
            {favoriteChannels.length > 0 && (
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-sm">Followed Channels</h3>
                  {selectedChannelFilter && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedChannelFilter(null)}
                      className="h-6 px-2 text-xs"
                    >
                      Clear Filter
                    </Button>
                  )}
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {favoriteChannels.map((channel) => (
                    <div
                      key={channel.id}
                      className={`flex flex-col items-center gap-2 cursor-pointer group transition-all duration-200 ${
                        selectedChannelFilter === channel.channelId ? 'scale-110' : 'hover:scale-105'
                      }`}
                      onClick={() => {
                        if (selectedChannelFilter === channel.channelId) {
                          setSelectedChannelFilter(null)
                        } else {
                          setSelectedChannelFilter(channel.channelId)
                        }
                      }}
                    >
                      <div className="relative">
                        <img
                          src={channel.thumbnail || '/placeholder-channel.png'}
                          alt={channel.name}
                          className={`w-12 h-12 rounded-full object-cover border-2 transition-all duration-200 ${
                            selectedChannelFilter === channel.channelId
                              ? 'border-primary ring-2 ring-primary/20'
                              : 'border-border group-hover:border-primary'
                          }`}
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-channel.png'
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className={`absolute -top-1 -right-1 w-5 h-5 p-0 rounded-full bg-background border-2 transition-all duration-200 ${
                            selectedChannelFilter === channel.channelId
                              ? 'border-red-500 text-red-500 hover:bg-red-50'
                              : 'border-muted-foreground/50 text-muted-foreground/50 hover:border-red-500 hover:text-red-500 hover:bg-red-50'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavoriteChannel({ 
                              id: channel.channelId, 
                              name: channel.name, 
                              thumbnail: channel.thumbnail ? { url: channel.thumbnail, width: 100, height: 100 } : undefined,
                              subscriberCount: channel.subscriberCount || 0,
                              videoCount: 0
                            })
                          }}
                          aria-label={`Unfollow ${channel.name}`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      </div>
                      <p className="text-xs text-center font-medium max-w-[60px] truncate">
                        {channel.name}
                      </p>
                    </div>
                  ))}
                </div>
                {selectedChannelFilter && (
                  <div className="mt-3 text-xs text-muted-foreground text-center">
                    Showing content from: {favoriteChannels.find(c => c.channelId === selectedChannelFilter)?.name}
                  </div>
                )}
              </div>
            )}
            
            {/* Quick Search */}
            <div className="flex gap-2">
              <Input
                placeholder="Quick search YouTube videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !loading && searchQuery.trim()) {
                    setActiveTab('search')
                    setTimeout(() => handleSearch(), 100)
                  }
                }}
                className="flex-1"
                disabled={loading}
              />
              <Button 
                onClick={() => {
                  if (!loading && searchQuery.trim()) {
                    setActiveTab('search')
                    setTimeout(() => handleSearch(), 100)
                  } else if (!searchQuery.trim()) {
                    showToast('Search Query Required', 'Please enter a search query', 'info')
                  }
                }} 
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            
            {/* Filtered Content by Channel */}
            {selectedChannelFilter && favoriteChannels.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">
                  {favoriteChannels.find(c => c.channelId === selectedChannelFilter)?.name} Content
                </h3>
                <div className="space-y-2">
                  {favoriteVideos
                    .filter(video => video.channelName === favoriteChannels.find(c => c.channelId === selectedChannelFilter)?.name)
                    .map(video => (
                      <VideoCard key={video.id} video={video} />
                    ))}
                  {favoriteVideos.filter(video => video.channelName === favoriteChannels.find(c => c.channelId === selectedChannelFilter)?.name).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No videos from this channel in favorites</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Recent Videos from Followed Channels */}
            {!selectedChannelFilter && recentVideosFromChannels.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Recent from Followed Channels</h3>
                <div className="space-y-2">
                  {recentVideosFromChannels.map(video => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </div>
            )}
            
            {/* All Favorite Videos (when no filter) */}
            {!selectedChannelFilter && favoriteVideos.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Favorite Videos</h3>
                <div className="space-y-2">
                  {favoriteVideos.map(video => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </div>
            )}
            
            {/* All Favorite Channels (when no filter) */}
            {!selectedChannelFilter && favoriteChannels.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Favorite Channels</h3>
                <div className="grid grid-cols-2 gap-2">
                  {favoriteChannels.map(channel => (
                    <Card key={channel.id} className="p-3">
                      <div className="flex items-center gap-2">
                        {channel.thumbnail && (
                          <img
                            src={channel.thumbnail}
                            alt={channel.name}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{channel.name}</p>
                          {channel.subscriberCount && (
                            <p className="text-xs text-muted-foreground">
                              {formatViewCount(channel.subscriberCount)} subscribers
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {favoriteVideos.length === 0 && favoriteChannels.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No favorites yet. Start adding videos and channels!</p>
              </div>
            )}
          </div>
        )

      case 'search':
        return (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search YouTube videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    handleSearch()
                  }
                }}
                className="flex-1"
                disabled={loading}
              />
              <Button 
                onClick={() => {
                  // Use the same validation as Enter key
                  if (!loading && searchQuery.trim()) {
                    handleSearch()
                  } else if (!searchQuery.trim()) {
                    showToast('Search Query Required', 'Please enter a search query', 'info')
                  }
                }} 
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            
            {loading && (
              <VideoGridSkeleton count={8} />
            )}
            
            {searchResults && (
              <div className="space-y-2">
                {searchResults.error ? (
                  <div className="text-center py-8 text-destructive">
                    <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{searchResults.error}</p>
                  </div>
                ) : searchResults.items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No videos found for "{searchQuery}"</p>
                    <p className="text-sm mt-1">Try different keywords</p>
                  </div>
                ) : (
                  <>
                    {/* Dynamic Loading Message */}
                    {dynamicLoadingMessage && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg animate-in fade-in duration-300">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                            {dynamicLoadingMessage}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-sm text-muted-foreground mb-4">
                      Showing {searchResults.items.length} videos {hasMoreVideos && '(scroll for more)'}
                    </p>
                    
                    {searchResults.items.map((video: Video) => (
                      <VideoCard key={video.id} video={video} />
                    ))}
                    
                    {/* Scroll sentinel for infinite scroll */}
                    <div id="scroll-sentinel" className="py-12 min-h-[100px] flex items-center justify-center">
                      {loadingMore && (
                        <div className="flex flex-col justify-center items-center gap-4 text-muted-foreground animate-in fade-in duration-300">
                          <Loader2 className="w-8 h-8 animate-spin" />
                          <span className="text-sm font-medium">Loading more videos...</span>
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      )}
                      {!hasMoreVideos && searchResults.items.length > 0 && (
                        <div className="text-center text-muted-foreground py-8 animate-in fade-in duration-300">
                          <div className="mb-4">
                            <div className="w-16 h-16 mx-auto border-2 border-muted-foreground/20 rounded-full flex items-center justify-center">
                              <Check className="w-6 h-6 text-muted-foreground/40" />
                            </div>
                          </div>
                          <p className="text-sm font-medium mb-2">You've reached the end</p>
                          <p className="text-xs opacity-75">Try a different search query to find more videos</p>
                        </div>
                      )}
                      {hasMoreVideos && !loadingMore && (
                        <div className="text-center text-muted-foreground/50 text-xs py-4">
                          <p>Scroll down to load more videos</p>
                          <div className="mt-2 animate-bounce">
                            <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            
            {!searchResults && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Search for YouTube videos</p>
                <p className="text-sm mt-1">Enter keywords above to get started</p>
              </div>
            )}
          </div>
        )

      case 'player':
        return (
          <div className="space-y-4">
            {selectedVideo ? (
              <>
                {/* Back Button */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleBackToPrevious}
                    variant="outline"
                    size="sm"
                    className="h-8 px-3"
                    aria-label="Go back to previous page"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    to {previousTab === 'home' ? 'Home' : 
                         previousTab === 'search' ? 'Search' :
                         previousTab === 'watched' ? 'Watched' :
                         previousTab === 'channels' ? 'Channels' :
                         previousTab === 'notes' ? 'Notes' :
                         previousTab === 'favorites' ? 'Favorites' : 'Previous'}
                  </span>
                </div>

                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedVideo.id}`}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-2">{selectedVideo.title}</h2>
                  <p className="text-sm text-muted-foreground mb-3">
                    {getChannelName(selectedVideo)} • {selectedVideo.viewCount ? formatViewCount(selectedVideo.viewCount) : 'No view count'} views
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => toggleFavorite(selectedVideo)}
                      variant={favoriteVideoIds.has(selectedVideo.id) ? "default" : "outline"}
                      className={favoriteVideoIds.has(selectedVideo.id) ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                    >
                      <Heart className={`w-4 h-4 mr-2 ${favoriteVideoIds.has(selectedVideo.id) ? 'fill-current' : ''}`} />
                      {favoriteVideoIds.has(selectedVideo.id) ? 'Favorited' : 'Add to Favorites'}
                    </Button>
                    <Button
                      onClick={() => {
                        setCurrentNoteVideo(selectedVideo)
                        setNoteDialogOpen(true)
                      }}
                      variant="outline"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                </div>

                {/* Notes List Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-md font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Video Notes
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      {getVideoNotesCount(selectedVideo.id)} note{getVideoNotesCount(selectedVideo.id) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {getVideoNotes(selectedVideo.id).length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                      {getVideoNotes(selectedVideo.id).map((note) => (
                        <Card key={note.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-2 py-1 rounded">
                                    Note
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Font size: {note.fontSize}px
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date().toLocaleDateString()}
                                  </span>
                                </div>
                                <p 
                                  className="text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                                  style={{ fontSize: `${note.fontSize}px` }}
                                >
                                  {note.note}
                                </p>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => editNote(note)}
                                  className="h-8 px-2"
                                  aria-label={`Edit note: ${note.note.substring(0, 30)}...`}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteNote(note.id)}
                                  className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                  aria-label={`Delete note: ${note.note.substring(0, 30)}...`}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notes yet for this video</p>
                      <p className="text-xs mt-1">Click "Add Note" to create your first note</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Select a video to play</p>
              </div>
            )}
          </div>
        )

      case 'watched':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Watched Videos</h2>
              <div className="flex items-center gap-2">
                {watchedVideos.length > 0 && (
                  <Badge variant="secondary">{watchedVideos.length} videos</Badge>
                )}
                {watchedVideos.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fixIncorrectVideoIds}
                    className="h-8 px-2"
                    aria-label="Fix incorrect video IDs"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Fix IDs
                  </Button>
                )}
                {watchedVideos.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cleanupWatchedVideos}
                    className="h-8 px-2"
                    aria-label="Cleanup duplicate videos"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Cleanup
                  </Button>
                )}
              </div>
            </div>
            
            {/* Search for watched videos */}
            {watchedVideos.length > 0 && (
              <div className="relative">
                <Input
                  placeholder="Search watched videos..."
                  value={watchedVideosFilter}
                  onChange={(e) => setWatchedVideosFilter(e.target.value)}
                  className="pr-20"
                />
                {watchedVideosFilter && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setWatchedVideosFilter('')}
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    aria-label="Clear search"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                )}
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            )}
            
            {watchedVideos.length > 0 ? (
              <div className="space-y-2">
                {watchedVideos
                  .filter(video => 
                    watchedVideosFilter.trim() === '' || 
                    video.title.toLowerCase().includes(watchedVideosFilter.toLowerCase()) ||
                    video.channelName.toLowerCase().includes(watchedVideosFilter.toLowerCase())
                  )
                  .map(video => (
                    <WatchedVideoCard key={video.id} video={video} />
                  ))}
                {watchedVideos.filter(video => 
                  watchedVideosFilter.trim() === '' || 
                  video.title.toLowerCase().includes(watchedVideosFilter.toLowerCase()) ||
                  video.channelName.toLowerCase().includes(watchedVideosFilter.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No videos found for "{watchedVideosFilter}"</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No watched videos yet</p>
                <p className="text-sm mt-1">Videos you watch will appear here</p>
              </div>
            )}
          </div>
        )

      case 'channels':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Favorite Channels</h2>
              {favoriteChannels.length > 0 && (
                <Badge variant="secondary">{favoriteChannels.length} channels</Badge>
              )}
            </div>
            
            {/* Channel Search */}
            <div className="relative">
              <Input
                placeholder="Search your favorite channels..."
                value={channelSearchQuery}
                onChange={(e) => setChannelSearchQuery(e.target.value)}
                className="pr-20"
              />
              {channelSearchQuery && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setChannelSearchQuery('')}
                  className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  aria-label="Clear search"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              )}
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            
            {favoriteChannels.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {favoriteChannels
                  .filter(channel => 
                    channelSearchQuery.trim() === '' || 
                    channel.name.toLowerCase().includes(channelSearchQuery.toLowerCase())
                  )
                  .map(channel => (
                  <Card key={channel.id} className="hover:shadow-lg transition-all duration-200 group">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Channel Header */}
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img
                              src={channel.thumbnail || '/placeholder-channel.png'}
                              alt={channel.name}
                              className="w-16 h-16 rounded-full object-cover bg-muted border-2 border-border group-hover:border-primary transition-colors"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-channel.png'
                              }}
                              loading="lazy"
                            />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <User className="w-3 h-3 text-primary-foreground" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                              {channel.name}
                            </h3>
                            {channel.subscriberCount && (
                              <p className="text-sm text-muted-foreground">
                                {formatViewCount(channel.subscriberCount).replace('views', 'subscribers')}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Channel Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSearchQuery(channel.name)
                              setActiveTab('search')
                              handleSearch()
                            }}
                            className="flex-1"
                          >
                            <Search className="w-4 h-4 mr-2" />
                            Browse Videos
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleFavoriteChannel({ 
                              id: channel.channelId, 
                              name: channel.name, 
                              thumbnail: channel.thumbnail ? { url: channel.thumbnail, width: 100, height: 100 } : undefined,
                              subscriberCount: channel.subscriberCount || 0,
                              videoCount: 0
                            })}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            title={`Unfollow ${channel.name}`}
                          >
                            <Heart className="w-4 h-4 fill-current" />
                          </Button>
                        </div>

                        {/* Channel Stats */}
                        <div className="pt-2 border-t border-border">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Favorite Channel</span>
                            <span>Added {new Date().toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Favorite Channels</h3>
                <p className="text-sm mb-4">Add channels to favorites while watching videos to see them here!</p>
                <Button onClick={() => setActiveTab('explore')}>
                  <Search className="w-4 h-4 mr-2" />
                  Explore Channels
                </Button>
              </div>
            )}

            {/* Show no results for channel search */}
            {favoriteChannels.length > 0 && favoriteChannels.filter(channel => 
              channelSearchQuery.trim() === '' || 
              channel.name.toLowerCase().includes(channelSearchQuery.toLowerCase())
            ).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No channels found for "{channelSearchQuery}"</p>
              </div>
            )}

            {/* Channel Management Tips */}
            {favoriteChannels.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">Channel Management Tips</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Click "Browse Videos" to search for content from your followed channels</li>
                  <li>• Click the X icon to unfollow a channel</li>
                  <li>• Channels are automatically followed when you favorite their videos</li>
                  <li>• Use the channel bar on homepage to filter content by channel</li>
                </ul>
              </div>
            )}
          </div>
        )

      case 'explore':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Explore New Channels</h2>
              {discoveredChannels.length > 0 && (
                <Badge variant="secondary">{discoveredChannels.length} channels found</Badge>
              )}
            </div>
            
            {/* Channel Search */}
            <div className="relative">
              <Input
                placeholder="Search for YouTube channels to explore..."
                value={discoverChannelsQuery}
                onChange={(e) => setDiscoverChannelsQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !loading && discoverChannelsQuery.trim()) {
                    handleChannelSearch()
                  }
                }}
                className="pr-20"
                disabled={loading}
              />
              {discoverChannelsQuery && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDiscoverChannelsQuery('')
                    setDiscoveredChannels([])
                  }}
                  className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  aria-label="Clear search"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  if (!loading && discoverChannelsQuery.trim()) {
                    handleChannelSearch()
                  } else if (!discoverChannelsQuery.trim()) {
                    showToast('Search Query Required', 'Please enter a channel name to search', 'info')
                  }
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                disabled={loading}
                aria-label="Search channels"
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
              </Button>
            </div>
            
            {/* Search Results */}
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : discoveredChannels.length > 0 ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {discoveredChannels.map((channel) => {
                    const isFollowed = favoriteChannels.some(fc => fc.channelId === channel.id)
                    return (
                      <Card key={channel.id} className="hover:shadow-lg transition-all duration-200 group">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {/* Channel Header */}
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <img
                                  src={getThumbnailUrl(channel)}
                                  alt={channel.name || channel.channel?.name || 'Unknown Channel'}
                                  className="w-16 h-16 rounded-full object-cover bg-muted border-2 border-border group-hover:border-primary transition-colors"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder-channel.png'
                                  }}
                                  loading="lazy"
                                />
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                  <User className="w-3 h-3 text-primary-foreground" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                                  {channel.name || channel.channel?.name || 'Unknown Channel'}
                                </h3>
                                {channel.subscriberCount && (
                                  <p className="text-sm text-muted-foreground">
                                    {formatViewCount(channel.subscriberCount).replace('views', 'subscribers')}
                                  </p>
                                )}
                                {channel.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {channel.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Channel Actions */}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSearchQuery(channel.name || channel.channel?.name || '')
                                  setActiveTab('search')
                                  handleSearch()
                                }}
                                className="flex-1"
                              >
                                <Search className="w-4 h-4 mr-2" />
                                Browse Videos
                              </Button>
                              <Button
                                size="sm"
                                variant={isFollowed ? "default" : "outline"}
                                onClick={() => {
                                  toggleFavoriteChannel({ 
                                    id: channel.id, 
                                    name: channel.name || channel.channel?.name || 'Unknown Channel', 
                                    thumbnail: channel.thumbnail || channel.channel?.thumbnail,
                                    subscriberCount: channel.subscriberCount || 0,
                                    videoCount: 0
                                  })
                                }}
                                className={isFollowed ? "text-white bg-red-500 hover:bg-red-600" : "text-red-500 hover:text-red-600 hover:bg-red-50"}
                                title={isFollowed ? `Unfollow ${channel.name || channel.channel?.name}` : `Follow ${channel.name || channel.channel?.name}`}
                              >
                                <Heart className={`w-4 h-4 ${isFollowed ? 'fill-current' : ''}`} />
                              </Button>
                            </div>

                            {/* Channel Stats */}
                            <div className="pt-2 border-t border-border">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{isFollowed ? 'Followed' : 'Not Followed'}</span>
                                <span>Discovered {new Date().toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Discover New Channels</h3>
                <p className="text-sm mb-4">Search for channels to follow and stay updated with their content!</p>
              </div>
            )}
          </div>
        )

      case 'notes':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Video Notes</h2>
            {videoNotes.length > 0 ? (
              <div className="space-y-2">
                {videoNotes.map(note => (
                  <Card key={note.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {note.thumbnail && (
                          <img
                            src={note.thumbnail}
                            alt={note.title}
                            className="w-20 h-16 object-cover rounded bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              // Create a video object from note and play it
                              const videoObject = {
                                id: note.videoId,
                                title: note.title,
                                channelName: note.channelName,
                                thumbnail: note.thumbnail,
                                channel: { name: note.channelName }
                              }
                              setPreviousTab('notes') // Set previous tab to notes
                              handleVideoPlay(videoObject as any)
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 
                                className="font-medium text-sm mb-1 cursor-pointer hover:text-primary transition-colors"
                                onClick={() => {
                                  // Create a video object from note and play it
                                  const videoObject = {
                                    id: note.videoId,
                                    title: note.title,
                                    channelName: note.channelName,
                                    thumbnail: note.thumbnail,
                                    channel: { name: note.channelName }
                                  }
                                  setPreviousTab('notes') // Set previous tab to notes
                                  handleVideoPlay(videoObject as any)
                                }}
                              >
                                {note.title}
                              </h3>
                              <p className="text-xs text-muted-foreground mb-2">{note.channelName}</p>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Create a video object from note and play it
                                  const videoObject = {
                                    id: note.videoId,
                                    title: note.title,
                                    channelName: note.channelName,
                                    thumbnail: note.thumbnail,
                                    channel: { name: note.channelName }
                                  }
                                  setPreviousTab('notes') // Set previous tab to notes
                                  handleVideoPlay(videoObject as any)
                                }}
                                className="h-7 px-2"
                                aria-label={`Play video: ${note.title}`}
                              >
                                <Play className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCurrentNoteVideo({
                                    id: note.videoId,
                                    title: note.title,
                                    channelName: note.channelName,
                                    thumbnail: note.thumbnail,
                                    channel: { name: note.channelName }
                                  } as any)
                                  setCurrentNote(note.note)
                                  setCurrentNoteId(note.id)
                                  setNoteFontSize(note.fontSize)
                                  setNoteDialogOpen(true)
                                }}
                                className="h-7 px-2"
                                aria-label={`Edit note for: ${note.title}`}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2 p-3 bg-muted rounded-lg">
                            <p 
                              className="text-sm leading-relaxed"
                              style={{ fontSize: `${note.fontSize}px` }}
                            >
                              {note.note}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              Font size: {note.fontSize}px
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date().toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No notes yet. Add notes while watching videos!</p>
              </div>
            )}
          </div>
        )

      case 'favorites':
        return (
          <div className="space-y-6">
            {/* Favorite Videos Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Favorite Videos</h2>
                {favoriteVideos.length > 0 && (
                  <Badge variant="secondary">{favoriteVideos.length}</Badge>
                )}
              </div>
              {favoriteVideos.length > 0 ? (
                <div className="space-y-2">
                  {favoriteVideos.map(video => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No favorite videos yet</p>
                  <p className="text-sm mt-1">Add videos to favorites while watching or searching</p>
                </div>
              )}
            </div>

            {/* Favorite Channels Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Favorite Channels</h2>
                {favoriteChannels.length > 0 && (
                  <Badge variant="secondary">{favoriteChannels.length}</Badge>
                )}
              </div>
              {favoriteChannels.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {favoriteChannels.map(channel => (
                    <Card key={channel.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            <img
                              src={channel.thumbnail || '/placeholder-channel.png'}
                              alt={channel.name}
                              className="w-12 h-12 rounded-full object-cover bg-muted"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-channel.png'
                              }}
                              loading="lazy"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{channel.name}</h3>
                            {channel.subscriberCount && (
                              <p className="text-xs text-muted-foreground">
                                {formatViewCount(channel.subscriberCount).replace('views', 'subscribers')}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Explore this channel
                              setActiveTab('explore')
                              setDiscoverChannelsQuery(channel.name || channel.channel?.name || '')
                            }}
                            className="h-8 px-2"
                          >
                            <Search className="w-3 h-3 mr-1" />
                            Browse
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No favorite channels yet</p>
                  <p className="text-sm mt-1">Add channels to favorites while watching videos</p>
                </div>
              )}
            </div>

            {favoriteVideos.length === 0 && favoriteChannels.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Favorites Yet</h3>
                <p className="text-sm mb-4">Start adding videos and channels to your favorites!</p>
                <Button onClick={() => setActiveTab('search')}>
                  <Search className="w-4 h-4 mr-2" />
                  Discover Videos
                </Button>
              </div>
            )}
          </div>
        )

      case 'config':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6" />
              <h2 className="text-lg font-semibold">Configuration</h2>
            </div>
            
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium mb-4">Application Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Auto-play Videos</h4>
                        <p className="text-sm text-muted-foreground">Automatically play videos when selected</p>
                      </div>
                      <Button variant="outline" size="sm">Coming Soon</Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Video Quality</h4>
                        <p className="text-sm text-muted-foreground">Default video playback quality</p>
                      </div>
                      <Button variant="outline" size="sm">Coming Soon</Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Notifications</h4>
                        <p className="text-sm text-muted-foreground">Enable desktop notifications</p>
                      </div>
                      <Button variant="outline" size="sm">Coming Soon</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium mb-4">Data Management</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Clear Cache</h4>
                        <p className="text-sm text-muted-foreground">Clear search cache and temporary data</p>
                      </div>
                      <Button variant="outline" size="sm">Coming Soon</Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Export Data</h4>
                        <p className="text-sm text-muted-foreground">Export your favorites and notes</p>
                      </div>
                      <Button variant="outline" size="sm">Coming Soon</Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Reset Data</h4>
                        <p className="text-sm text-muted-foreground">Clear all application data</p>
                      </div>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">Coming Soon</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium mb-4">About</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Version</span>
                      <span className="text-sm font-medium">1.0.0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Videos Watched</span>
                      <span className="text-sm font-medium">{watchedVideos.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Favorites</span>
                      <span className="text-sm font-medium">{favoriteVideos.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Notes</span>
                      <span className="text-sm font-medium">{videoNotes.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      {/* Splash Screen */}
      {showSplashScreen && <SplashScreen onComplete={handleSplashComplete} />}
      
      {/* Main App */}
      {!showSplashScreen && (
        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="bg-card border-b px-4 py-3" role="banner">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" aria-hidden="true" />
            <h1 className="text-lg font-bold">MyTube</h1>
          </div>
          <div className="text-xs text-muted-foreground">
            © 2025 Mohamed Adel
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20" role="main">
        <ScrollArea className="h-[calc(100vh-9rem)]">
          <div className="p-4 max-w-7xl mx-auto">
            {renderTabContent()}
          </div>
        </ScrollArea>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t" role="navigation" aria-label="Main navigation">
        {/* Swipe hint for touch devices */}
        <div className="text-center text-xs text-muted-foreground py-1 border-b border-border/50">
          <span className="inline-flex items-center gap-1">
            <span>Swipe left/right or use arrow keys to navigate</span>
          </span>
        </div>
        <div className="flex justify-around py-2">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                activeTab === id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label={`Navigate to ${label}`}
              aria-current={activeTab === id ? 'page' : undefined}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{currentNoteId ? 'Edit Note' : 'Add Note'}</DialogTitle>
          </DialogHeader>
          {currentNoteVideo && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <img
                  src={getThumbnailUrl(currentNoteVideo)}
                  alt={currentNoteVideo.title}
                  className="w-16 h-12 object-cover rounded bg-muted"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-video.png'
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium line-clamp-2">{currentNoteVideo.title}</p>
                  <p className="text-xs text-muted-foreground">{getChannelName(currentNoteVideo)}</p>
                </div>
              </div>
              <Textarea
                placeholder="Write your note here..."
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Font Size:</label>
                <Select value={noteFontSize.toString()} onValueChange={(v) => setNoteFontSize(parseInt(v))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12px</SelectItem>
                    <SelectItem value="14">14px</SelectItem>
                    <SelectItem value="16">16px</SelectItem>
                    <SelectItem value="18">18px</SelectItem>
                    <SelectItem value="20">20px</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between gap-2">
                <div className="flex gap-2">
                  {currentNoteId && (
                    <Button 
                      variant="outline" 
                      onClick={async () => {
                        try {
                          await fetch(`/api/notes/${currentNoteId}`, { 
                            method: 'DELETE' 
                          })
                          showToast('Note Deleted', 'Note deleted successfully', 'info')
                          setNoteDialogOpen(false)
                          setCurrentNote('')
                          setCurrentNoteVideo(null)
                          setCurrentNoteId(null)
                          await loadVideoNotes()
                        } catch (error) {
                          showToast('Delete Failed', 'Failed to delete note', 'destructive')
                        }
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      Delete
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => {
                    setNoteDialogOpen(false)
                    setCurrentNote('')
                    setCurrentNoteVideo(null)
                    setCurrentNoteId(null)
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={addNote} disabled={!currentNote.trim()}>
                    {currentNoteId ? 'Update Note' : 'Save Note'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 py-2">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Are you sure you want to delete this note?</p>
                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            
            {noteToDelete && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {getVideoNotes(noteToDelete).find(n => n.id === noteToDelete)?.note}
                </p>
              </div>
            )}
            
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false)
                  setNoteToDelete(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteNote}
                disabled={dynamicLoadingMessage.includes('Deleting')}
              >
                {dynamicLoadingMessage.includes('Deleting') ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Note'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
        </div>
      )}
    </>
  )
}