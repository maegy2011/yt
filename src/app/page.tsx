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
  Edit
} from 'lucide-react'
import { searchVideos, formatViewCount, formatPublishedAt, formatDuration } from '@/lib/youtube'
import { getLoadingMessage, getConfirmationMessage } from '@/lib/loading-messages'
import type { Video, Channel } from '@/lib/youtube'
import { VideoCardSkeleton, VideoGridSkeleton } from '@/components/video-skeleton'
import { SplashScreen } from '@/components/splash-screen'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'

// Enhanced types with better safety
type Tab = 'home' | 'search' | 'player' | 'watched' | 'channels' | 'notes' | 'favorites'

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
  const [searchQuery, setSearchQuery] = useState('الحويني')
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
  const showToast = useCallback((title: string, description?: string, variant: 'success' | 'error' | 'info' = 'info') => {
    toast({
      title,
      description,
      variant,
    })
  }, [toast])

  // Show dynamic loading message
  const showDynamicLoading = useCallback((operation: 'search' | 'loadMore' | 'favorites' | 'notes' | 'channels' | 'general') => {
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
    const loadInitialData = async () => {
      try {
        await Promise.all([
          loadWatchedVideos(),
          loadFavoriteChannels(),
          loadFavoriteVideos(),
          loadVideoNotes()
        ])
        // Removed auto-search on load - user needs to manually search
      } catch (error) {
        showToast('Failed to load initial data', 'Please refresh the page', 'error')
      }
    }
    
    // Only load initial data after splash screen is complete
    if (!showSplashScreen) {
      loadInitialData()
    }
  }, [showSplashScreen])

  // Cache helper functions
  const getCachedResults = useCallback((query: string) => {
    const cached = searchCache.get(query)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Using cached results for query:', query)
      return cached
    }
    return null
  }, [searchCache])

  const setCachedResults = useCallback((query: string, items: Video[], continuation: string | null, hasMore: boolean) => {
    console.log('Caching results for query:', query, { itemsCount: items.length, hasContinuation: !!continuation })
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
        const tabs: Tab[] = ['home', 'search', 'player', 'watched', 'channels', 'notes', 'favorites']
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

      const tabs: Tab[] = ['home', 'search', 'player', 'watched', 'channels', 'notes', 'favorites']
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
      console.log('Pagination attempted without current search query - disabling')
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
        console.log('Using cached results for:', trimmedQuery)
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
      console.log('Starting new search with query:', trimmedQuery)
    } else {
      // Pagination - always use stored query
      setLoadingMore(true)
      showDynamicLoading('loadMore')
      if (!currentSearchQuery) {
        console.log('No current search query stored for pagination - disabling load more')
        setHasMoreVideos(false)
        setDynamicLoadingMessage('')
        return
      }
      console.log('Loading more videos with stored query:', currentSearchQuery)
    }
    
    try {
      // Always use currentSearchQuery for pagination, new query for initial search
      const queryToUse = append ? currentSearchQuery : trimmedQuery
      const params = new URLSearchParams({
        query: queryToUse,
        type: 'video'
      })
      
      // Add continuation token if loading more
      if (append && continuationToken) {
        params.append('continuation', continuationToken)
        console.log('Using continuation token for query:', queryToUse)
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
          // Cache empty results
          setCachedResults(queryToUse, [], null, false)
        } else {
          showToast('No More Videos', 'No more videos found for this search', 'info')
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
      
      let finalItems: Video[]
      if (append && searchResults?.items) {
        // Append new videos to existing results
        const existingVideoIds = new Set(searchResults.items.map(v => v.id))
        const newVideos = data.items.filter((video: Video) => !existingVideoIds.has(video.id))
        
        if (newVideos.length > 0) {
          finalItems = [...searchResults.items, ...newVideos]
          setSearchResults({
            items: finalItems
          })
          showDynamicConfirmation('search', finalItems.length)
        } else {
          if (data.items.length === 0) {
            // No items returned from continuation - likely reached the end
            showToast('No More Videos', 'You\'ve reached the end of the search results', 'info')
            setHasMoreVideos(false)
          } else {
            // All returned items were duplicates
            showToast('No New Videos', 'All available videos have been loaded', 'info')
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
        newVideosLoaded: append ? data.items.length : 0,
        hasMore: data.hasMore,
        hasContinuation: !!data.continuation,
        page: data.page,
        cached: !append && getCachedResults(queryToUse) !== null
      })
      
    } catch (error) {
      showToast('Search Failed', 'Search failed. Please try again.', 'error')
      console.error('Search error:', error)
      if (!append) setSearchResults(null)
    } finally {
      setLoading(false)
      setLoadingMore(false)
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
    if (cachedResults && cachedResults.continuation === continuationToken && cachedResults.items.length > searchResults?.items.length) {
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

  const handleVideoPlay = async (video: Video) => {
    setSelectedVideo(video)
    setActiveTab('player')
    
    // Add to watched videos
    try {
      const thumbnailUrl = getThumbnailUrl(video)
      await fetch('/api/watched', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video.id,
          title: video.title,
          channelName: getChannelName(video),
          thumbnail: thumbnailUrl,
          duration: video.duration,
          viewCount: video.viewCount
        })
      })
      await loadWatchedVideos()
    } catch (error) {
      console.error('Failed to add to watched:', error)
      showToast('Tracking Failed', 'Failed to track video', 'error')
    }
  }

  const toggleFavorite = async (video: Video) => {
    try {
      const isFavorite = favoriteVideoIds.has(video.id)
      const thumbnailUrl = getThumbnailUrl(video)
      
      if (isFavorite) {
        // Remove from favorites
        showDynamicLoading('favorites')
        const response = await fetch(`/api/favorites/${video.id}`, { 
          method: 'DELETE' 
        })
        
        if (response.ok) {
          showDynamicConfirmation('favorites', 'remove')
          // Immediately update the local state to provide instant feedback
          setFavoriteVideos(prev => prev.filter(fav => fav.videoId !== video.id))
          // Then refresh from server to ensure consistency
          await loadFavoriteVideos()
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('Delete failed:', errorData)
          showToast('Failed to Remove', errorData.error || 'Failed to remove from favorites', 'error')
        }
      } else {
        // Add to favorites
        showDynamicLoading('favorites')
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: video.id,
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
          const data = await response.json().catch(() => ({}))
          if (data.error === 'Already exists') {
            showToast('Already in Favorites', 'Video already in your favorites', 'info')
            // Sync local state if it was already favorited
            await loadFavoriteVideos()
          } else {
            console.error('Add failed:', data)
            showToast('Failed to Add', data.error || 'Failed to add to favorites', 'error')
          }
        }
      }
    } catch (error) {
      console.error('Favorite toggle error:', error)
      showToast('Error', 'Failed to update favorites', 'error')
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
          subscriberCount: channel.subscriberCount
        })
      })
      
      if (response.ok) {
        showToast('Channel Added', 'Channel added to favorites', 'success')
        await loadFavoriteChannels()
      } else {
        const data = await response.json()
        if (data.error === 'Already exists') {
          await fetch(`/api/channels/${channel.id}`, { method: 'DELETE' })
          showToast('Channel Removed', 'Channel removed from favorites', 'info')
          await loadFavoriteChannels()
        }
      }
    } catch (error) {
      showToast('Error', 'Failed to update channel favorites', 'error')
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
          showToast('Update Failed', 'Failed to update note', 'error')
          return
        }
      } else {
        // Create new note
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: currentNoteVideo.id,
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
          showToast('Add Failed', 'Failed to add note', 'error')
          return
        }
      }
      
      setNoteDialogOpen(false)
      setCurrentNote('')
      setCurrentNoteVideo(null)
      setCurrentNoteId(null)
      await loadVideoNotes()
    } catch (error) {
      showToast('Save Failed', 'Failed to save note', 'error')
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
        await loadVideoNotes()
        setDeleteConfirmOpen(false)
        setNoteToDelete(null)
      } else {
        const errorData = await response.json().catch(() => ({}))
        showToast('Delete Failed', errorData.error || 'Failed to delete note', 'error')
      }
    } catch (error) {
      showToast('Error', 'Failed to delete note', 'error')
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

  const loadVideoNotes = async (): Promise<void> => {
    try {
      const response = await fetch('/api/notes')
      if (!response.ok) throw new Error('Failed to fetch video notes')
      const data = await response.json()
      setVideoNotes((data || []).filter((note: VideoNote) => !note.isArchived))
    } catch (error) {
      console.error('Failed to load video notes:', error)
      setVideoNotes([])
    }
  }

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
    { id: 'notes' as Tab, icon: FileText, label: 'Notes' },
    { id: 'favorites' as Tab, icon: Heart, label: 'Favorites' },
  ], [])

  // Clear selection when switching tabs
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
    const hasNotes = hasVideoNotes(video.id)
    const notesCount = getVideoNotesCount(video.id)
    const videoNotesList = getVideoNotes(video.id)
    
    return (
      <Card className={`relative group hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}>
        <CardContent className="p-3">
          <div className="flex gap-3">
            {multiSelectMode && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleItemSelection(video.id)}
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
                    onClick={() => handleVideoPlay(video)}
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
  }, [favoriteVideoIds, selectedItems, multiSelectMode, getThumbnailUrl, getChannelName, toggleItemSelection, handleVideoPlay, toggleFavorite, hasVideoNotes, getVideoNotesCount, getVideoNotes])

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
            
            {favoriteVideos.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Favorite Videos</h3>
                <div className="space-y-2">
                  {favoriteVideos.map(video => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </div>
            )}
            
            {favoriteChannels.length > 0 && (
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
                onKeyPress={(e) => e.key === 'Enter' && !loading && handleSearch()}
                className="flex-1"
                disabled={loading}
              />
              <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
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
                                    {new Date(note.createdAt).toLocaleDateString()}
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
            <h2 className="text-lg font-semibold">Watched Videos</h2>
            {watchedVideos.length > 0 ? (
              <div className="space-y-2">
                {watchedVideos.map(video => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No watched videos yet</p>
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
            
            {favoriteChannels.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {favoriteChannels.map(channel => (
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
                              thumbnail: channel.thumbnail ? { url: channel.thumbnail } : undefined,
                              subscriberCount: channel.subscriberCount 
                            })}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Heart className="w-4 h-4" />
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
                <Button onClick={() => setActiveTab('search')}>
                  <Search className="w-4 h-4 mr-2" />
                  Discover Channels
                </Button>
              </div>
            )}

            {/* Channel Management Tips */}
            {favoriteChannels.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">Channel Management Tips</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Click "Browse Videos" to search for content from your favorite channels</li>
                  <li>• Click the heart icon to remove a channel from favorites</li>
                  <li>• Channels are automatically added when you favorite their videos</li>
                </ul>
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
                              {new Date(note.createdAt).toLocaleDateString()}
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
                              // Search for this channel's videos
                              setSearchQuery(channel.name)
                              setActiveTab('search')
                              handleSearch()
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
                          showToast('Delete Failed', 'Failed to delete note', 'error')
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