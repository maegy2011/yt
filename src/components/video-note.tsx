'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import YouTube from 'react-youtube'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Play, Pause, RotateCcw, Plus, Trash2, Save, Bookmark, Edit, Clock, MessageSquare, User, Eye, Heart, ChevronLeft, ChevronRight, Loader2, Scissors, Volume2, VolumeX, Maximize2 } from 'lucide-react'
import { useBackgroundPlayer } from '@/contexts/background-player-context'

// Import YouTube utility functions (we'll need to create these)
const formatViewCount = (count: number | string | undefined | null): string => {
  if (count === undefined || count === null) return '0 views'
  
  const numCount = typeof count === 'string' ? parseInt(count) : count
  
  if (isNaN(numCount) || numCount < 0) return '0 views'
  
  if (numCount >= 1000000) {
    return `${(numCount / 1000000).toFixed(1)}M views`
  } else if (numCount >= 1000) {
    return `${(numCount / 1000).toFixed(1)}K views`
  } else {
    return `${numCount} views`
  }
}

const formatPublishedAt = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 30) {
    return `${diffDays} days ago`
  } else if (diffDays < 365) {
    return `${Math.floor(diffDays / 30)} months ago`
  } else {
    return `${Math.floor(diffDays / 365)} years ago`
  }
}

const getChannelName = (video: any): string => {
  return video.channelName || video.channel?.name || 'Unknown Channel'
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

interface VideoNote {
  id: string
  videoId: string
  title: string
  channelName: string
  thumbnail?: string
  note: string
  fontSize?: number
  startTime?: number
  endTime?: number
  isClip?: boolean
  createdAt: string
  updatedAt: string
}

interface VideoNoteProps {
  videoId: string
  videoTitle: string
  channelName?: string
  viewCount?: number
  publishedAt?: string
  thumbnail?: string
  isFavorited?: boolean
  favoritesEnabled?: boolean
  favoritesPaused?: boolean
  onFavoriteToggle?: () => void
  onPreviousVideo?: () => void
  onNextVideo?: () => void
  onNotesChange?: () => void
}

export function VideoNote({ 
  videoId, 
  videoTitle, 
  channelName, 
  viewCount, 
  publishedAt, 
  thumbnail,
  isFavorited: propIsFavorited,
  favoritesEnabled = true,
  favoritesPaused = false,
  onFavoriteToggle,
  onPreviousVideo,
  onNextVideo,
  onNotesChange
}: VideoNoteProps) {
  // Background player context
  const {
    backgroundVideo,
    isPlaying: isBackgroundPlaying,
    playBackgroundVideo,
    pauseBackgroundVideo,
    stopBackgroundVideo,
  } = useBackgroundPlayer()

  const [notes, setNotes] = useState<VideoNote[]>([])
  const [filteredNotes, setFilteredNotes] = useState<VideoNote[]>([])
  const [notesSearchQuery, setNotesSearchQuery] = useState('')
  const [newNote, setNewNote] = useState({ title: '', note: '', startTime: 0, endTime: 30 })
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [autoStopTriggered, setAutoStopTriggered] = useState(false)
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [quickNoteCapturing, setQuickNoteCapturing] = useState(false)
  const [quickNoteStartTime, setQuickNoteStartTime] = useState(0)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteTitle, setEditingNoteTitle] = useState('')
  const [editingNoteContent, setEditingNoteContent] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)
  const [playerReady, setPlayerReady] = useState(false)
  const playerRef = useRef<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Local notification system
  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
  } | null>(null)

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  // Navigation functions
  const handlePreviousVideo = useCallback(() => {
    if (onPreviousVideo) {
      onPreviousVideo()
    } else {
      showNotification('Previous video feature not available', 'info')
    }
  }, [onPreviousVideo, showNotification])

  const handleNextVideo = useCallback(() => {
    if (onNextVideo) {
      onNextVideo()
    } else {
      showNotification('Next video feature not available', 'info')
    }
  }, [onNextVideo, showNotification])

  const toggleFavorite = async () => {
    if (!favoritesEnabled) {
      showNotification('Favorites Disabled: Favorites module is disabled', 'info')
      return
    }
    
    if (favoritesPaused) {
      showNotification('Favorites Paused: Cannot add/remove favorites while paused', 'info')
      return
    }
    
    if (onFavoriteToggle) {
      onFavoriteToggle()
    } else {
      // Fallback if no callback provided
      showNotification('Favorite toggle not available', 'info')
    }
  }

  const toggleQuickNote = async () => {
    if (!playerRef.current || !playerReady) {
      showNotification('Please wait for the video to load', 'error')
      return
    }

    if (!quickNoteCapturing) {
      // Start capturing
      let accurateCurrentTime = currentTime
      try {
        accurateCurrentTime = playerRef.current.getCurrentTime()
      } catch (error) {
        console.error('Error getting current time:', error)
      }
      
      const startTime = Math.floor(accurateCurrentTime)
      setQuickNoteStartTime(startTime)
      setQuickNoteCapturing(true)
      showNotification(`Recording from ${formatTime(startTime)}`, 'info')
    } else {
      // Stop and save
      let accurateCurrentTime = currentTime
      try {
        accurateCurrentTime = playerRef.current.getCurrentTime()
      } catch (error) {
        console.error('Error getting current time:', error)
      }
      
      const endTime = Math.floor(accurateCurrentTime)
      if (endTime > quickNoteStartTime) {
        try {
          const response = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              videoId,
              title: `Quick Note ${formatTime(quickNoteStartTime)}-${formatTime(endTime)}`,
              channelName: channelName || '',
              thumbnail: thumbnail || '',
              note: `Quick clip from ${formatTime(quickNoteStartTime)} to ${formatTime(endTime)}`,
              startTime: quickNoteStartTime,
              endTime: endTime,
              isClip: true
            })
          })
          
          if (response.ok) {
            setQuickNoteCapturing(false)
            setQuickNoteStartTime(0)
            showNotification(`Clip saved from ${formatTime(quickNoteStartTime)} to ${formatTime(endTime)}`, 'success')
            
            // Call parent callback to refresh notes
            if (onNotesChange) {
              onNotesChange()
            }
          } else {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
          }
        } catch (error) {
          console.error('Failed to save quick note:', error)
          showNotification('Failed to save quick note. Please try again.', 'error')
        }
      } else {
        showNotification('End time must be greater than start time', 'error')
      }
    }
  }

  // Filter notes based on search query
  useEffect(() => {
    if (!notesSearchQuery.trim()) {
      setFilteredNotes(notes)
    } else {
      const query = notesSearchQuery.toLowerCase()
      const filtered = notes.filter(note => 
        note.title.toLowerCase().includes(query) ||
        note.note.toLowerCase().includes(query) ||
        note.channelName?.toLowerCase().includes(query)
      )
      setFilteredNotes(filtered)
    }
  }, [notes, notesSearchQuery])

  // Load notes from API
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const response = await fetch('/api/notes')
        if (response.ok) {
          const data = await response.json()
          // Filter notes for this video
          const videoNotes = data.filter((note: any) => note.videoId === videoId)
          setNotes(videoNotes)
        }
      } catch (error) {
        console.error('Failed to load notes:', error)
        showNotification('Failed to load notes', 'error')
      }
    }
    
    loadNotes()
  }, [videoId, onNotesChange]) // Reload when videoId changes or onNotesChange is called

  // Monitor video progress for current time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        try {
          const currentTime = playerRef.current.getCurrentTime()
          setCurrentTime(currentTime)
        } catch (error) {
          console.error('Error getting current time:', error)
        }
      }
    }, 100) // Update every 100ms for more accuracy

    return () => clearInterval(interval)
  }, []) // Run once on mount

  // Monitor video progress and enforce timestamp limits
  useEffect(() => {
    if (isPlaying && playerRef.current && activeNoteId) {
      const activeNote = notes.find(note => note.id === activeNoteId)
      if (!activeNote) return

      intervalRef.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          try {
            const currentTime = playerRef.current.getCurrentTime()
            const playerState = playerRef.current.getPlayerState()
            
            setCurrentTime(currentTime)
            
            // Only check end time if video is actually playing (state === 1)
            if (playerState === 1 && currentTime >= activeNote.endTime) {
              console.log('Auto-stopping at end time:', currentTime, '>=', activeNote.endTime)
              setAutoStopTriggered(true)
              playerRef.current.pauseVideo()
              setIsPlaying(false)
              
              // Reset to start time after a brief delay
              setTimeout(() => {
                if (playerRef.current) {
                  playerRef.current.seekTo(activeNote.startTime, true)
                  setCurrentTime(activeNote.startTime)
                  setAutoStopTriggered(false)
                }
              }, 500)
            }
          } catch (error) {
            console.error('Error monitoring video progress:', error)
          }
        }
      }, 200) // Check every 200ms for better responsiveness
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, activeNoteId, notes])

  const handleAddNote = async () => {
    if (newNote.title.trim() && newNote.startTime < newNote.endTime) {
      try {
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId,
            title: newNote.title,
            channelName: channelName || '',
            thumbnail: thumbnail || '',
            note: newNote.note,
            startTime: newNote.startTime,
            endTime: newNote.endTime,
            isClip: true
          })
        })
        
        if (response.ok) {
          setNewNote({ title: '', note: '', startTime: 0, endTime: 30 })
          setIsCapturing(false)
          showNotification('Note saved successfully', 'success')
          
          // Call parent callback to refresh notes
          if (onNotesChange) {
            onNotesChange()
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (error) {
        console.error('Failed to save note:', error)
        showNotification('Failed to save note. Please try again.', 'error')
      }
    }
  }

  const handleCaptureStart = () => {
    console.log('=== Set Start Button Clicked ===')
    console.log('Player ready:', playerReady)
    console.log('Current time (state):', currentTime)
    console.log('Player ref exists:', !!playerRef.current)
    
    // Get the most accurate current time directly from the player
    let accurateCurrentTime = currentTime
    
    if (playerRef.current && playerRef.current.getCurrentTime) {
      try {
        accurateCurrentTime = playerRef.current.getCurrentTime()
        console.log('Captured start time from player:', accurateCurrentTime)
      } catch (error) {
        console.error('Error getting current time from player:', error)
        // Fallback to state value
        accurateCurrentTime = currentTime
      }
    } else {
      console.warn('YouTube player not ready yet, using fallback time:', accurateCurrentTime)
    }
    
    const startTime = Math.floor(accurateCurrentTime)
    console.log('Final start time:', startTime)
    
    setNewNote({ 
      ...newNote, 
      startTime: startTime,
      endTime: Math.max(startTime + 1, newNote.endTime)
    })
    setIsCapturing(true)
    console.log('Start time set to:', startTime, 'from current time:', accurateCurrentTime)
    
    // Show notification to user
    showNotification(`Start time set to ${formatTime(startTime)}`, 'success')
  }

  const handleSaveNote = async () => {
    // Get the most accurate current time directly from the player
    let accurateCurrentTime = currentTime
    
    if (playerRef.current && playerRef.current.getCurrentTime) {
      try {
        accurateCurrentTime = playerRef.current.getCurrentTime()
        console.log('Captured end time from player:', accurateCurrentTime)
      } catch (error) {
        console.error('Error getting current time from player:', error)
        // Fallback to state value
        accurateCurrentTime = currentTime
      }
    }
    
    const endTime = Math.floor(accurateCurrentTime)
    if (endTime > newNote.startTime) {
      try {
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId,
            title: newNote.title || `Clip from ${formatTime(newNote.startTime)} to ${formatTime(endTime)}`,
            channelName: channelName || '',
            thumbnail: thumbnail || '',
            note: newNote.note || `Clip from ${formatTime(newNote.startTime)} to ${formatTime(endTime)}`,
            startTime: newNote.startTime,
            endTime: endTime,
            isClip: true
          })
        })
        
        if (response.ok) {
          // Reset form
          setNewNote({ title: '', note: '', startTime: 0, endTime: 30 })
          setIsCapturing(false)
          
          // Show success notification
          showNotification(`Clip saved from ${formatTime(newNote.startTime)} to ${formatTime(endTime)}`, 'success')
          
          // Call parent callback to refresh notes
          if (onNotesChange) {
            onNotesChange()
          }
          
          console.log('Note saved with end time:', endTime, 'from current time:', accurateCurrentTime)
        } else {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (error) {
        console.error('Failed to save note:', error)
        showNotification('Failed to save note. Please try again.', 'error')
      }
    } else {
      // Show error notification
      showNotification('End time must be greater than start time. Please play the video forward before saving.', 'error')
      console.log('End time not greater than start time:', endTime, '<=', newNote.startTime)
    }
  }

  const handleUpdateNote = async (noteId: string, title: string, note: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: note,
          title: title,
          fontSize: 16 // You can make this configurable if needed
        })
      })
      
      if (response.ok) {
        setNotes(notes.map(note => 
          note.id === noteId ? { ...note, title, note } : note
        ))
        setEditingNoteId(null)
        showNotification('The note has been updated successfully', 'success')
        
        // Call parent callback to refresh notes
        if (onNotesChange) {
          onNotesChange()
        }
      } else {
        throw new Error('Failed to update note')
      }
    } catch (error) {
      console.error('Failed to update note:', error)
      showNotification('Failed to update note. Please try again.', 'error')
    }
  }

  const startEditingNote = (note: VideoNote) => {
    setEditingNoteId(note.id)
    setEditingNoteTitle(note.title)
    setEditingNoteContent(note.note || '')
  }

  const cancelEditingNote = () => {
    setEditingNoteId(null)
    setEditingNoteTitle('')
    setEditingNoteContent('')
  }

  const saveEditingNote = () => {
    if (editingNoteId && editingNoteTitle.trim()) {
      handleUpdateNote(editingNoteId, editingNoteTitle, editingNoteContent)
    }
  }

  const handleDeleteNote = (id: string) => {
    setNoteToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return
    
    try {
      const response = await fetch(`/api/notes/${noteToDelete}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setNotes(notes.filter(note => note.id !== noteToDelete))
        if (activeNoteId === noteToDelete) {
          setActiveNoteId(null)
        }
        showNotification('The note has been removed successfully', 'success')
        setDeleteConfirmOpen(false)
        setNoteToDelete(null)
        
        // Call parent callback to refresh notes
        if (onNotesChange) {
          onNotesChange()
        }
      } else {
        throw new Error('Failed to delete note')
      }
    } catch (error) {
      console.error('Failed to delete note:', error)
      showNotification('Failed to delete note. Please try again.', 'error')
      setDeleteConfirmOpen(false)
      setNoteToDelete(null)
    }
  }

  const cancelDeleteNote = () => {
    setDeleteConfirmOpen(false)
    setNoteToDelete(null)
  }

  const handlePlayNote = (note: VideoNote) => {
    if (playerRef.current) {
      playerRef.current.seekTo(note.startTime, true)
      playerRef.current.playVideo()
      setIsPlaying(true)
      setActiveNoteId(note.id)
    }
  }

  const handlePlay = () => {
    if (playerRef.current) {
      playerRef.current.playVideo()
      setIsPlaying(true)
    }
  }

  const handlePause = () => {
    if (playerRef.current) {
      playerRef.current.pauseVideo()
      setIsPlaying(false)
    }
  }

  // Background playback functions
  const handlePlayInBackground = () => {
    const videoData = {
      id: videoId,
      videoId: videoId,
      title: videoTitle,
      channelName: channelName || '',
      thumbnail: thumbnail || '',
      duration: duration.toString(),
      viewCount: viewCount || 0,
      publishedAt: publishedAt || '',
      isLive: false,
      description: ''
    }
    
    // Get current playback position
    const currentTime = playerRef.current?.getCurrentTime() || 0
    
    // Start background playback
    playBackgroundVideo(videoData)
    
    // Seek to current position after a short delay
    setTimeout(() => {
      if (playerRef.current) {
        playerRef.current.seekTo(currentTime, true)
      }
    }, 500)
    
    showNotification('Playing in background', 'info')
  }

  const handleStopBackground = () => {
    stopBackgroundVideo()
    showNotification('Background playback stopped', 'info')
  }

  const handleReset = () => {
    const activeNote = notes.find(note => note.id === activeNoteId)
    if (playerRef.current && activeNote) {
      playerRef.current.seekTo(activeNote.startTime, true)
      setCurrentTime(activeNote.startTime)
    }
  }

  const onReady = (event: any) => {
    playerRef.current = event.target
    setDuration(event.target.getDuration())
    setPlayerReady(true)
    
    // Initialize current time from player
    try {
      const initialTime = event.target.getCurrentTime()
      setCurrentTime(initialTime)
      console.log('YouTube player ready, initial time:', initialTime)
    } catch (error) {
      console.error('Error getting initial time from YouTube player:', error)
      setCurrentTime(0)
    }
    
    // Set initial video position if needed
    if (newNote.startTime > 0) {
      try {
        event.target.seekTo(newNote.startTime, true)
        setCurrentTime(newNote.startTime)
      } catch (error) {
        console.error('Error seeking to initial time:', error)
      }
    }
  }

  const onStateChange = (event: any) => {
    const state = event.data
    if (state === 1) { // Playing
      setIsPlaying(true)
    } else if (state === 2) { // Paused
      setIsPlaying(false)
    } else if (state === 0) { // Ended
      setIsPlaying(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const opts = {
    height: '390',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1,
      rel: 0,
      showinfo: 0,
      modestbranding: 1,
    },
  }

  // Validate and get the correct video ID
  const getValidVideoId = (id: string): string => {
    // If it's already a valid 11-character YouTube video ID, use it
    if (id && id.length === 11 && /^[a-zA-Z0-9_-]+$/.test(id)) {
      return id
    }
    
    // If it's a database video with videoId property, extract the actual YouTube ID
    if (id && id.includes('-')) {
      // This might be a database ID, not a YouTube video ID
      // In this case, we need to get the actual videoId from the video object
      console.error('Invalid YouTube video ID provided:', id)
      return ''
    }
    
    // Return empty string if invalid
    console.error('Invalid YouTube video ID format:', id)
    return ''
  }

  const validVideoId = getValidVideoId(videoId)
  
  // Don't render player if video ID is invalid
  if (!validVideoId) {
    return (
      <Card className="p-8">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium mb-2">Invalid Video ID</p>
          <p className="text-sm">The video ID provided is not a valid YouTube video ID.</p>
          <p className="text-xs mt-2 text-gray-500">Video ID: {videoId}</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 max-w-sm ${
          notification.type === 'success' ? 'bg-primary text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-primary text-white'
        }`}>
          {notification.message}
        </div>
      )}
      
      {/* YouTube-like Video Player Container */}
      <div className="bg-black rounded-lg overflow-hidden shadow-lg">
        {/* Video Player */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <div className="absolute inset-0">
            <YouTube
              videoId={validVideoId}
              opts={{
                ...opts,
                width: '100%',
                height: '100%'
              }}
              onReady={onReady}
              onStateChange={onStateChange}
              className="w-full h-full"
            />
          </div>
        </div>
        
        {/* Video Info Section - YouTube Style */}
        <div className="bg-white dark:bg-gray-900 p-4">
          <div className="flex flex-col gap-3">
            {/* Video Title with Quick Note Status */}
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
                {videoTitle}
              </h1>
              {quickNoteCapturing && (
                <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded-full animate-pulse">
                  <Scissors className="w-4 h-4 text-red-600 dark:text-red-400 fill-current" />
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {formatTime(currentTime - quickNoteStartTime)}
                  </span>
                </div>
              )}
            </div>
            
            {/* Channel and Stats Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Channel Avatar Placeholder */}
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                
                {/* Channel Name */}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {channelName || 'Unknown Channel'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {viewCount && formatViewCount(viewCount)} • {publishedAt && formatPublishedAt(publishedAt)}
                  </p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleQuickNote}
                  variant="ghost"
                  size="sm"
                  title={quickNoteCapturing ? "Stop Quick Note" : "Start Quick Note"}
                  className={`transition-all duration-200 ${
                    quickNoteCapturing
                      ? 'text-red-600 hover:text-red-700 animate-pulse bg-red-50 dark:bg-red-900/20'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  <Scissors className={`w-5 h-5 ${quickNoteCapturing ? 'animate-pulse' : ''}`} />
                </Button>
                
                {favoritesEnabled && (
                  <Button
                    onClick={toggleFavorite}
                    variant="ghost"
                    size="sm"
                    disabled={favoritesPaused}
                    className={`transition-all duration-200 ${
                      propIsFavorited
                        ? 'text-red-600 hover:text-red-700'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                    } ${favoritesPaused ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Heart className={`w-5 h-5 ${propIsFavorited ? 'fill-current' : ''}`} />
                  </Button>
                )}

                {/* Background Playback Controls */}
                {backgroundVideo?.id === videoId ? (
                  <Button
                    onClick={handleStopBackground}
                    variant="ghost"
                    size="sm"
                    title="Stop background playback"
                    className="text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-900/20 transition-all duration-200"
                  >
                    <VolumeX className="w-5 h-5" />
                  </Button>
                ) : (
                  <Button
                    onClick={handlePlayInBackground}
                    variant="ghost"
                    size="sm"
                    title="Play in background"
                    className="text-primary hover:text-primary/80 bg-muted transition-all duration-200"
                  >
                    <Volume2 className="w-5 h-5" />
                  </Button>
                )}
                
                <div className="flex items-center gap-1">
                  <Button
                    onClick={handlePreviousVideo}
                    variant="ghost"
                    size="sm"
                    title="Move to previous video"
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all duration-200"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={handleNextVideo}
                    variant="ghost"
                    size="sm"
                    title="Move to next video"
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all duration-200"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Description Preview */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
              {quickNoteCapturing ? (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 animate-pulse">
                  <Scissors className="w-4 h-4 fill-current" />
                  <span className="font-medium">
                    Quick Note in progress... Started at {formatTime(quickNoteStartTime)}
                  </span>
                  <span className="text-xs">• Click scissors icon to stop & save</span>
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  Create video notes and capture clips from this video. Use the controls below to set timestamps and add comments.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Note Creation Section */}
      <Card data-testid="note-creation-form">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg transition-colors ${
              isCapturing 
                ? 'bg-red-100 dark:bg-red-900/30 animate-pulse' 
                : quickNoteCapturing
                ? 'bg-muted animate-pulse'
                : 'bg-muted'
            }`}>
              <MessageSquare className={`w-5 h-5 ${
                isCapturing 
                  ? 'text-red-600 dark:text-red-400' 
                  : quickNoteCapturing
                  ? 'text-primary'
                  : 'text-primary'
              }`} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">
                Create Note
              </h2>
              {isCapturing && (
                <p className="text-sm text-red-600 dark:text-red-400 animate-pulse">
                  🎯 Capturing... Click "Stop & Save" when you reach the end point
                </p>
              )}
              {quickNoteCapturing && !isCapturing && (
                <p className="text-sm text-primary animate-pulse">
                  ✂️ Quick Note recording... Click scissors icon to stop & save
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="note-title">Title</Label>
                <Input
                  id="note-title"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="Enter a title for this clip..."
                />
              </div>
              
              <div>
                <Label htmlFor="note-comment">Comment</Label>
                <Input
                  id="note-comment"
                  value={newNote.note}
                  onChange={(e) => setNewNote({ ...newNote, note: e.target.value })}
                  placeholder="Add your notes or comments..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time" className={isCapturing ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
                  Start Time (seconds) {isCapturing && '✓'}
                </Label>
                <Input
                  id="start-time"
                  type="number"
                  value={newNote.startTime}
                  onChange={(e) => {
                    const value = Number(e.target.value)
                    setNewNote({ ...newNote, startTime: value, endTime: Math.max(value + 1, newNote.endTime) })
                  }}
                  min="0"
                  disabled={isCapturing || quickNoteCapturing}
                  className={
                    isCapturing 
                      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                      : quickNoteCapturing
                      ? 'border-border bg-muted'
                      : ''
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="end-time" className={isCapturing ? 'text-primary font-semibold' : ''}>
                  End Time (seconds) {isCapturing && '⏳'}
                </Label>
                <Input
                  id="end-time"
                  type="number"
                  value={isCapturing ? Math.floor(currentTime) : newNote.endTime}
                  onChange={(e) => {
                    const value = Number(e.target.value)
                    setNewNote({ ...newNote, endTime: value })
                  }}
                  min="0"
                  disabled={isCapturing || quickNoteCapturing}
                  className={
                    isCapturing 
                      ? 'border-border bg-muted'
                      : quickNoteCapturing
                      ? 'border-border bg-muted'
                      : ''
                  }
                />
                {isCapturing && (
                  <p className="text-xs text-primary mt-1">
                    Will be set to current time when you stop
                  </p>
                )}
                {quickNoteCapturing && (
                  <p className="text-xs text-primary mt-1">
                    Quick Note in progress - use scissors icon to stop
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              {!isCapturing ? (
                <>
                  <Button
                    onClick={handleAddNote}
                    className="flex-1"
                    disabled={!newNote.title.trim() || newNote.startTime >= newNote.endTime || isCapturing || quickNoteCapturing}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Note
                  </Button>
                  
                  <Button
                    onClick={handleCaptureStart}
                    variant="outline"
                    className="flex-1 text-foreground hover:text-foreground"
                    disabled={!playerReady || isCapturing || quickNoteCapturing}
                  >
                    <Bookmark className="w-4 h-4 mr-2" />
                    {playerReady && !isCapturing && !quickNoteCapturing ? (
                      `Set Start (${formatTime(currentTime)})`
                    ) : isCapturing ? (
                      'Capturing in progress...'
                    ) : quickNoteCapturing ? (
                      'Quick Note in progress...'
                    ) : (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleSaveNote}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    disabled={!playerReady}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Stop & Save ({formatTime(currentTime)})
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setIsCapturing(false)
                      setNewNote({ title: '', note: '', startTime: 0, endTime: 30 })
                      showNotification('Note capture has been cancelled', 'info')
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Notes List */}
      {notes.length > 0 ? (
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-1.5 sm:p-2 bg-muted rounded-lg">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-semibold">
                  Video Notes ({filteredNotes.length})
                </h2>
                {notes.length > 0 && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {filteredNotes.length < notes.length ? `Showing ${filteredNotes.length} of ${notes.length} notes` : 'All notes loaded'}
                  </p>
                )}
              </div>
            </div>
            
            {/* Search/Filter Section */}
            {notes.length > 0 && (
              <div className="mb-3 sm:mb-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search notes by title, content, or channel..."
                    value={notesSearchQuery}
                    onChange={(e) => setNotesSearchQuery(e.target.value)}
                    className="flex-1 text-sm"
                  />
                  {notesSearchQuery && (
                    <Button
                  onClick={() => setNotesSearchQuery('')}
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm text-foreground hover:text-foreground"
                >
                      <span className="hidden sm:inline">Clear</span>
                      <span className="sm:hidden">✕</span>
                    </Button>
                  )}
                </div>
                {notesSearchQuery && filteredNotes.length === 0 && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2 text-center">
                    No notes found matching "{notesSearchQuery}"
                  </p>
                )}
              </div>
            )}
            
            <ScrollArea className="max-h-80 sm:max-h-96 overflow-y-auto">
              <div className="space-y-2 sm:space-y-3">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      activeNoteId === note.id
                        ? 'border-border bg-muted'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => handlePlayNote(note)}
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        {editingNoteId === note.id ? (
                          <div className="space-y-2 sm:space-y-3" onClick={(e) => e.stopPropagation()}>
                            <Input
                              value={editingNoteTitle}
                              onChange={(e) => setEditingNoteTitle(e.target.value)}
                              placeholder="Note title"
                              className="font-medium text-sm"
                            />
                            <textarea
                              value={editingNoteContent}
                              onChange={(e) => setEditingNoteContent(e.target.value)}
                              placeholder="Note content"
                              className="w-full p-2 border rounded-md text-xs sm:text-sm resize-none"
                              rows={3}
                            />
                            <div className="flex gap-1 sm:gap-2">
                              <Button
                                onClick={saveEditingNote}
                                size="sm"
                                className="flex-1 text-xs sm:text-sm"
                              >
                                <Save className="w-3 h-3 sm:w-3 sm:h-3 mr-1" />
                                <span className="hidden sm:inline">Save</span>
                              </Button>
                              <Button
                                onClick={cancelEditingNote}
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs sm:text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <span className="hidden sm:inline">Cancel</span>
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className="font-medium text-gray-900 dark:text-white mb-1 truncate text-sm sm:text-base">
                              {note.title}
                            </h3>
                            
                            {note.note && (
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                {note.note}
                              </p>
                            )}
                            
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(note.startTime)} - {formatTime(note.endTime)}
                              </span>
                              <span className="hidden sm:inline">Duration: {formatTime(note.endTime - note.startTime)}</span>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {editingNoteId !== note.id && (
                        <div className="flex flex-col gap-1 sm:gap-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePlayNote(note)
                            }}
                            size="sm"
                            className="text-xs sm:text-sm"
                          >
                            <Play className="w-3 h-3 sm:w-3 sm:h-3 mr-1" />
                            <span className="hidden sm:inline">Play</span>
                          </Button>
                          
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              startEditingNote(note)
                            }}
                            size="sm"
                            variant="outline"
                            className="text-xs sm:text-sm"
                          >
                            <Edit className="w-3 h-3 sm:w-3 sm:h-3" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteNote(note.id)
                            }}
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive text-xs sm:text-sm"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="p-4 sm:p-6 bg-muted rounded-lg mb-4">
              <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground mx-auto mb-4" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-muted-foreground mb-2">
              No Notes Yet
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Create your first note for this video! Use the note creation form above to add timestamps, comments, or highlights while watching the video.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
              <Button
                onClick={() => {
                  const noteForm = document.querySelector('[data-testid="note-creation-form"]')
                  if (noteForm) {
                    noteForm.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }
                }}
                variant="outline"
                className="text-sm text-foreground hover:text-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Note
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[425px] mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete Note
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-3 mt-4">
            <Button
              onClick={cancelDeleteNote}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteNote}
              variant="destructive"
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}