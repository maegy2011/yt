'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import YouTube from 'react-youtube'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Play, Pause, RotateCcw, Plus, Trash2, Save, Bookmark, Edit, Clock, MessageSquare, User, Eye, Heart, ChevronLeft, ChevronRight, Loader2, Scissors } from 'lucide-react'

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

interface VideoNote {
  id: string
  title: string
  comment: string
  startTime: number
  endTime: number
  videoId: string
  videoTitle: string
  channelName?: string
  viewCount?: number
  publishedAt?: string
  thumbnail?: string
}

interface VideoNoteProps {
  videoId: string
  videoTitle: string
  channelName?: string
  viewCount?: number
  publishedAt?: string
  thumbnail?: string
  onFavoriteToggle?: (isFavorited: boolean) => void
  onPreviousVideo?: () => void
  onNextVideo?: () => void
}

export function VideoNote({ 
  videoId, 
  videoTitle, 
  channelName, 
  viewCount, 
  publishedAt, 
  thumbnail,
  onPreviousVideo,
  onNextVideo 
}: VideoNoteProps) {
  const [notes, setNotes] = useState<VideoNote[]>([])
  const [newNote, setNewNote] = useState({ title: '', comment: '', startTime: 0, endTime: 30 })
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [autoStopTriggered, setAutoStopTriggered] = useState(false)
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [quickNoteCapturing, setQuickNoteCapturing] = useState(false)
  const [quickNoteStartTime, setQuickNoteStartTime] = useState(0)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
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
      showNotification('Navigation', 'Previous video feature not available', 'info')
    }
  }, [onPreviousVideo, showNotification])

  const handleNextVideo = useCallback(() => {
    if (onNextVideo) {
      onNextVideo()
    } else {
      showNotification('Navigation', 'Next video feature not available', 'info')
    }
  }, [onNextVideo, showNotification])

  const toggleFavorite = async () => {
    setIsFavorited(!isFavorited)
    // Here you would typically make an API call to save the favorite state
    // For now, just toggle the local state
    showNotification(isFavorited ? 'Added to favorites' : 'Removed from favorites', 'info')
  }

  const toggleQuickNote = async () => {
    if (!playerRef.current || !playerReady) {
      showNotification('Player Not Ready', 'Please wait for the video to load', 'error')
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
      showNotification('Quick Note Started', `Recording from ${formatTime(startTime)}`, 'info')
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
        const note: VideoNote = {
          id: Date.now().toString(),
          title: `Quick Note ${formatTime(quickNoteStartTime)}-${formatTime(endTime)}`,
          comment: '',
          startTime: quickNoteStartTime,
          endTime: endTime,
          videoId,
          videoTitle,
          channelName: channelName || '',
          viewCount: viewCount || 0,
          publishedAt: publishedAt || '',
          thumbnail: thumbnail || ''
        }
        
        setNotes([...notes, note])
        setQuickNoteCapturing(false)
        setQuickNoteStartTime(0)
        showNotification('Quick Note Saved!', `Clip saved from ${formatTime(note.startTime)} to ${formatTime(note.endTime)}`, 'success')
      } else {
        showNotification('Invalid Time', 'End time must be greater than start time', 'error')
      }
    }
  }

  // Load notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem(`video-notes-${videoId}`)
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes))
    }
  }, [videoId])

  // Save notes to localStorage
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem(`video-notes-${videoId}`, JSON.stringify(notes))
    }
  }, [notes, videoId])

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

  const handleAddNote = () => {
    if (newNote.title.trim() && newNote.startTime < newNote.endTime) {
      const note: VideoNote = {
        id: Date.now().toString(),
        title: newNote.title,
        comment: newNote.comment,
        startTime: newNote.startTime,
        endTime: newNote.endTime,
        videoId,
        videoTitle,
        channelName: channelName || '',
        viewCount: viewCount || 0,
        publishedAt: publishedAt || '',
        thumbnail: thumbnail || ''
      }
      setNotes([...notes, note])
      setNewNote({ title: '', comment: '', startTime: 0, endTime: 30 })
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
    showNotification('Start Time Set', `Start time set to ${formatTime(startTime)}`, 'success')
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
      const note: VideoNote = {
        id: Date.now().toString(),
        title: newNote.title || `Clip from ${formatTime(newNote.startTime)} to ${formatTime(endTime)}`,
        comment: newNote.comment,
        startTime: newNote.startTime,
        endTime: endTime,
        videoId,
        videoTitle,
        channelName: channelName || '',
        viewCount: viewCount || 0,
        publishedAt: publishedAt || '',
        thumbnail: thumbnail || ''
      }
      
      // Add to local state
      setNotes([...notes, note])
      
      // Reset form
      setNewNote({ title: '', comment: '', startTime: 0, endTime: 30 })
      setIsCapturing(false)
      
      // Show success notification
      showNotification('Note Saved!', `Clip saved from ${formatTime(note.startTime)} to ${formatTime(note.endTime)}`, 'success')
      
      console.log('Note saved with end time:', endTime, 'from current time:', accurateCurrentTime)
    } else {
      // Show error notification
      showNotification('Invalid Time', 'End time must be greater than start time. Please play the video forward before saving.', 'error')
      console.log('End time not greater than start time:', endTime, '<=', newNote.startTime)
    }
  }

  const handleUpdateNote = (noteId: string, comment: string) => {
    setNotes(notes.map(note => 
      note.id === noteId ? { ...note, comment } : note
    ))
    setEditingNoteId(null)
  }

  const handleDeleteNote = (id: string) => {
    // Direct deletion without confirmation
    setNotes(notes.filter(note => note.id !== id))
    if (activeNoteId === id) {
      setActiveNoteId(null)
    }
    showNotification('Note Deleted', 'The note has been removed successfully', 'success')
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}
      
      {/* YouTube-like Video Player Container */}
      <div className="bg-black rounded-lg overflow-hidden">
        {/* Video Player */}
        <div className="relative aspect-video">
          <YouTube
            videoId={videoId}
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
                  onClick={toggleFavorite}
                  variant="ghost"
                  size="sm"
                  className={`transition-all duration-200 ${
                    isFavorited
                      ? 'text-red-600 hover:text-red-700'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                </Button>
                
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
                  <Scissors className={`w-5 h-5 ${quickNoteCapturing ? 'fill-current' : ''}`} />
                </Button>
                
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
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg transition-colors ${
              isCapturing 
                ? 'bg-red-100 dark:bg-red-900/30 animate-pulse' 
                : quickNoteCapturing
                ? 'bg-orange-100 dark:bg-orange-900/30 animate-pulse'
                : 'bg-green-100 dark:bg-green-900/30'
            }`}>
              <MessageSquare className={`w-5 h-5 ${
                isCapturing 
                  ? 'text-red-600 dark:text-red-400' 
                  : quickNoteCapturing
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-green-600 dark:text-green-400'
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
                <p className="text-sm text-orange-600 dark:text-orange-400 animate-pulse">
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
                  value={newNote.comment}
                  onChange={(e) => setNewNote({ ...newNote, comment: e.target.value })}
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
                      ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20'
                      : ''
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="end-time" className={isCapturing ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''}>
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
                      ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                      : quickNoteCapturing
                      ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20'
                      : ''
                  }
                />
                {isCapturing && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Will be set to current time when you stop
                  </p>
                )}
                {quickNoteCapturing && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
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
                    className="flex-1"
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
                      setNewNote({ title: '', comment: '', startTime: 0, endTime: 30 })
                      showNotification('Capture Cancelled', 'Note capture has been cancelled', 'info')
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
      {notes.length > 0 && (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold">
                Video Notes ({notes.length})
              </h2>
            </div>
            
            <ScrollArea className="max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      activeNoteId === note.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => handlePlayNote(note)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1 truncate">
                          {note.title}
                        </h3>
                        
                        {note.comment && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                            {note.comment}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(note.startTime)} - {formatTime(note.endTime)}
                          </span>
                          <span>Duration: {formatTime(note.endTime - note.startTime)}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePlayNote(note)
                          }}
                          size="sm"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Play
                        </Button>
                        
                        {note.comment && editingNoteId !== note.id && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingNoteId(note.id)
                            }}
                            size="sm"
                            variant="outline"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}
                        
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteNote(note.id)
                          }}
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}