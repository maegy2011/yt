'use client'

import { useState, useRef, useEffect } from 'react'
import YouTube from 'react-youtube'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Play, Pause, RotateCcw, Bookmark, Save, Film, MessageSquare } from 'lucide-react'

export default function VideoNotesDemo() {
  const [videoUrl, setVideoUrl] = useState('dQw4w9WgXcQ')
  const [startTime, setStartTime] = useState(10) // Shorter for testing
  const [endTime, setEndTime] = useState(20) // Shorter for testing
  const [comment, setComment] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ')
  const [autoStopTriggered, setAutoStopTriggered] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const playerRef = useRef<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Extract video ID from YouTube URL
  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : url
  }

  const handleVideoUrlChange = (url: string) => {
    setVideoUrl(url)
    const id = extractVideoId(url)
    setVideoId(id)
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
    setStartTime(startTime)
    setIsCapturing(true)
    console.log('Start time set to:', startTime, 'from current time:', accurateCurrentTime)
  }

  const handleSaveClip = () => {
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
    
    const end = Math.floor(accurateCurrentTime)
    if (end > startTime) {
      setEndTime(end)
      setIsCapturing(false)
      console.log('Clip saved with end time:', end, 'from current time:', accurateCurrentTime)
    } else {
      console.log('End time not greater than start time:', end, '<=', startTime)
    }
  }

  const handleStartTimeChange = (value: number) => {
    setStartTime(value)
    // Ensure end time is always greater than start time
    if (value >= endTime) {
      setEndTime(value + 10)
    }
  }

  const handleEndTimeChange = (value: number) => {
    setEndTime(value)
    // Ensure start time is always less than end time
    if (value <= startTime) {
      setStartTime(Math.max(0, value - 10))
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
    if (playerRef.current) {
      playerRef.current.seekTo(startTime, true)
      setCurrentTime(startTime)
    }
  }

  const handleSeekToStart = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(startTime, true)
    }
  }

  const handleSeekToEnd = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(endTime, true)
    }
  }

  // Monitor video progress and enforce timestamp limits
  useEffect(() => {
    if (isPlaying && playerRef.current) {
      intervalRef.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          try {
            const currentTime = playerRef.current.getCurrentTime()
            const playerState = playerRef.current.getPlayerState()
            
            setCurrentTime(currentTime)
            
            // Only check end time if video is actually playing (state === 1)
            if (playerState === 1 && currentTime >= endTime) {
              console.log('Auto-stopping at end time:', currentTime, '>=', endTime)
              setAutoStopTriggered(true)
              playerRef.current.pauseVideo()
              setIsPlaying(false)
              
              // Reset to start time after a brief delay
              setTimeout(() => {
                if (playerRef.current) {
                  playerRef.current.seekTo(startTime, true)
                  setCurrentTime(startTime)
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
  }, [isPlaying, endTime, startTime])

  // Monitor current time for display
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

  const onReady = (event: any) => {
    playerRef.current = event.target
    setDuration(event.target.getDuration())
    event.target.seekTo(startTime, true)
    setCurrentTime(startTime)
    
    // Add event listener for time updates
    event.target.addEventListener('onStateChange', onStateChange)
  }

  const onStateChange = (event: any) => {
    const state = event.data
    console.log('Player state changed:', state)
    if (state === 1) { // Playing
      setIsPlaying(true)
    } else if (state === 2) { // Paused
      setIsPlaying(false)
    } else if (state === 0) { // Ended
      setIsPlaying(false)
      // Reset to start time when video ends naturally
      setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.seekTo(startTime, true)
          setCurrentTime(startTime)
        }
      }, 100)
    }
  }

  const onProgress = (event: any) => {
    setCurrentTime(event.target.getCurrentTime())
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const opts = {
    height: '390',
    width: '640',
    playerVars: {
      autoplay: 0,
      controls: 1,
      rel: 0,
      showinfo: 0,
      modestbranding: 1,
      start: startTime,
      // Remove 'end' parameter to handle it manually
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-3 sm:p-4 lg:p-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Film className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                  YouTube Video Player with Quick Capture
                </h1>
                <p className="text-violet-100 text-sm sm:text-base">
                  Professional Video Notes Demo
                </p>
              </div>
            </div>
          </div>

          <CardContent className="p-4 sm:p-6 space-y-6">
            {/* Video URL Input */}
            <div className="space-y-2">
              <Label htmlFor="video-url" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                YouTube Video URL or ID
              </Label>
              <Input
                id="video-url"
                type="text"
                value={videoUrl}
                onChange={(e) => handleVideoUrlChange(e.target.value)}
                placeholder="Enter YouTube URL or Video ID"
                className="rounded-xl border-slate-300 dark:border-slate-600 focus:border-violet-500 focus:ring-violet-500"
              />
            </div>

            {/* Quick Capture Buttons */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${isCapturing ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                  <Bookmark className={`w-5 h-5 ${isCapturing ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {isCapturing ? 'Recording Clip' : 'Quick Capture'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {isCapturing ? `Recording from ${formatTime(startTime)}` : 'Mark start and end points instantly'}
                  </p>
                </div>
                {isCapturing && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">REC</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                      onClick={handleSaveClip}
                      disabled={Math.floor(currentTime) <= startTime}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 h-12 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save End
                      <span className="ml-auto text-xs opacity-75">{formatTime(currentTime)}</span>
                    </Button>
                    
                    <Button
                      onClick={() => setIsCapturing(false)}
                      variant="outline"
                      className="rounded-xl border-slate-300 dark:border-slate-600 h-12"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Comment Field */}
            <div className="space-y-2">
              <Label htmlFor="comment" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Comment / Note
              </Label>
              <Input
                id="comment"
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add your comment or note here..."
                className="rounded-xl border-slate-300 dark:border-slate-600 focus:border-violet-500 focus:ring-violet-500"
              />
            </div>

            {/* Timestamp Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Start Time (seconds)
                </Label>
                <div className="relative">
                  <Input
                    id="start-time"
                    type="number"
                    value={startTime}
                    onChange={(e) => handleStartTimeChange(Number(e.target.value))}
                    min="0"
                    placeholder="Start time in seconds"
                    className="rounded-xl border-slate-300 dark:border-slate-600 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    seconds
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  End Time (seconds)
                </Label>
                <div className="relative">
                  <Input
                    id="end-time"
                    type="number"
                    value={endTime}
                    onChange={(e) => handleEndTimeChange(Number(e.target.value))}
                    min="0"
                    placeholder="End time in seconds"
                    className="rounded-xl border-slate-300 dark:border-slate-600 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    seconds
                  </span>
                </div>
              </div>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
              <YouTube
                videoId={videoId}
                opts={{
                  ...opts,
                  width: '100%',
                  height: '100%'
                }}
                onReady={onReady}
                onStateChange={onStateChange}
                onPlay={onProgress}
                className="w-full h-full"
              />
              
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

            {/* Playback Controls */}
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                onClick={isPlaying ? handlePause : handlePlay}
                className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="px-6 py-3 rounded-xl border-slate-300 dark:border-slate-600"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Start
              </Button>
              <Button
                onClick={handleSeekToStart}
                variant="outline"
                size="sm"
                className="px-4 py-2 rounded-xl border-slate-300 dark:border-slate-600"
              >
                Jump to Start
              </Button>
              <Button
                onClick={handleSeekToEnd}
                variant="outline"
                size="sm"
                className="px-4 py-2 rounded-xl border-slate-300 dark:border-slate-600"
              >
                Jump to End
              </Button>
            </div>

            {/* Progress Display */}
            <div className="space-y-3">
              {autoStopTriggered && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-center">
                  <span className="text-amber-800 dark:text-amber-200 text-sm font-medium flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    Auto-stop triggered at {formatTime(endTime)}
                  </span>
                </div>
              )}
              
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                  <span>Current: {formatTime(currentTime)}</span>
                  <span>Duration: {formatTime(duration)}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-500 mt-2">
                  <span>Start: {formatTime(startTime)}</span>
                  <span className="text-orange-600 dark:text-orange-400 font-medium">
                    Auto-stop: {formatTime(endTime)}
                  </span>
                </div>
                {comment && (
                  <div className="mt-3 p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                    <p className="text-sm text-violet-700 dark:text-violet-300">
                      <strong>Note:</strong> {comment}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border-0">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-violet-200 dark:bg-violet-800 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-violet-700 dark:text-violet-300" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    How to use Quick Capture
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-violet-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Quick Capture:</strong> Click "Set Start" then "Save End" to mark clips instantly
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-violet-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Add Comments:</strong> Type your notes/comments in the comment field
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-violet-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Manual Entry:</strong> Enter specific start/end times manually if needed
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-violet-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Auto-stop:</strong> Video will automatically pause at the end time
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}