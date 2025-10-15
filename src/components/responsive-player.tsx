'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2,
  Settings,
  Subtitles,
  PictureInPicture,
  RotateCcw
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

interface ResponsivePlayerProps {
  video: Video
  isPlaying: boolean
  onTogglePlay: () => void
  onVolumeChange: (volume: number) => void
  onSeek: (progress: number) => void
  onFullscreen?: () => void
  onPictureInPicture?: () => void
  volume: number
  progress: number
  duration: number
  aspectRatio?: string
  maxWidth?: string
  className?: string
  showControls?: boolean
  autoHideControls?: boolean
}

type AspectRatio = '16:9' | '4:3' | '1:1' | '9:16' | '21:9' | string

const ASPECT_RATIOS: Record<string, { width: number; height: number }> = {
  '16:9': { width: 16, height: 9 },
  '4:3': { width: 4, height: 3 },
  '1:1': { width: 1, height: 1 },
  '9:16': { width: 9, height: 16 }, // Vertical
  '21:9': { width: 21, height: 9 }, // Ultrawide
}

const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

export function ResponsivePlayer({
  video,
  isPlaying,
  onTogglePlay,
  onVolumeChange,
  onSeek,
  onFullscreen,
  onPictureInPicture,
  volume,
  progress,
  duration,
  aspectRatio = '16:9',
  maxWidth = '100%',
  className = "",
  showControls = true,
  autoHideControls = true
}: ResponsivePlayerProps) {
  const [isMuted, setIsMuted] = useState(volume === 0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControlsState, setShowControlsState] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [quality, setQuality] = useState('auto')
  const [subtitleEnabled, setSubtitleEnabled] = useState(false)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('xs')
  
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Parse aspect ratio
  const parseAspectRatio = (ratio: string): { width: number; height: number } => {
    if (ASPECT_RATIOS[ratio]) {
      return ASPECT_RATIOS[ratio]
    }
    
    const parts = ratio.split(':').map(Number)
    if (parts.length === 2 && parts.every(n => !isNaN(n))) {
      return { width: parts[0], height: parts[1] }
    }
    
    return ASPECT_RATIOS['16:9'] // Default
  }

  const { width: aspectWidth, height: aspectHeight } = parseAspectRatio(aspectRatio)

  // Calculate responsive dimensions
  const calculateDimensions = (containerWidth: number) => {
    const containerHeight = (containerWidth * aspectHeight) / aspectWidth
    return { width: containerWidth, height: containerHeight }
  }

  // Handle resize and breakpoint detection
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const width = rect.width
        const height = (width * aspectHeight) / aspectWidth
        
        setContainerSize({ width, height })
        
        // Determine breakpoint
        let breakpoint = 'xs'
        for (const [bp, minWidth] of Object.entries(BREAKPOINTS)) {
          if (width >= minWidth) {
            breakpoint = bp
          }
        }
        setCurrentBreakpoint(breakpoint)
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    
    return () => {
      window.removeEventListener('resize', updateSize)
    }
  }, [aspectRatio, aspectWidth, aspectHeight])

  // Auto-hide controls
  useEffect(() => {
    if (autoHideControls && isPlaying && showControls) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControlsState(false)
      }, 3000)
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isPlaying, showControls, autoHideControls])

  const handleMouseMove = () => {
    if (autoHideControls) {
      setShowControlsState(true)
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControlsState(false)
      }, 3000)
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    onVolumeChange(newVolume)
    setIsMuted(newVolume === 0)
  }

  const handleMuteToggle = () => {
    if (isMuted) {
      handleVolumeChange(0.8)
    } else {
      handleVolumeChange(0)
    }
  }

  const handleFullscreenToggle = () => {
    if (!containerRef.current) return
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err)
      })
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
    onFullscreen?.()
  }

  const handlePictureInPicture = () => {
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
    onPictureInPicture?.()
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const skipTime = (seconds: number) => {
    const currentTime = progress * duration
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
    onSeek(newTime / duration)
  }

  const restartVideo = () => {
    onSeek(0)
    if (!isPlaying) {
      onTogglePlay()
    }
  }

  // Responsive control sizes
  const getControlSize = () => {
    switch (currentBreakpoint) {
      case 'xs':
        return { button: 'h-8 w-8', icon: 'h-4 w-4', text: 'text-xs' }
      case 'sm':
        return { button: 'h-9 w-9', icon: 'h-5 w-5', text: 'text-xs' }
      case 'md':
        return { button: 'h-10 w-10', icon: 'h-5 w-5', text: 'text-sm' }
      case 'lg':
        return { button: 'h-11 w-11', icon: 'h-6 w-6', text: 'text-sm' }
      case 'xl':
      case '2xl':
        return { button: 'h-12 w-12', icon: 'h-6 w-6', text: 'text-base' }
      default:
        return { button: 'h-10 w-10', icon: 'h-5 w-5', text: 'text-sm' }
    }
  }

  const controlSize = getControlSize()

  return (
    <div 
      ref={containerRef}
      className={`responsive-player ${className}`}
      style={{ 
        maxWidth,
        width: '100%',
        aspectRatio: `${aspectWidth}/${aspectHeight}`
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => autoHideControls && isPlaying && setShowControlsState(false)}
    >
      <Card className="h-full w-full overflow-hidden">
        <CardContent className="p-0 h-full relative">
          {/* ReactPlayer with responsive config */}
          <ReactPlayer
            ref={playerRef}
            url={video.embedUrl || video.url}
            width="100%"
            height="100%"
            playing={isPlaying}
            volume={volume}
            muted={isMuted}
            onProgress={(state) => onSeek(state.played || 0)}
            onPlay={() => {}}
            onPause={() => {}}
            onError={(error) => console.error('Player error:', error)}
            config={{
              youtube: {}
            }}
          />

          {/* Responsive Controls Overlay */}
          {showControls && (
            <div 
              className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 transition-opacity duration-300 ${
                showControlsState ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {/* Top Controls - Visible on larger screens */}
              {(currentBreakpoint === 'lg' || currentBreakpoint === 'xl' || currentBreakpoint === '2xl') && (
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
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="text-white hover:bg-white/20 h-8 w-8"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Center Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  size="lg"
                  variant="ghost"
                  className={`${controlSize.button} rounded-full bg-white/20 hover:bg-white/30 text-white border-2 border-white/50`}
                  onClick={onTogglePlay}
                >
                  {isPlaying ? 
                    <Pause className={controlSize.icon} /> : 
                    <Play className={`${controlSize.icon} ml-1`} />
                  }
                </Button>
              </div>

              {/* Bottom Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                {/* Progress Bar */}
                <div className="space-y-2 mb-3 md:mb-4">
                  <Slider
                    value={[progress * 100]}
                    onValueChange={(value) => onSeek(value[0] / 100)}
                    max={100}
                    step={0.1}
                    className="w-full h-1.5 md:h-2"
                  />
                  <div className="flex justify-between text-xs md:text-sm text-white">
                    <span>{formatTime(progress * duration)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 md:space-x-2">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className={`${controlSize.button} text-white hover:bg-white/20`}
                      onClick={() => skipTime(-10)}
                    >
                      <svg width={controlSize.icon.replace('h-', '').replace(' w-', '').split(' ')[0]} 
                           height={controlSize.icon.replace('h-', '').replace(' w-', '').split(' ')[1]} 
                           viewBox="0 0 24 24" 
                           fill="currentColor">
                        <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
                      </svg>
                    </Button>
                    
                    <Button 
                      size="icon" 
                      onClick={onTogglePlay}
                      className={`${controlSize.button} bg-white/20 hover:bg-white/30 text-white border-0`}
                    >
                      {isPlaying ? 
                        <Pause className={controlSize.icon} /> : 
                        <Play className={`${controlSize.icon} ml-1`} />
                      }
                    </Button>
                    
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className={`${controlSize.button} text-white hover:bg-white/20`}
                      onClick={() => skipTime(10)}
                    >
                      <svg width={controlSize.icon.replace('h-', '').replace(' w-', '').split(' ')[0]} 
                           height={controlSize.icon.replace('h-', '').replace(' w-', '').split(' ')[1]} 
                           viewBox="0 0 24 24" 
                           fill="currentColor">
                        <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
                      </svg>
                    </Button>
                    
                    {/* Volume Controls - Hidden on extra small screens */}
                    {currentBreakpoint !== 'xs' && (
                      <div className="flex items-center space-x-1 md:space-x-2 ml-2 md:ml-4">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className={`${controlSize.button} text-white hover:bg-white/20`}
                          onClick={handleMuteToggle}
                        >
                          {isMuted ? 
                            <VolumeX className={controlSize.icon} /> : 
                            <Volume2 className={controlSize.icon} />
                          }
                        </Button>
                        <div className="w-12 md:w-16 lg:w-20">
                          <Slider
                            value={[volume]}
                            onValueChange={(value) => handleVolumeChange(value[0])}
                            max={1}
                            step={0.1}
                            className="h-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 md:space-x-2">
                    {/* Advanced Controls - Hidden on smaller screens */}
                    {currentBreakpoint !== 'xs' && currentBreakpoint !== 'sm' && (
                      <>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className={`${controlSize.button} text-white hover:bg-white/20`}
                          onClick={handlePictureInPicture}
                        >
                          <PictureInPicture className={controlSize.icon} />
                        </Button>
                        
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className={`${controlSize.button} text-white hover:bg-white/20`}
                          onClick={restartVideo}
                        >
                          <RotateCcw className={controlSize.icon} />
                        </Button>
                      </>
                    )}
                    
                    {onFullscreen && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className={`${controlSize.button} text-white hover:bg-white/20`}
                        onClick={handleFullscreenToggle}
                      >
                        {isFullscreen ? 
                          <Minimize2 className={controlSize.icon} /> : 
                          <Maximize2 className={controlSize.icon} />
                        }
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Video Info - Responsive positioning */}
          <div className={`absolute ${
            currentBreakpoint === 'xs' || currentBreakpoint === 'sm' 
              ? 'bottom-16 left-0 right-0 p-3 bg-gradient-to-t from-black/90' 
              : 'top-4 left-4 right-4'
          }`}>
            <div className="flex flex-col space-y-1">
              <h3 className={`text-white font-semibold line-clamp-2 ${
                currentBreakpoint === 'xs' ? 'text-sm' : 'text-base md:text-lg'
              }`}>
                {video.title}
              </h3>
              <p className={`text-white/80 ${
                currentBreakpoint === 'xs' ? 'text-xs' : 'text-sm'
              }`}>
                {video.channel}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="bg-black/50 text-white text-xs">
                  {video.views} views
                </Badge>
                <Badge variant="secondary" className="bg-black/50 text-white text-xs">
                  {video.duration}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Responsive Player with Multiple Aspect Ratios
interface MultiAspectRatioPlayerProps extends ResponsivePlayerProps {
  availableRatios?: AspectRatio[]
  onAspectRatioChange?: (ratio: AspectRatio) => void
}

export function MultiAspectRatioPlayer({
  availableRatios = ['16:9', '4:3', '1:1', '9:16'],
  onAspectRatioChange,
  aspectRatio = '16:9',
  ...props
}: MultiAspectRatioPlayerProps) {
  const [currentRatio, setCurrentRatio] = useState<AspectRatio>(aspectRatio)

  const handleRatioChange = (ratio: AspectRatio) => {
    setCurrentRatio(ratio)
    onAspectRatioChange?.(ratio)
  }

  return (
    <div className="space-y-4">
      {/* Aspect Ratio Selector */}
      <div className="flex flex-wrap gap-2">
        {availableRatios.map((ratio) => (
          <Button
            key={ratio}
            size="sm"
            variant={currentRatio === ratio ? "default" : "outline"}
            onClick={() => handleRatioChange(ratio)}
            className="text-xs"
          >
            {ratio}
          </Button>
        ))}
      </div>

      {/* Responsive Player */}
      <ResponsivePlayer
        {...props}
        aspectRatio={currentRatio}
      />
    </div>
  )
}

// Hook for responsive player dimensions
export function useResponsivePlayer(
  containerRef: React.RefObject<HTMLDivElement>,
  aspectRatio: string = '16:9'
) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [breakpoint, setBreakpoint] = useState<string>('xs')

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const width = rect.width
        
        // Parse aspect ratio
        const [aspectWidth, aspectHeight] = aspectRatio.split(':').map(Number)
        const height = (width * aspectHeight) / aspectWidth
        
        setDimensions({ width, height })
        
        // Determine breakpoint
        let currentBreakpoint = 'xs'
        const breakpoints = { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 }
        
        for (const [bp, minWidth] of Object.entries(breakpoints)) {
          if (width >= minWidth) {
            currentBreakpoint = bp
          }
        }
        setBreakpoint(currentBreakpoint)
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    
    return () => {
      window.removeEventListener('resize', updateDimensions)
    }
  }, [containerRef, aspectRatio])

  return { dimensions, breakpoint }
}