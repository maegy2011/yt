'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Minimize2, 
  Maximize2, 
  X,
  Share,
  Download,
  MoreHorizontal,
  Heart,
  Expand,
  Minimize,
  RotateCcw,
  Settings,
  Monitor,
  Subtitles,
  PictureInPicture
} from 'lucide-react'

// Dynamically import ReactPlayer to avoid SSR issues
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false })

interface Video {
  id: string
  title: string
  channel: string
  thumbnail: string
  duration: string
  views: string
  published: string
  url: string
  embedUrl?: string
}

interface VideoPlayerProps {
  video: Video
  isOpen: boolean
  isMiniPlayer: boolean
  isPlaying: boolean
  onTogglePlay: () => void
  onToggleMiniPlayer: () => void
  onClose: () => void
  onPlayingStateChange: (playing: boolean) => void
  onBookmark?: () => void
  onSubscribe?: () => void
  isBookmarked?: boolean
  isSubscribed?: boolean
}

export function VideoPlayer({
  video,
  isOpen,
  isMiniPlayer,
  isPlaying,
  onTogglePlay,
  onToggleMiniPlayer,
  onClose,
  onPlayingStateChange,
  onBookmark,
  onSubscribe,
  isBookmarked = false,
  isSubscribed = false
}: VideoPlayerProps) {
  const [volume, setVolume] = useState([0.8])
  const [playbackRate, setPlaybackRate] = useState(1)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playerError, setPlayerError] = useState<string | null>(null)
  const [isBuffering, setIsBuffering] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [quality, setQuality] = useState('auto')
  const [subtitleEnabled, setSubtitleEnabled] = useState(false)
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Enhanced progress handler with buffering detection
  const handleProgress = (state: any) => {
    setProgress(state.played)
    setIsBuffering(state.loaded < state.played && state.played < 0.99)
  }

  const handleDuration = (duration: number) => {
    setDuration(duration)
  }

  const handleSeek = (value: number[]) => {
    if (playerRef.current) {
      playerRef.current.seekTo(value[0])
    }
  }

  const handleError = (error: any) => {
    console.error('Video player error:', error)
    setPlayerError('Failed to load video. Please try again later.')
    setIsBuffering(false)
  }

  const handleReady = () => {
    setPlayerError(null)
    setIsBuffering(false)
  }

  const handlePlay = () => {
    onPlayingStateChange(true)
    setIsBuffering(false)
  }

  const handlePause = () => {
    onPlayingStateChange(false)
  }

  const handleBuffer = () => {
    setIsBuffering(true)
  }

  const handleBufferEnd = () => {
    setIsBuffering(false)
  }

  const handleEnded = () => {
    onPlayingStateChange(false)
    setIsBuffering(false)
  }

  // Format time helper
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Enhanced controls
  const toggleFullscreen = () => {
    if (!containerRef.current) return
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  const togglePictureInPicture = () => {
    if (playerRef.current && playerRef.current.getInternalPlayer) {
      const videoElement = playerRef.current.getInternalPlayer()
      if (videoElement && document.pictureInPictureElement) {
        document.exitPictureInPicture()
      } else if (videoElement) {
        videoElement.requestPictureInPicture().catch(err => {
          console.error('Error entering picture-in-picture:', err)
        })
      }
    }
  }

  const skipTime = (seconds: number) => {
    if (playerRef.current) {
      const currentTime = progress * duration
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
      playerRef.current.seekTo(newTime / duration)
    }
  }

  const restartVideo = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(0)
      if (!isPlaying) {
        onTogglePlay()
      }
    }
  }

  // Playback rates
  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
  
  // Quality options
  const qualityOptions = ['auto', '144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p']

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (isPlaying && !isMiniPlayer) {
      timeout = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
    return () => clearTimeout(timeout)
  }, [isPlaying, isMiniPlayer, progress])

  // Show controls on user interaction
  const handleMouseMove = () => {
    setShowControls(true)
    if (isPlaying && !isMiniPlayer) {
      setTimeout(() => setShowControls(false), 3000)
    }
  }

  if (!isOpen) return null

  if (isMiniPlayer) {
    return (
      <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img 
                src={video.thumbnail} 
                alt={video.title}
                className="w-20 h-12 object-cover rounded"
              />
              <Button
                size="icon"
                variant="secondary"
                className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 transition-opacity"
                onClick={onTogglePlay}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium truncate">{video.title}</h4>
              <p className="text-xs text-muted-foreground">{video.channel}</p>
            </div>
            <div className="flex items-center space-x-1">
              <Button size="icon" variant="ghost" onClick={onToggleMiniPlayer}>
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <Card className="w-full max-w-6xl bg-background">
        <CardContent className="p-0">
          {/* Video Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex-1">
              <h2 className="text-lg font-semibold truncate">{video.title}</h2>
              <p className="text-sm text-muted-foreground">{video.channel}</p>
            </div>
            <div className="flex items-center space-x-2">
              {onSubscribe && (
                <Button
                  size="sm"
                  variant={isSubscribed ? "default" : "outline"}
                  onClick={onSubscribe}
                >
                  <Heart className={`h-4 w-4 mr-1 ${isSubscribed ? 'fill-current' : ''}`} />
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </Button>
              )}
              {onBookmark && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onBookmark}
                >
                  <Heart className={`h-4 w-4 ${isBookmarked ? 'fill-current text-red-500' : ''}`} />
                </Button>
              )}
              <Button size="icon" variant="ghost" onClick={onToggleMiniPlayer}>
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Enhanced Video Player */}
          <div 
            className="relative aspect-video bg-black overflow-hidden"
            style={{ aspectRatio: '16/9' }}
          >
            {/* Buffering Indicator */}
            {isBuffering && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-white text-sm">Buffering...</p>
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {playerError && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-900/20 text-red-200 p-4 z-20">
                <div className="text-center">
                  <p className="text-sm font-medium">{playerError}</p>
                  <p className="text-xs mt-1">Video ID: {video.id}</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={restartVideo}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {/* ReactPlayer with Enhanced Config */}
            <ReactPlayer
              ref={playerRef}
              url={video.embedUrl || video.url}
              width="100%"
              height="100%"
              playing={isPlaying}
              volume={volume[0]}
              muted={volume[0] === 0}
              playbackRate={playbackRate}
              onProgress={handleProgress}
              onDuration={handleDuration}
              onPlay={handlePlay}
              onPause={handlePause}
              onBuffer={handleBuffer}
              onBufferEnd={handleBufferEnd}
              onEnded={handleEnded}
              onError={handleError}
              onReady={handleReady}
              onStart={() => setIsBuffering(false)}
              onEnablePIP={() => console.log('PIP enabled')}
              onDisablePIP={() => console.log('PIP disabled')}
              config={{
                youtube: {
                  playerVars: {
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    ecver: 2,
                    controls: 1,
                    disablekb: 0,
                    fs: 1,
                    iv_load_policy: 3,
                    playsinline: 1,
                    autoplay: 1,
                    color: 'white',
                    hl: 'en',
                    cc_lang_pref: 'en',
                    cc_load_policy: 1
                  },
                  embedOptions: {
                    host: 'https://www.youtube.com',
                    embedPath: '/embed/',
                    protocol: 'https'
                  },
                  attributes: {
                    allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
                    allowFullScreen: true,
                    frameBorder: '0'
                  }
                },
                file: {
                  attributes: {
                    controlsList: 'nodownload',
                    disablePictureInPicture: false,
                    playsInline: true
                  },
                  forceAudio: false,
                  forceHLS: true,
                  forceDASH: true,
                  hlsOptions: {
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90,
                    maxBufferLength: 30,
                    maxMaxBufferLength: 60,
                    liveSyncDuration: 3,
                    liveMaxLatencyDuration: 10,
                    liveDurationInfinity: false,
                    autoStartLoad: true,
                    startPosition: -1,
                    capLevelToPlayerSize: true,
                    defaultAudioCodec: undefined,
                    debug: false,
                    preferManagedMediaSource: true,
                    xhrSetup: undefined,
                    fetchSetup: undefined,
                    abrController: undefined,
                    bufferController: undefined,
                    capLevelController: undefined,
                    fpsController: undefined,
                    playListController: undefined,
                    levelController: undefined,
                    timelineController: undefined,
                    streamController: undefined,
                    audioStreamController: undefined,
                    subtitleTrackController: undefined,
                    subtitleStreamController: undefined,
                    emeController: undefined,
                    cmcdController: undefined,
                    subtitleController: undefined
                  }
                }
              }}
            />

            {/* Enhanced Video Controls Overlay */}
            <div 
              className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 transition-opacity duration-300 ${
                showControls ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Top Controls */}
              <div className="absolute top-0 left-0 right-0 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-black/50 text-white">
                      {quality}
                    </Badge>
                    {subtitleEnabled && (
                      <Badge variant="secondary" className="bg-black/50 text-white">
                        <Subtitles className="h-3 w-3 mr-1" />
                        CC
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Center Play/Pause Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-16 w-16 rounded-full bg-white/20 hover:bg-white/30 text-white border-2 border-white/50"
                  onClick={onTogglePlay}
                >
                  {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                </Button>
              </div>

              {/* Bottom Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                {/* Progress Bar */}
                <div className="space-y-2 mb-4">
                  <Slider
                    value={[progress * 100]}
                    onValueChange={(value) => handleSeek([value[0] / 100])}
                    max={100}
                    step={0.1}
                    className="w-full h-1"
                  />
                  <div className="flex justify-between text-xs text-white">
                    <span>{formatTime(progress * duration)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button size="icon" variant="ghost" onClick={() => skipTime(-10)}>
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button size="icon" onClick={onTogglePlay}>
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => skipTime(10)}>
                      <SkipForward className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button size="icon" variant="ghost" onClick={() => setVolume(volume[0] > 0 ? [0] : [0.8])}>
                        {volume[0] > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      </Button>
                      <Slider
                        value={volume}
                        onValueChange={setVolume}
                        max={1}
                        step={0.1}
                        className="w-20"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button size="icon" variant="ghost" onClick={togglePictureInPicture}>
                      <PictureInPicture className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={toggleFullscreen}>
                      {isFullscreen ? <Minimize className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={restartVideo}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Playback Rate and Quality Controls */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-1">
                    {playbackRates.map((rate) => (
                      <Button
                        key={rate}
                        size="sm"
                        variant={playbackRate === rate ? "default" : "ghost"}
                        onClick={() => setPlaybackRate(rate)}
                        className="text-xs px-2 py-1 h-6"
                      >
                        {rate}x
                      </Button>
                    ))}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {qualityOptions.slice(0, 5).map((q) => (
                      <Button
                        key={q}
                        size="sm"
                        variant={quality === q ? "default" : "ghost"}
                        onClick={() => setQuality(q)}
                        className="text-xs px-2 py-1 h-6"
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Video Info */}
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge variant="secondary">{video.views} views</Badge>
                <Badge variant="outline">{video.published}</Badge>
                <Badge variant="outline">
                  <Monitor className="h-3 w-3 mr-1" />
                  {quality}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="ghost">
                  <Share className="h-4 w-4 mr-1" />
                  Share
                </Button>
                <Button size="sm" variant="ghost">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button size="sm" variant="ghost">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}