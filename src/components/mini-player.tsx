'use client'

import { useState, useEffect, useRef } from 'react'
import YouTube from 'react-youtube'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { 
  Play, 
  Pause, 
  X, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  SkipBack, 
  SkipForward,
  ChevronUp,
  ChevronDown,
  Bell,
  BellOff
} from 'lucide-react'
import { useBackgroundPlayer } from '@/contexts/background-player-context'
import { useNotificationService } from '@/hooks/use-notification-service'
import { formatDuration } from '@/lib/youtube'

export function MiniPlayer() {
  const {
    backgroundVideo,
    isPlaying,
    currentTime,
    duration,
    volume,
    showMiniPlayer,
    playerRef,
    pauseBackgroundVideo,
    stopBackgroundVideo,
    seekTo,
    setVolume,
    toggleMiniPlayer,
    updateCurrentTime,
    updateDuration,
    updatePlayingState,
  } = useBackgroundPlayer()

  const { showPlaybackNotification, hideNotification } = useNotificationService()

  const [isExpanded, setIsExpanded] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [previousVolume, setPreviousVolume] = useState(volume)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const dragRef = useRef<HTMLDivElement>(null)
  const dragStartPos = useRef({ x: 0, y: 0 })

  // Drag functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStartPos.current.x,
          y: e.clientY - dragStartPos.current.y
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  // Add message listener for YouTube iframe communication
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Ignore messages that aren't from YouTube iframe
      if (!event.data || !event.source) return
      
      // Log YouTube iframe messages for debugging
      if (event.data && typeof event.data === 'object') {
        console.log('YouTube iframe message:', event.data)
      }
    }

    window.addEventListener('message', handleMessage)
    
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [backgroundVideo, showMiniPlayer])

  // Early return after all hooks
  if (!backgroundVideo || !showMiniPlayer) return null

  const opts = {
    height: isExpanded ? '200' : '90',
    width: isExpanded ? '355' : '160',
    playerVars: {
      autoplay: 1,
      controls: 0,
      rel: 0,
      showinfo: 0,
      modestbranding: 1,
      iv_load_policy: 3,
      cc_load_policy: 0,
      fs: 0,
      disablekb: 1,
    },
  }

  const onReady = (event: any) => {
    playerRef.current = event.target
    event.target.setVolume(volume * 100)
    updateDuration(event.target.getDuration())
  }

  const onStateChange = (event: any) => {
    const state = event.data
    updatePlayingState(state === 1) // 1 = playing
  }

  const onPlay = () => {
    updateCurrentTime(playerRef.current?.getCurrentTime() || 0)
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseBackgroundVideo()
    } else {
      if (playerRef.current) {
        playerRef.current.playVideo()
      }
    }
  }

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0]
    setVolume(vol)
    setIsMuted(vol === 0)
    if (vol === 0) {
      setPreviousVolume(volume)
    }
  }

  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume)
      setIsMuted(false)
    } else {
      setPreviousVolume(volume)
      setVolume(0)
      setIsMuted(true)
    }
  }

  const handleSeek = (newTime: number[]) => {
    seekTo(newTime[0])
  }

  const handleSkipBack = () => {
    seekTo(Math.max(0, currentTime - 10))
  }

  const handleSkipForward = () => {
    seekTo(Math.min(duration, currentTime + 10))
  }

  const handleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const handleClose = () => {
    stopBackgroundVideo()
  }

  const handleToggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled)
    if (!notificationsEnabled && backgroundVideo) {
      // Enable notifications and show current playback
      showPlaybackNotification(backgroundVideo, isPlaying)
    } else {
      // Disable notifications and hide current notification
      hideNotification()
    }
  }

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
  }

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${isExpanded ? 'w-96' : 'w-44'}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        bottom: 'auto',
        right: 'auto'
      }}
    >
      <Card className="bg-background/95 backdrop-blur-sm border shadow-lg">
        <CardContent className="p-2">
          {/* Drag Handle */}
          <div
            ref={dragRef}
            onMouseDown={handleMouseDown}
            className="flex items-center justify-between mb-2 cursor-move select-none"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 bg-muted rounded flex-shrink-0 overflow-hidden">
                {backgroundVideo.thumbnail && (
                  <img
                    src={backgroundVideo.thumbnail}
                    alt={backgroundVideo.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  {backgroundVideo.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {backgroundVideo.channelName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleExpand}
                className="h-6 w-6 p-0"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleToggleNotifications}
                className={`h-6 w-6 p-0 ${notificationsEnabled ? 'text-blue-600' : 'text-muted-foreground'}`}
                title={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
              >
                {notificationsEnabled ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClose}
                className="h-6 w-6 p-0"
                title="Close player"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Hidden YouTube Player */}
          <div className="absolute inset-0 pointer-events-none">
            <YouTube
              videoId={backgroundVideo.videoId}
              opts={opts}
              onReady={onReady}
              onStateChange={onStateChange}
              onPlay={onPlay}
              className="opacity-0"
              style={{ width: 0, height: 0 }}
            />
          </div>

          {/* Controls */}
          <div className="space-y-2">
            {/* Progress Bar */}
            <div className="space-y-1">
              <Slider
                value={[currentTime]}
                max={duration}
                step={1}
                onValueChange={handleSeek}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSkipBack}
                  className="h-8 w-8 p-0"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handlePlayPause}
                  className="h-8 w-8 p-0"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSkipForward}
                  className="h-8 w-8 p-0"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleMute}
                  className="h-8 w-8 p-0"
                >
                  {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                {isExpanded && (
                  <div className="w-20">
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}