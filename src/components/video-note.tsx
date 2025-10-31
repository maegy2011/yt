'use client'

import { useState, useRef, useEffect } from 'react'
import YouTube from 'react-youtube'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Play, Pause, RotateCcw, Plus, Trash2, Save, Bookmark, Edit, Clock, Film, MessageSquare } from 'lucide-react'

interface VideoNote {
  id: string
  title: string
  comment: string
  startTime: number
  endTime: number
  videoId: string
  videoTitle: string
}

interface VideoNoteProps {
  videoId: string
  videoTitle: string
}

export function VideoNote({ videoId, videoTitle }: VideoNoteProps) {
  const [notes, setNotes] = useState<VideoNote[]>([])
  const [newNote, setNewNote] = useState({ title: '', comment: '', startTime: 0, endTime: 30 })
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [autoStopTriggered, setAutoStopTriggered] = useState(false)
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const playerRef = useRef<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

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
        videoTitle
      }
      setNotes([...notes, note])
      setNewNote({ title: '', comment: '', startTime: 0, endTime: 30 })
    }
  }

  const handleCaptureStart = () => {
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
    }
    
    const startTime = Math.floor(accurateCurrentTime)
    setNewNote({ 
      ...newNote, 
      startTime: startTime,
      endTime: Math.max(startTime + 1, newNote.endTime)
    })
    setIsCapturing(true)
    console.log('Start time set to:', startTime, 'from current time:', accurateCurrentTime)
  }

  const handleSaveNote = () => {
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
        videoTitle
      }
      setNotes([...notes, note])
      setNewNote({ title: '', comment: '', startTime: 0, endTime: 30 })
      setIsCapturing(false)
      console.log('Note saved with end time:', endTime, 'from current time:', accurateCurrentTime)
    } else {
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
    setNotes(notes.filter(note => note.id !== id))
    if (activeNoteId === id) {
      setActiveNoteId(null)
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Video Player Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Video Header */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Film className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">
                  {videoTitle}
                </h1>
                <p className="text-violet-100 text-sm sm:text-base">
                  Video Notes & Clips
                </p>
              </div>
            </div>
          </div>

          {/* Video Player */}
          <div className="relative aspect-video bg-black">
            <div className="absolute inset-0">
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
            
            {/* Overlay Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between text-white mb-2">
                <span className="text-sm font-medium">{formatTime(currentTime)}</span>
                <span className="text-sm font-medium">{formatTime(duration)}</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-1.5 backdrop-blur-sm">
                <div
                  className="bg-white h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="bg-slate-50 dark:bg-slate-900 p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  onClick={isPlaying ? handlePause : handlePlay}
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span className="hidden sm:inline ml-2">{isPlaying ? 'Pause' : 'Play'}</span>
                </Button>
                
                {activeNoteId && (
                  <Button
                    onClick={handleReset}
                    size="sm"
                    variant="outline"
                    className="px-3 py-2 rounded-xl border-slate-300 dark:border-slate-600"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Reset</span>
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">{formatTime(currentTime)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Capture Section */}
        <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${isCapturing ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                <Bookmark className={`w-5 h-5 ${isCapturing ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {isCapturing ? 'Recording Clip' : 'Quick Capture'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {isCapturing ? `Recording from ${formatTime(newNote.startTime)}` : 'Mark start and end points instantly'}
                </p>
              </div>
              {isCapturing && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">REC</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {!isCapturing ? (
                <Button
                  onClick={handleCaptureStart}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 h-12"
                >
                  <Bookmark className="w-4 h-4 mr-2" />
                  Set Start
                  <span className="ml-auto text-xs opacity-75">{formatTime(currentTime)}</span>
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSaveNote}
                    disabled={Math.floor(currentTime) <= newNote.startTime}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 h-12 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save End
                    <span className="ml-auto text-xs opacity-75">{formatTime(currentTime)}</span>
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setIsCapturing(false)
                      setNewNote({ title: '', comment: '', startTime: 0, endTime: 30 })
                    }}
                    variant="outline"
                    className="rounded-xl border-slate-300 dark:border-slate-600 h-12"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Note Creation Section */}
        <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Create Note
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Add details to your video clip
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="note-title" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Title
                  </Label>
                  <Input
                    id="note-title"
                    type="text"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    placeholder="Enter a title for this clip..."
                    className="rounded-xl border-slate-300 dark:border-slate-600 focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="note-comment" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Comment
                  </Label>
                  <Input
                    id="note-comment"
                    type="text"
                    value={newNote.comment}
                    onChange={(e) => setNewNote({ ...newNote, comment: e.target.value })}
                    placeholder="Add your notes or comments..."
                    className="rounded-xl border-slate-300 dark:border-slate-600 focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Start Time
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={newNote.startTime}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        setNewNote({ ...newNote, startTime: value, endTime: Math.max(value + 1, newNote.endTime) })
                      }}
                      min="0"
                      className="rounded-xl border-slate-300 dark:border-slate-600 pr-8"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                      sec
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    End Time
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={newNote.endTime}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        setNewNote({ ...newNote, endTime: value, startTime: Math.min(newNote.startTime, value - 1) })
                      }}
                      min="0"
                      className="rounded-xl border-slate-300 dark:border-slate-600 pr-8"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                      sec
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Duration
                  </Label>
                  <div className="flex items-center h-10 px-3 bg-slate-100 dark:bg-slate-700 rounded-xl">
                    <Clock className="w-4 h-4 text-slate-500 mr-2" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {formatTime(newNote.endTime - newNote.startTime)}
                    </span>
                  </div>
                </div>
              </div>

              {!isCapturing && (
                <Button
                  onClick={handleAddNote}
                  disabled={!newNote.title.trim() || newNote.startTime >= newNote.endTime}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Note Manually
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Video Notes List */}
        {notes.length > 0 && (
          <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Video Notes
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {notes.length} clip{notes.length !== 1 ? 's' : ''} created
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className={`group p-4 rounded-xl border transition-all duration-200 ${
                      activeNoteId === note.id
                        ? 'border-violet-300 bg-violet-50 dark:border-violet-600 dark:bg-violet-900/20 shadow-lg'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        activeNoteId === note.id
                          ? 'bg-violet-200 dark:bg-violet-800'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}>
                        <Play className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate mb-1">
                          {note.title}
                        </h3>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(note.startTime)} - {formatTime(note.endTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Film className="w-3 h-3" />
                            {formatTime(note.endTime - note.startTime)}
                          </span>
                        </div>
                        
                        {/* Comment Display/Edit */}
                        {editingNoteId === note.id ? (
                          <Input
                            type="text"
                            defaultValue={note.comment}
                            placeholder="Add your comment..."
                            className="text-sm rounded-lg border-slate-300 dark:border-slate-600 focus:border-violet-500 focus:ring-violet-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateNote(note.id, (e.target as HTMLInputElement).value)
                              }
                            }}
                            onBlur={(e) => handleUpdateNote(note.id, e.target.value)}
                            autoFocus
                          />
                        ) : (
                          <div className="mb-3">
                            {note.comment ? (
                              <p className="text-sm text-slate-600 dark:text-slate-400 italic bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg">
                                {note.comment}
                              </p>
                            ) : (
                              <button
                                onClick={() => setEditingNoteId(note.id)}
                                className="text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 underline"
                              >
                                + Add comment
                              </button>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handlePlayNote(note)}
                            size="sm"
                            className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-3 py-1.5 text-xs"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Play Clip
                          </Button>
                          
                          {note.comment && editingNoteId !== note.id && (
                            <Button
                              onClick={() => setEditingNoteId(note.id)}
                              size="sm"
                              variant="outline"
                              className="rounded-lg px-3 py-1.5 text-xs border-slate-300 dark:border-slate-600"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          )}
                          
                          <Button
                            onClick={() => handleDeleteNote(note.id)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg px-3 py-1.5 text-xs border-slate-300 dark:border-slate-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border-0 shadow-xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-violet-200 dark:bg-violet-800 rounded-lg">
                <MessageSquare className="w-5 h-5 text-violet-700 dark:text-violet-300" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                How to Use Video Notes
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-violet-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Quick Capture:</strong> Click "Set Start" then "Save End" to mark clips instantly
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-violet-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Add Comments:</strong> Include notes and context for each clip
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-violet-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Auto-stop:</strong> Clips automatically pause at the end time
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-violet-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Manual Entry:</strong> Set precise timestamps manually if needed
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-violet-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Edit Anytime:</strong> Update comments and details later
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-violet-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Saved Locally:</strong> All notes persist for this video
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="pt-4">
              <div className="text-xs space-y-1 font-mono">
                <p><strong>Debug Info:</strong></p>
                <p>Current Time: {currentTime.toFixed(2)}s ({formatTime(currentTime)})</p>
                <p>Player Ready: {playerRef.current ? 'Yes' : 'No'}</p>
                <p>Is Capturing: {isCapturing ? 'Yes' : 'No'}</p>
                <p>New Note Start: {newNote.startTime}s ({formatTime(newNote.startTime)})</p>
                <p>New Note End: {newNote.endTime}s ({formatTime(newNote.endTime)})</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}