'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Home, 
  Search, 
  Play, 
  Clock, 
  Heart, 
  User, 
  FileText,
  ExternalLink,
  ArrowLeft,
  X,
  Check,
  Loader2,
  Edit,
  Trash2,
  Users,
  Plus,
  Save,
  Filter,
  Pause,
  Square,
  Settings,
  ArrowDown
} from 'lucide-react'
import { searchVideos, formatViewCount, formatPublishedAt, formatDuration } from '@/lib/youtube'
import { getLoadingMessage, getConfirmationMessage, getSmartConfirmationMessage } from '@/lib/loading-messages'
import type { Video, Channel } from '@/lib/youtube'
import { VideoCardSkeleton, VideoGridSkeleton } from '@/components/video-skeleton'
import { SplashScreen } from '@/components/splash-screen'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'
import YouTubePlayer, { type YouTubePlayerRef } from '@/components/youtube-player'

// Enhanced types with better safety
type Tab = 'home' | 'search' | 'player' | 'watched' | 'channels' | 'favorites' | 'notes'

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
  
  // Note-taking states
  const [videoNotes, setVideoNotes] = useState<any[]>([])
  const [allNotes, setAllNotes] = useState<any[]>([]) // All notes for the notes tab
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [showCommentInterface, setShowCommentInterface] = useState(false)
  const [noteStartTime, setNoteStartTime] = useState<number | null>(null)
  const [noteEndTime, setNoteEndTime] = useState<number | null>(null)
  const [noteComment, setNoteComment] = useState('')
  
  // Notes management states
  const [notesSearchQuery, setNotesSearchQuery] = useState('')
  const [selectedNoteChannel, setSelectedNoteChannel] = useState<string>('all')
  const [selectedNoteVideo, setSelectedNoteVideo] = useState<string>('all')
  const [noteSortBy, setNoteSortBy] = useState<'createdAt' | 'updatedAt' | 'title'>('createdAt')
  const [noteSortOrder, setNoteSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isEditNoteDialogOpen, setIsEditNoteDialogOpen] = useState(false)
  
  // YouTube player ref
  const youtubePlayerRef = useRef<YouTubePlayerRef>(null)
  
  // Video control states
  const [isPlayingNote, setIsPlayingNote] = useState(false)
  const [currentPlayingNote, setCurrentPlayingNote] = useState<any>(null)
  const [stopTimeout, setStopTimeout] = useState<NodeJS.Timeout | null>(null)
  
  // Edit note states
  const [editingNote, setEditingNote] = useState<any>(null)
  const [editComment, setEditComment] = useState('')
  
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
  const showToast = useCallback((title: string, description?: string, variant: 'success' | 'destructive' | 'info' = 'info') => {
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

  // Show smart confirmation with contextual awareness
  const showSmartConfirmation = useCallback((category: keyof typeof smartConfirmationMessages, action: string, ...args: any[]) => {
    const message = getSmartConfirmationMessage(category, action, ...args)
    showToast('Success!', message, 'success')
    setDynamicLoadingMessage('')
  }, [showToast])

  // Get item count for tab navigation context
  const getTabItemCount = useCallback((tab: Tab): number | undefined => {
    switch (tab) {
      case 'favorites':
        return favoriteVideos.length
      case 'watched':
        return watchedVideos.length
      case 'channels':
        return favoriteChannels.length
      case 'notes':
        return allNotes.length
      case 'search':
        return searchResults?.items.length || 0
      default:
        return undefined
    }
  }, [favoriteVideos.length, watchedVideos.length, favoriteChannels.length, allNotes.length, searchResults?.items.length])

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
          loadFavoriteVideos(),
          loadAllNotes() // Load all notes initially
        ])
        if (favoriteChannels.length > 0) {
          await loadChannelVideos()
        }
      } catch (error) {
        showToast('Failed to load initial data', 'Please refresh the page', 'destructive')
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

  // Get current video time
  const getCurrentVideoTime = (): number => {
    if (youtubePlayerRef.current && youtubePlayerRef.current.isReady()) {
      return Math.round(youtubePlayerRef.current.getCurrentTime())
    }
    return 0
  }

  // Play video at specific time with better error handling
  const playVideoAtTime = (time: number): void => {
    console.log('playVideoAtTime called with time:', time)
    
    if (!youtubePlayerRef.current) {
      console.error('YouTube player not initialized')
      showToast('Error', 'Video player not initialized. Please try again.', 'destructive')
      return
    }
    
    if (!youtubePlayerRef.current.isReady()) {
      console.error('YouTube player not ready')
      showToast('Error', 'Video player not ready. Please try again.', 'destructive')
      return
    }

    console.log('Player is ready, attempting to play video at time:', time)

    try {
      // Unmute first to ensure autoplay works
      youtubePlayerRef.current.unMute()
      
      // Set volume to a reasonable level
      youtubePlayerRef.current.setVolume(50)
      
      // Seek to the specified time
      console.log('Seeking to time:', time)
      youtubePlayerRef.current.seekTo(time, true)
      
      // Wait a moment for seeking to complete, then play
      setTimeout(() => {
        if (youtubePlayerRef.current && youtubePlayerRef.current.isReady()) {
          console.log('Attempting to play video after seeking')
          youtubePlayerRef.current.playVideo()
          console.log('Video playing at time:', time)
        } else {
          console.error('Player became not ready during playback')
        }
      }, 500) // Increased timeout to ensure seeking completes
    } catch (error) {
      console.error('Error playing video at time:', error)
      showToast('Error', 'Failed to play video segment', 'destructive')
    }
  }

  // Stop video playback
  const stopVideo = (): void => {
    if (!youtubePlayerRef.current || !youtubePlayerRef.current.isReady()) {
      console.error('YouTube player not ready')
      return
    }

    try {
      youtubePlayerRef.current.pauseVideo()
      console.log('Video stopped')
    } catch (error) {
      console.error('Error stopping video:', error)
    }
  }

  // Stop video at specific time
  const stopVideoAtTime = (endTime: number): void => {
    if (!youtubePlayerRef.current || !youtubePlayerRef.current.isReady()) {
      console.error('YouTube player not ready')
      return
    }

    // Clear any existing stop timeout
    if (stopTimeout) {
      clearTimeout(stopTimeout)
      setStopTimeout(null)
    }

    // Calculate when to stop (in milliseconds)
    const currentTime = getCurrentVideoTime()
    const timeUntilStop = (endTime - currentTime) * 1000

    console.log(`Current time: ${currentTime}, End time: ${endTime}, Time until stop: ${timeUntilStop}ms`)

    if (timeUntilStop > 0) {
      console.log(`Will stop video in ${timeUntilStop}ms at time ${endTime}`)
      
      const timeout = setTimeout(() => {
        console.log('Stop timeout triggered, checking loop conditions')
        if (isPlayingNote && currentPlayingNote) {
          handleNoteEnd(currentPlayingNote)
        } else {
          stopVideo()
          setIsPlayingNote(false)
          setCurrentPlayingNote(null)
        }
      }, timeUntilStop)

      setStopTimeout(timeout)
    } else {
      // If we're already past the end time, handle immediately
      console.log('Already past end time, handling immediately')
      if (isPlayingNote && currentPlayingNote) {
        handleNoteEnd(currentPlayingNote)
      } else {
        stopVideo()
        setIsPlayingNote(false)
        setCurrentPlayingNote(null)
      }
    }
  }

  // Clear stop timeout
  const clearStopTimeout = (): void => {
    if (stopTimeout) {
      clearTimeout(stopTimeout)
      setStopTimeout(null)
    }
  }

  // YouTube player event handlers
  const handleYouTubePlayerReady = useCallback((event: any) => {
    console.log('YouTube player ready for video:', selectedVideo?.title)
    
    // Check if there's a pending note to play
    const pendingNote = sessionStorage.getItem('pendingNote')
    if (pendingNote) {
      try {
        const note = JSON.parse(pendingNote)
        sessionStorage.removeItem('pendingNote')
        console.log('Found pending note, playing after ready:', note)
        // Wait a bit longer to ensure player is fully ready
        setTimeout(() => {
          if (youtubePlayerRef.current && youtubePlayerRef.current.isReady()) {
            playNoteWithLoop(note)
          } else {
            console.error('Player still not ready after additional delay')
            showToast('Error', 'Failed to initialize video player', 'destructive')
          }
        }, 1000)
      } catch (error) {
        console.error('Error parsing pending note:', error)
        sessionStorage.removeItem('pendingNote')
      }
    }
  }, [selectedVideo?.title])

  const handleYouTubePlayerStateChange = useCallback((event: any) => {
    console.log('Player state changed:', event.data)
    
    // Handle video end for looping - using YouTube PlayerState constants
    if (event.data === 0 && isPlayingNote && currentPlayingNote) { // 0 = YT.PlayerState.ENDED
      handleNoteEnd(currentPlayingNote)
    }
  }, [isPlayingNote, currentPlayingNote])

  const handleYouTubePlayerError = useCallback((event: any) => {
    console.error('YouTube player error:', event)
    showToast('Player Error', 'Failed to load video. Please try again.', 'destructive')
  }, [showToast])

  const handleVideoEnd = useCallback(() => {
    console.log('Video ended')
    if (isPlayingNote && currentPlayingNote) {
      handleNoteEnd(currentPlayingNote)
    }
  }, [isPlayingNote, currentPlayingNote])

  // Helper function to validate YouTube video ID
  const isValidYouTubeVideoId = (videoId: string): boolean => {
    // YouTube video IDs are typically 11 characters long and contain alphanumeric characters, hyphens, and underscores
    const videoIdRegex = /^[a-zA-Z0-9_-]{11}$/
    return videoIdRegex.test(videoId)
  }

  // Enhanced play note function with navigation and loop support
  const handlePlayNote = (note: any, navigateToPlayer: boolean = true): void => {
    console.log('handlePlayNote called with:', note)
    
    if (!note || typeof note.startTime !== 'number') {
      console.error('Invalid note data:', note)
      showToast('Error', 'Invalid note data', 'destructive')
      return
    }

    // Verify YouTube video ID
    if (!note.videoId || !isValidYouTubeVideoId(note.videoId)) {
      console.error('Invalid YouTube video ID:', note.videoId)
      showToast('Error', 'Invalid YouTube video ID', 'destructive')
      return
    }

    console.log('Playing note:', note)
    
    // Navigate to player if needed and not already there
    if (navigateToPlayer && (!selectedVideo || selectedVideo.id !== note.videoId)) {
      // Find the video in our data or create a minimal video object
      const videoToPlay = {
        id: note.videoId,
        videoId: note.videoId,
        title: note.title || 'Unknown Video',
        channelName: note.channelName || 'Unknown Channel',
        thumbnail: note.thumbnail || '',
        channel: { name: note.channelName || 'Unknown Channel' },
        duration: '',
        viewCount: 0,
        publishedAt: new Date().toISOString(),
        isLive: false
      }
      
      console.log('Navigating to player with video:', videoToPlay)
      
      // Set current tab before setting video to ensure proper initialization
      setActiveTab('player')
      setSelectedVideo(videoToPlay)
      
      // Store the note to play after player is ready
      sessionStorage.setItem('pendingNote', JSON.stringify(note))
      
      // Wait for player to initialize, then try to play
      const maxRetries = 10
      let retryCount = 0
      
      const tryPlayNote = () => {
        if (youtubePlayerRef.current && youtubePlayerRef.current.isReady()) {
          console.log('Player ready, playing note after navigation')
          playNoteWithLoop(note)
        } else if (retryCount < maxRetries) {
          retryCount++
          console.log(`Player not ready, retrying... (${retryCount}/${maxRetries})`)
          setTimeout(tryPlayNote, 1000)
        } else {
          console.error('Failed to initialize player after maximum retries')
          showToast('Error', 'Failed to initialize video player', 'destructive')
          sessionStorage.removeItem('pendingNote')
        }
      }
      
      setTimeout(tryPlayNote, 1500) // Initial delay for player to start initializing
    } else {
      // Already on the correct video, play directly
      console.log('Already on correct video, playing directly')
      playNoteWithLoop(note)
    }
  }
  
  // Play note functionality (simplified without loops)
  const playNoteWithLoop = (note: any): void => {
    console.log('playNoteWithLoop called with:', note)
    
    // Validate note structure
    if (!note) {
      console.error('Note is null or undefined')
      showToast('Error', 'Invalid note data', 'destructive')
      return
    }
    
    if (!selectedVideo || selectedVideo.id !== note.videoId) {
      console.error('Video mismatch:', { selectedVideoId: selectedVideo?.id, noteVideoId: note.videoId })
      showToast('Error', 'Video mismatch. Please select the correct video.', 'destructive')
      return
    }
    
    // Check if startTime exists and is valid
    if (note.startTime === null || note.startTime === undefined || typeof note.startTime !== 'number') {
      console.error('Invalid startTime:', note.startTime)
      showToast('Error', 'Note does not have a valid start time', 'destructive')
      return
    }
    
    // Clear any existing timeouts
    clearStopTimeout()
    
    // Set playing state
    setIsPlayingNote(true)
    setCurrentPlayingNote(note)
    
    console.log('Playing note:', { 
      id: note.id, 
      videoId: note.videoId, 
      startTime: note.startTime, 
      endTime: note.endTime,
      note: note.note 
    })
    
    // Ensure player is ready before attempting to play
    if (!youtubePlayerRef.current) {
      console.error('YouTube player not initialized')
      showToast('Error', 'Video player not initialized', 'destructive')
      setIsPlayingNote(false)
      setCurrentPlayingNote(null)
      return
    }
    
    if (!youtubePlayerRef.current.isReady()) {
      console.error('YouTube player not ready')
      showToast('Error', 'Video player not ready', 'destructive')
      setIsPlayingNote(false)
      setCurrentPlayingNote(null)
      return
    }
    
    // Play the video at the note's start time
    playVideoAtTime(note.startTime)
    
    // If note has an end time, set up automatic stopping
    if (note.endTime !== null && note.endTime !== undefined && typeof note.endTime === 'number' && note.endTime > note.startTime) {
      // Wait for seeking to complete, then set up stop timer
      setTimeout(() => {
        if (youtubePlayerRef.current && youtubePlayerRef.current.isReady()) {
          stopVideoAtTime(note.endTime)
        } else {
          console.error('Player became not ready during playback')
          setIsPlayingNote(false)
          setCurrentPlayingNote(null)
        }
      }, 1000) // Increased timeout to ensure video starts playing
      
      // Show smart confirmation message with time range
      const timeRange = `${formatTime(note.startTime)} - ${formatTime(note.endTime)}`
      const message = getSmartConfirmationMessage('notes', 'play', note.note, timeRange)
      showToast('Playing Note', message, 'info')
    } else {
      // No end time, just play from start time
      const timeRange = `from ${formatTime(note.startTime)}`
      const message = getSmartConfirmationMessage('notes', 'play', note.note, timeRange)
      showToast('Playing Note', message, 'info')
    }
  }
  
  // Handle note end - simply stop playback
  const handleNoteEnd = (note: any): void => {
    console.log('Note ended, stopping playback')
    
    // Clear any existing timeouts
    clearStopTimeout()
    
    // Stop playback
    stopVideo()
    setIsPlayingNote(false)
    setCurrentPlayingNote(null)
  }
  
  
  
  
  
  

  // Handle stop note playback
  const handleStopNote = (): void => {
    clearStopTimeout()
    stopVideo()
    setIsPlayingNote(false)
    setCurrentPlayingNote(null)
    showToast('Note Stopped', 'Playback stopped', 'info')
  }

  // Start adding a note
  const handleAddNote = (): void => {
    const currentTime = getCurrentVideoTime()
    setNoteStartTime(currentTime)
    setNoteEndTime(null)
    setNoteComment('')
    setIsAddingNote(true)
    showToast('Note Started', `Note started at ${formatTime(currentTime)}`, 'info')
  }

  // Save note
  const handleSaveNote = async (): Promise<void> => {
    if (!noteStartTime || !selectedVideo) {
      showToast('Error', 'Missing required data for note', 'destructive')
      return
    }
    
    const endTime = noteEndTime || getCurrentVideoTime()
    
    if (!noteComment.trim()) {
      showToast('Comment Required', 'Please add a comment for your note', 'destructive')
      return
    }

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: selectedVideo.id,
          title: selectedVideo.title,
          channelName: getChannelName(selectedVideo),
          thumbnail: getThumbnailUrl(selectedVideo),
          note: noteComment.trim(),
          startTime: noteStartTime,
          endTime: endTime,
          isClip: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save note')
      }
      
      const newNote = await response.json()
      setVideoNotes(prev => [...prev, newNote])
      setAllNotes(prev => [...prev, newNote]) // Also update allNotes
      
      // Reset all note states
      setShowCommentInterface(false)
      setNoteComment('')
      setNoteStartTime(null)
      setNoteEndTime(null)
      
      const timeRange = noteStartTime && noteEndTime ? `${formatTime(noteStartTime)} - ${formatTime(noteEndTime)}` : undefined
      const message = getSmartConfirmationMessage('notes', 'save', selectedVideo.title, timeRange)
      showToast('Note Saved', message, 'success')
    } catch (error) {
      console.error('Error saving note:', error)
      showToast('Error', error instanceof Error ? error.message : 'Failed to save note', 'destructive')
    }
  }

  // Delete note
  const handleDeleteNote = async (noteId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete note')
      }
      
      setVideoNotes(prev => prev.filter(note => note.id !== noteId))
      setAllNotes(prev => prev.filter(note => note.id !== noteId)) // Also update allNotes
      
      // Clear playing state if this note was being played
      if (currentPlayingNote?.id === noteId) {
        clearStopTimeout()
        setIsPlayingNote(false)
        setCurrentPlayingNote(null)
      }
      
      const noteToDelete = videoNotes.find(note => note.id === noteId)
      const message = noteToDelete 
        ? getSmartConfirmationMessage('notes', 'delete', noteToDelete.note)
        : 'Note deleted successfully'
      showToast('Note Deleted', message, 'success')
    } catch (error) {
      console.error('Error deleting note:', error)
      showToast('Error', error instanceof Error ? error.message : 'Failed to delete note', 'destructive')
    }
  }

  // Start editing note
  const handleEditNote = (note: any): void => {
    setEditingNote(note)
    setEditComment(note.note)
  }

  // Cancel editing
  const handleCancelEdit = (): void => {
    setEditingNote(null)
    setEditComment('')
  }

  // Save edited note
  const handleSaveEdit = async (): Promise<void> => {
    if (!editingNote || !editComment.trim()) {
      showToast('Error', 'Note comment cannot be empty', 'destructive')
      return
    }

    try {
      const response = await fetch(`/api/notes/${editingNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: editComment.trim(),
          fontSize: 16
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update note')
      }
      
      const updatedNote = await response.json()
      setVideoNotes(prev => prev.map(note => 
        note.id === editingNote.id ? updatedNote : note
      ))
      
      // Update playing note if it's the one being edited
      if (currentPlayingNote?.id === editingNote.id) {
        setCurrentPlayingNote(updatedNote)
      }
      
      setEditingNote(null)
      setEditComment('')
      showToast('Note Updated', 'Note updated successfully', 'success')
    } catch (error) {
      console.error('Error updating note:', error)
      showToast('Error', error instanceof Error ? error.message : 'Failed to update note', 'destructive')
    }
  }

  // Notes management functions
  const getFilteredNotes = useCallback(() => {
    let filtered = allNotes

    // Search filter
    if (notesSearchQuery) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(notesSearchQuery.toLowerCase()) ||
        note.channelName.toLowerCase().includes(notesSearchQuery.toLowerCase()) ||
        note.note.toLowerCase().includes(notesSearchQuery.toLowerCase())
      )
    }

    // Channel filter
    if (selectedNoteChannel !== 'all') {
      filtered = filtered.filter(note => note.channelName === selectedNoteChannel)
    }

    // Video filter
    if (selectedNoteVideo !== 'all') {
      filtered = filtered.filter(note => note.videoId === selectedNoteVideo)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[noteSortBy]
      let bValue = b[noteSortBy]
      
      if (noteSortBy === 'title') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      } else {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }
      
      if (noteSortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [allNotes, notesSearchQuery, selectedNoteChannel, selectedNoteVideo, noteSortBy, noteSortOrder])

  // Update note
  const handleUpdateNote = async () => {
    if (!editingNote) return

    try {
      const response = await fetch(`/api/notes/${editingNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: editingNote.note,
          fontSize: editingNote.fontSize
        })
      })

      if (!response.ok) throw new Error('Failed to update note')
      
      const updatedNote = await response.json()
      setVideoNotes(prev => 
        prev.map(note => 
          note.id === editingNote.id ? updatedNote : note
        )
      )
      setAllNotes(prev => 
        prev.map(note => 
          note.id === editingNote.id ? updatedNote : note
        )
      )
      
      showToast('Success', 'Note updated successfully', 'success')
      setIsEditNoteDialogOpen(false)
      setEditingNote(null)
    } catch (error) {
      showToast('Error', 'Failed to update note', 'destructive')
    }
  }

  // Format time for display
  const formatNoteTime = (seconds: number | null) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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
      // Clear all note-related timeouts on unmount
      clearStopTimeout()
    }
  }, [searchInputTimeout])

  // Smart tab switching with previous tab tracking
  const handleTabSwitch = (newTab: Tab) => {
    if (activeTab !== 'player' && newTab !== 'player') {
      sessionStorage.setItem('previousTab', activeTab)
    }
    setActiveTab(newTab)
  }

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
        const tabs: Tab[] = ['home', 'search', 'player', 'watched', 'channels', 'favorites', 'notes']
        const currentIndex = tabs.indexOf(activeTab)
        
        if (swipeDistance > 0) {
          if (currentIndex > 0) {
            const newTab = tabs[currentIndex - 1]
            handleTabSwitch(newTab)
            const itemCount = getTabItemCount(newTab)
            const message = getSmartConfirmationMessage('navigation', 'tabSwitch', newTab, itemCount)
            showToast('Tab Navigation', message, 'info')
          }
        } else {
          if (currentIndex < tabs.length - 1) {
            const newTab = tabs[currentIndex + 1]
            handleTabSwitch(newTab)
            const itemCount = getTabItemCount(newTab)
            const message = getSmartConfirmationMessage('navigation', 'tabSwitch', newTab, itemCount)
            showToast('Tab Navigation', message, 'info')
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
  }, [activeTab, showToast, handleTabSwitch])

  // Clear selection function
  const clearSelection = useCallback(() => {
    setSelectedItems(new Set())
  }, [])

  // Handle multi-select mode toggle with smart confirmation
  const handleMultiSelectToggle = useCallback((enabled: boolean) => {
    setMultiSelectMode(enabled)
    if (enabled) {
      clearSelection()
      const totalItems = searchResults?.items.length || favoriteVideos.length || watchedVideos.length || videoNotes.length || 0
      const message = getSmartConfirmationMessage('multiSelect', 'enabled', totalItems)
      showToast('Multi-Select Mode', message, 'info')
    } else {
      clearSelection()
      showToast('Multi-Select Mode', 'Multi-select disabled', 'info')
    }
  }, [clearSelection, searchResults?.items.length, favoriteVideos.length, watchedVideos.length, videoNotes.length, showToast, getSmartConfirmationMessage])

  // Keyboard navigation for tabs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const tabs: Tab[] = ['home', 'search', 'player', 'watched', 'channels', 'favorites', 'notes']
      const currentIndex = tabs.indexOf(activeTab)

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          if (currentIndex > 0) {
            const newTab = tabs[currentIndex - 1]
            handleTabSwitch(newTab)
            const itemCount = getTabItemCount(newTab)
            const message = getSmartConfirmationMessage('navigation', 'tabSwitch', newTab, itemCount)
            showToast('Tab Navigation', message, 'info')
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (currentIndex < tabs.length - 1) {
            const newTab = tabs[currentIndex + 1]
            handleTabSwitch(newTab)
            const itemCount = getTabItemCount(newTab)
            const message = getSmartConfirmationMessage('navigation', 'tabSwitch', newTab, itemCount)
            showToast('Tab Navigation', message, 'info')
          }
          break
        case 'm':
        case 'M':
          e.preventDefault()
          handleMultiSelectToggle(!multiSelectMode)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, showToast, getTabItemCount, getSmartConfirmationMessage, handleMultiSelectToggle, multiSelectMode, handleTabSwitch])

  // Format time for display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Load video notes when selected video changes
  useEffect(() => {
    if (selectedVideo) {
      loadVideoNotes(selectedVideo.id)
    }
    
    // Clear any ongoing note playback when video changes
    clearStopTimeout()
    setIsPlayingNote(false)
    setCurrentPlayingNote(null)
  }, [selectedVideo])

  // Load all notes when notes tab is activated
  useEffect(() => {
    if (activeTab === 'notes') {
      loadAllNotes()
    }
  }, [activeTab])

  // Cleanup stop timeout on unmount
  useEffect(() => {
    return () => {
      clearStopTimeout()
    }
  }, [])

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
        showSmartConfirmation('search', 'initial', cachedResults.items.length, trimmedQuery)
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
        showToast('Search Error', data.error, 'destructive')
        if (!append) setSearchResults(null)
        return
      }
      
      if (!data.items || data.items.length === 0) {
        if (!append) {
          const message = getSmartConfirmationMessage('search', 'noResults', queryToUse)
          showToast('No Results', message, 'info')
          setSearchResults({ items: [] })
          setCachedResults(queryToUse, [], null, false)
        } else {
          const message = getSmartConfirmationMessage('search', 'noMore')
          showToast('No More Videos', message, 'info')
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
        showSmartConfirmation('search', 'initial', finalItems.length, queryToUse)
      } else {
        const totalItems = finalItems.length
        showSmartConfirmation('search', 'loadMore', data.items.length, totalItems)
      }
      
    } catch (error) {
      console.error('Search error:', error)
      showToast('Search Failed', 'An error occurred while searching. Please try again.', 'destructive')
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
    sessionStorage.setItem('previousTab', activeTab) // Track the previous page
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
      await loadVideoNotes(video.id)
    } catch (error) {
      console.error('Failed to add to watched:', error)
    }
  }

  const toggleFavorite = async (video: Video) => {
    try {
      const isFavorite = favoriteVideos.some(v => v.id === video.id)
      const thumbnailUrl = getThumbnailUrl(video)
      
      if (isFavorite) {
        showDynamicLoading('favorites')
        const response = await fetch(`/api/favorites/${video.id}`, { 
          method: 'DELETE' 
        })
        
        if (response.ok) {
          showSmartConfirmation('favorites', 'remove', video.title)
          await loadFavoriteVideos()
        } else {
          showToast('Error', 'Failed to remove from favorites', 'destructive')
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
          showSmartConfirmation('favorites', 'add', video.title)
          await loadFavoriteVideos()
        } else {
          showToast('Error', 'Failed to add to favorites', 'destructive')
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      showToast('Error', 'Network error while updating favorites', 'destructive')
    } finally {
      setDynamicLoadingMessage('')
    }
  }

  const loadWatchedVideos = async (): Promise<void> => {
    try {
      const response = await fetch('/api/watched')
      if (!response.ok) throw new Error('Failed to fetch watched videos')
      const data = await response.json()
      // Normalize database data to match Video interface
      const normalizedData = (data || []).map((item: any) => ({
        id: item.videoId, // Map videoId to id for consistency
        videoId: item.videoId,
        title: item.title,
        channelName: item.channelName,
        thumbnail: item.thumbnail,
        duration: item.duration,
        viewCount: item.viewCount,
        watchedAt: item.watchedAt
      }))
      setWatchedVideos(normalizedData)
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
      // Normalize database data to match Video interface
      const normalizedData = (data || []).map((item: any) => ({
        id: item.videoId, // Map videoId to id for consistency
        videoId: item.videoId,
        title: item.title,
        channelName: item.channelName,
        thumbnail: item.thumbnail,
        duration: item.duration,
        viewCount: item.viewCount,
        addedAt: item.addedAt
      }))
      setFavoriteVideos(normalizedData)
    } catch (error) {
      console.error('Failed to load favorite videos:', error)
      setFavoriteVideos([])
    }
  }

  // Load video notes for the current video
  const loadVideoNotes = async (videoId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/notes?videoId=${encodeURIComponent(videoId)}`)
      if (!response.ok) throw new Error('Failed to fetch notes')
      const data = await response.json()
      console.log('Loaded video notes:', data)
      setVideoNotes(data)
    } catch (error) {
      console.error('Failed to load video notes:', error)
      setVideoNotes([])
    }
  }

  // Load all notes for the notes tab
  const loadAllNotes = async (): Promise<void> => {
    try {
      const response = await fetch('/api/notes')
      if (!response.ok) throw new Error('Failed to fetch all notes')
      const data = await response.json()
      setAllNotes(data)
    } catch (error) {
      console.error('Failed to load all notes:', error)
      setAllNotes([])
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
      showToast('Error', 'Failed to search channels', 'destructive')
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
          const message = getSmartConfirmationMessage('channels', 'unfollow', channel.name)
          showToast('Unfollowed', message, 'success')
          await loadFavoriteChannels()
        } else {
          showToast('Error', 'Failed to unfollow channel', 'destructive')
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
          const subscriberCount = channel.subscriberCount ? formatViewCount(channel.subscriberCount) : undefined
          const message = getSmartConfirmationMessage('channels', 'follow', channel.name, subscriberCount)
          showToast('Following', message, 'success')
          await loadFavoriteChannels()
        } else {
          showToast('Error', 'Failed to follow channel', 'destructive')
        }
      }
    } catch (error) {
      console.error('Error following channel:', error)
      showToast('Error', 'Network error while following channel', 'destructive')
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
      const wasSelected = newSelected.has(itemId)
      
      if (wasSelected) {
        newSelected.delete(itemId)
      } else {
        newSelected.add(itemId)
      }
      
      // Show selection feedback with smart confirmation
      const totalItems = searchResults?.items.length || favoriteVideos.length || watchedVideos.length || videoNotes.length || 0
      const selectedCount = newSelected.size
      const message = getSmartConfirmationMessage('multiSelect', 'selection', selectedCount, totalItems)
      
      // Only show feedback for multi-select mode changes
      if (multiSelectMode) {
        showToast('Selection Updated', message, 'info')
      }
      
      return newSelected
    })
  }, [multiSelectMode, searchResults?.items.length, favoriteVideos.length, watchedVideos.length, videoNotes.length, showToast, getSmartConfirmationMessage])

  // Handle auto-load toggle with smart confirmation
  const handleAutoLoadToggle = useCallback((enabled: boolean) => {
    setAutoLoadMore(enabled)
    localStorage.setItem('mytube-auto-load-more', enabled.toString())
    const message = getSmartConfirmationMessage('settings', 'autoLoad', enabled)
    showToast('Settings Updated', message, 'success')
  }, [showToast])

  

  const favoriteVideoIds = useMemo(() => 
    new Set(favoriteVideos.map(v => v.id)), 
    [favoriteVideos]
  )

  const tabs = useMemo(() => [
    { id: 'home' as Tab, icon: Home, label: 'Home' },
    { id: 'search' as Tab, icon: Search, label: 'Search' },
    { id: 'player' as Tab, icon: Play, label: 'Player' },
    { id: 'watched' as Tab, icon: Clock, label: 'Watched' },
    { id: 'channels' as Tab, icon: User, label: 'Channels' },
    { id: 'favorites' as Tab, icon: Heart, label: 'Favorites' },
    { id: 'notes' as Tab, icon: FileText, label: 'Notes' },
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
                      handleVideoPlay(video)
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
                        onClick={() => handleTabSwitch('search')}
                        className="w-full sm:w-auto"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Search Videos
                      </Button>
                      <Button
                        onClick={() => handleTabSwitch('channels')}
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
                          onCheckedChange={handleAutoLoadToggle}
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
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                      Now Playing
                    </h2>
                    <Button
                      onClick={() => {
                        // Smart back button logic
                        const previousTab = sessionStorage.getItem('previousTab')
                        if (previousTab && previousTab !== 'player') {
                          setActiveTab(previousTab as Tab)
                          sessionStorage.removeItem('previousTab') // Clear after use
                        } else {
                          setActiveTab('home')
                          sessionStorage.removeItem('previousTab') // Clear stale data
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </Button>
                  </div>
                  <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
                    <YouTubePlayer
                      ref={youtubePlayerRef}
                      videoId={selectedVideo.id}
                      width="100%"
                      height="100%"
                      onReady={handleYouTubePlayerReady}
                      onStateChange={handleYouTubePlayerStateChange}
                      onError={handleYouTubePlayerError}
                      onEnd={handleVideoEnd}
                      autoplay={false}
                      mute={true}
                      className="w-full h-full"
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
                    <Button
                      onClick={() => {
                        if (isAddingNote) {
                          // Stop recording and show comment interface
                          const endTime = getCurrentVideoTime()
                          setNoteEndTime(endTime)
                          setIsAddingNote(false)
                          setShowCommentInterface(true)
                          showToast('Note Stopped', `Note recorded from ${formatTime(noteStartTime || 0)} to ${formatTime(endTime)}. Add your comment below.`, 'info')
                        } else {
                          // Start recording
                          handleAddNote()
                        }
                      }}
                      className={`flex-1 sm:flex-none transition-all duration-200 hover:scale-105 ${
                        isAddingNote 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isAddingNote ? (
                        <>
                          <Square className="w-4 h-4 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Note
                        </>
                      )}
                    </Button>
                    {isPlayingNote && (
                      <>
                        <Button
                          onClick={handleStopNote}
                          className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white transition-all duration-200 hover:scale-105"
                        >
                          <Square className="w-4 h-4 mr-2" />
                          Stop
                        </Button>
                        
                      </>
                    )}
                  </div>
                </div>

                {/* Note Taking Interface */}
                {showCommentInterface && (
                  <div className="bg-gradient-to-r from-blue-10 via-blue-5 to-transparent rounded-xl p-4 sm:p-6 border border-blue-20">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-blue-700">Add Note Comment</h3>
                      <Button
                        onClick={() => {
                          setShowCommentInterface(false)
                          setNoteComment('')
                          setNoteStartTime(null)
                          setNoteEndTime(null)
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white/50 rounded-lg p-3 border border-blue-100">
                          <label className="text-sm font-medium text-blue-700">Start Time</label>
                          <p className="text-lg font-mono text-blue-900">{formatTime(noteStartTime || 0)}</p>
                        </div>
                        <div className="bg-white/50 rounded-lg p-3 border border-blue-100">
                          <label className="text-sm font-medium text-blue-700">Current Time</label>
                          <p className="text-lg font-mono text-blue-900">{formatTime(getCurrentVideoTime())}</p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-blue-700 mb-2 block">Note Comment</label>
                        <textarea
                          value={noteComment}
                          onChange={(e) => setNoteComment(e.target.value)}
                          placeholder="Add your comment or note about this video segment..."
                          className="w-full p-3 border border-blue-200 rounded-lg resize-none h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={handleSaveNote}
                          disabled={!noteComment.trim()}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Note
                        </Button>
                        <Button
                          onClick={() => {
                            setShowCommentInterface(false)
                            setNoteComment('')
                            setNoteStartTime(null)
                            setNoteEndTime(null)
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Video Notes List */}
                {videoNotes.length > 0 && (
                  <div className="bg-gradient-to-r from-amber-10 via-amber-5 to-transparent rounded-xl p-4 sm:p-6 border border-amber-20">
                    <h3 className="text-lg font-semibold mb-4 text-amber-700">Video Notes ({videoNotes.length})</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {videoNotes.map((note) => (
                        <Card key={note.id} className={`p-4 hover:shadow-md transition-shadow ${
                          isPlayingNote && currentPlayingNote?.id === note.id 
                            ? 'ring-2 ring-blue-500 bg-blue-50/50' 
                            : ''
                        }`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  {formatTime(note.startTime)} - {formatTime(note.endTime)}
                                </Badge>
                                {isPlayingNote && currentPlayingNote?.id === note.id ? (
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs text-red-600 font-medium">Playing</span>
                                  </div>
                                ) : (
                                  <Button
                                    onClick={() => handlePlayNote(note)}
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Play className="w-3 h-3 mr-1" />
                                    Play
                                  </Button>
                                )}
                                {isPlayingNote && currentPlayingNote?.id === note.id && (
                                  <>
                                    <Button
                                      onClick={handleStopNote}
                                      size="sm"
                                      variant="outline"
                                      className="h-6 px-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 border-red-200"
                                    >
                                      <Square className="w-3 h-3 mr-1" />
                                      Stop
                                    </Button>
                                    
                                  </>
                                )}
                              </div>
                              
                              {editingNote?.id === note.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editComment}
                                    onChange={(e) => setEditComment(e.target.value)}
                                    className="w-full p-2 border border-blue-200 rounded text-sm resize-none h-16 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Edit your note..."
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={handleSaveEdit}
                                      size="sm"
                                      className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                                    >
                                      <Save className="w-3 h-3 mr-1" />
                                      Save
                                    </Button>
                                    <Button
                                      onClick={handleCancelEdit}
                                      size="sm"
                                      variant="outline"
                                      className="h-6 px-2 text-xs"
                                    >
                                      <X className="w-3 h-3 mr-1" />
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm font-medium mb-1">{note.note}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Created {new Date(note.createdAt).toLocaleDateString()}
                                  </p>
                                  {note.endTime && note.endTime > note.startTime && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      Duration: {formatTime(note.endTime - note.startTime)}
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                            
                            {editingNote?.id !== note.id && (
                              <div className="flex gap-1">
                                <Button
                                  onClick={() => handleEditNote(note)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => handleDeleteNote(note.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
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

      case 'notes':
        const filteredNotes = getFilteredNotes()
        const channels = Array.from(new Set(allNotes.map(note => note.channelName)))
        const videos = Array.from(new Set(allNotes.map(note => ({ id: note.videoId, title: note.title }))))
        
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-10 via-blue-5 to-transparent rounded-2xl p-6 border border-blue-20">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-2">
                    Video Notes
                  </h2>
                  <p className="text-muted-foreground">Manage your video notes and clips</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    {allNotes.length} {allNotes.length === 1 ? 'note' : 'notes'} total
                    {allNotes.filter(n => n.isClip).length > 0 && (
                      <> • {allNotes.filter(n => n.isClip).length} clip{allNotes.filter(n => n.isClip).length > 1 ? 's' : ''}</>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search notes, videos, or channels..."
                        value={notesSearchQuery}
                        onChange={(e) => setNotesSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap gap-2">
                    <Select value={selectedNoteChannel} onValueChange={setSelectedNoteChannel}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Channels</SelectItem>
                        {channels.map((channel) => (
                          <SelectItem key={channel} value={channel}>
                            {channel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedNoteVideo} onValueChange={setSelectedNoteVideo}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Video" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Videos</SelectItem>
                        {videos.map((video) => (
                          <SelectItem key={video.id} value={video.id}>
                            {video.title.length > 30 ? video.title.substring(0, 30) + '...' : video.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={noteSortBy} onValueChange={(value: any) => setNoteSortBy(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Created</SelectItem>
                        <SelectItem value="updatedAt">Updated</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setNoteSortOrder(noteSortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      <ArrowDown className={`w-4 h-4 ${noteSortOrder === 'desc' ? '' : 'rotate-180'}`} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes List */}
            {filteredNotes.length > 0 ? (
              <div className="space-y-4">
                {filteredNotes.map((note) => (
                  <Card key={note.id} className="group hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        <div className="relative flex-shrink-0">
                          <img
                            src={note.thumbnail}
                            alt={note.title}
                            className="w-24 h-16 object-cover rounded-lg"
                          />
                          {note.isClip && (
                            <Badge className="absolute top-1 left-1 bg-blue-600 text-white text-xs">
                              Clip
                            </Badge>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-lg mb-1 truncate">{note.title}</h3>
                              <p className="text-sm text-muted-foreground mb-2">{note.channelName}</p>
                              
                              {/* Time Range */}
                              {(note.startTime !== null || note.endTime !== null) && (
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {formatNoteTime(note.startTime)} - {formatNoteTime(note.endTime)}
                                  </Badge>
                                  {note.endTime && note.startTime && note.endTime > note.startTime && (
                                    <span className="text-xs text-muted-foreground">
                                      Duration: {formatNoteTime(note.endTime - note.startTime)}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Note Content */}
                              <p className="text-sm mb-3 line-clamp-3">{note.note}</p>
                              
                              {/* Metadata */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Created {new Date(note.createdAt).toLocaleDateString()}</span>
                                {note.updatedAt !== note.createdAt && (
                                  <span>Updated {new Date(note.updatedAt).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => {
                                  if (note.startTime !== null) {
                                    handlePlayNote(note)
                                  }
                                }}
                                size="sm"
                                variant="outline"
                                className="h-8"
                              >
                                <Play className="w-3 h-3 mr-1" />
                                Play
                              </Button>
                              
                              {isPlayingNote && currentPlayingNote?.id === note.id && (
                                <>
                                  <Button
                                    onClick={handleStopNote}
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 border-red-200"
                                  >
                                    <Square className="w-3 h-3 mr-1" />
                                    Stop
                                  </Button>
                                  
                                </>
                              )}
                              
                              <Button
                                onClick={() => {
                                  setEditingNote(note)
                                  setIsEditNoteDialogOpen(true)
                                }}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                onClick={() => handleDeleteNote(note.id)}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Notes Found</p>
                <p className="text-muted-foreground mb-4">
                  {videoNotes.length === 0 
                    ? "Notes are created from the video player while watching videos" 
                    : "Try adjusting your search or filters"
                  }
                </p>
              </div>
            )}

            {/* Edit Note Dialog */}
            <Dialog open={isEditNoteDialogOpen} onOpenChange={setIsEditNoteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Note</DialogTitle>
                </DialogHeader>
                {editingNote && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Note</label>
                      <Textarea
                        value={editingNote.note}
                        onChange={(e) => setEditingNote(prev => ({ ...prev, note: e.target.value }))}
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Font Size</label>
                      <Input
                        type="number"
                        value={editingNote.fontSize}
                        onChange={(e) => setEditingNote(prev => ({ ...prev, fontSize: parseInt(e.target.value) || 16 }))}
                        min="8"
                        max="32"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsEditNoteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateNote}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
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

      {/* Desktop Tabs Bar - Visible on desktop only */}
      <div className="hidden md:block bg-card/95 backdrop-blur-lg border-b border-border sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 py-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabSwitch(tab.id)}
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
              onClick={() => handleTabSwitch(tab.id)}
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