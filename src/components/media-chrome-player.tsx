'use client'

import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Dynamically import ReactPlayer to avoid SSR issues
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false })

// Note: This is a conceptual implementation of Media Chrome controls
// In a real implementation, you would install and import the actual media-chrome package
// npm install media-chrome

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

interface MediaChromePlayerProps {
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
  className?: string
}

// Mock Media Chrome components (in real implementation, import from 'media-chrome/react')
const MediaController = ({ children, style, ...props }: any) => (
  <div 
    style={{ 
      width: "100%", 
      aspectRatio: "16/9",
      position: 'relative',
      ...style 
    }}
    {...props}
  >
    {children}
  </div>
)

const MediaControlBar = ({ children, ...props }: any) => (
  <div 
    style={{
      position: 'absolute',
      bottom: '0',
      left: '0',
      right: '0',
      background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
      padding: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      ...props
    }}
  >
    {children}
  </div>
)

const MediaPlayButton = ({ onClick, isPlaying, ...props }: any) => (
  <Button
    variant="ghost"
    size="icon"
    onClick={onClick}
    className="h-10 w-10 bg-white/20 hover:bg-white/30 text-white border-0"
    {...props}
  >
    {isPlaying ? (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
      </svg>
    ) : (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    )}
  </Button>
)

const MediaSeekBackwardButton = ({ onClick, seekOffset = 10, ...props }: any) => (
  <Button
    variant="ghost"
    size="icon"
    onClick={onClick}
    className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white border-0"
    {...props}
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
      <text x="12" y="8" fontSize="8" fill="white" textAnchor="middle">{seekOffset}</text>
    </svg>
  </Button>
)

const MediaSeekForwardButton = ({ onClick, seekOffset = 10, ...props }: any) => (
  <Button
    variant="ghost"
    size="icon"
    onClick={onClick}
    className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white border-0"
    {...props}
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
      <text x="12" y="8" fontSize="8" fill="white" textAnchor="middle">{seekOffset}</text>
    </svg>
  </Button>
)

const MediaTimeRange = ({ value, onValueChange, max = 100, ...props }: any) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(parseFloat(e.target.value))
  }

  return (
    <input
      type="range"
      min="0"
      max={max}
      value={value}
      onChange={handleChange}
      className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
      style={{
        background: `linear-gradient(to right, white 0%, white ${(value/max) * 100}%, rgba(255,255,255,0.3) ${(value/max) * 100}%, rgba(255,255,255,0.3) 100%)`
      }}
      {...props}
    />
  )
}

const MediaTimeDisplay = ({ currentTime, duration, showDuration = true, ...props }: any) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <span className="text-white text-xs font-mono" {...props}>
      {formatTime(currentTime)}
      {showDuration && ` / ${formatTime(duration)}`}
    </span>
  )
}

const MediaMuteButton = ({ onClick, isMuted, volume, ...props }: any) => (
  <Button
    variant="ghost"
    size="icon"
    onClick={onClick}
    className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white border-0"
    {...props}
  >
    {isMuted || volume === 0 ? (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
      </svg>
    ) : (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
      </svg>
    )}
  </Button>
)

const MediaVolumeRange = ({ value, onValueChange, max = 1, step = 0.1, ...props }: any) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(parseFloat(e.target.value))
  }

  return (
    <input
      type="range"
      min="0"
      max={max}
      step={step}
      value={value}
      onChange={handleChange}
      className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
      {...props}
    />
  )
}

const MediaPlaybackRateButton = ({ onClick, playbackRate, ...props }: any) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onClick}
    className="h-8 px-3 bg-white/10 hover:bg-white/20 text-white border-0 text-xs"
    {...props}
  >
    {playbackRate}x
  </Button>
)

const MediaFullscreenButton = ({ onClick, isFullscreen, ...props }: any) => (
  <Button
    variant="ghost"
    size="icon"
    onClick={onClick}
    className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white border-0"
    {...props}
  >
    {isFullscreen ? (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
      </svg>
    ) : (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
      </svg>
    )}
  </Button>
)

export function MediaChromePlayer({
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
  className = ""
}: MediaChromePlayerProps) {
  const [isMuted, setIsMuted] = useState(volume === 0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const playerRef = useRef<any>(null)

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2]

  const handleVolumeChange = (newVolume: number) => {
    onVolumeChange(newVolume)
    setIsMuted(newVolume === 0)
  }

  const handleMuteToggle = () => {
    if (isMuted) {
      onVolumeChange(0.8)
      setIsMuted(false)
    } else {
      onVolumeChange(0)
      setIsMuted(true)
    }
  }

  const handlePlaybackRateChange = () => {
    const currentIndex = playbackRates.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % playbackRates.length
    setPlaybackRate(playbackRates[nextIndex])
  }

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen)
    onFullscreen?.()
  }

  const handleSeekBackward = () => {
    onSeek(Math.max(0, progress - 0.1))
  }

  const handleSeekForward = () => {
    onSeek(Math.min(1, progress + 0.1))
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0">
        <MediaController>
          {/* ReactPlayer as the media element */}
          <ReactPlayer
            ref={playerRef}
            url={video.embedUrl || video.url}
            width="100%"
            height="100%"
            playing={isPlaying}
            volume={volume}
            muted={isMuted}
            playbackRate={playbackRate}
            controls={false} // Disable native controls
            light={false}
            config={{
              youtube: {
                playerVars: {
                  modestbranding: 1,
                  rel: 0,
                  showinfo: 0,
                  controls: 0,
                  disablekb: 1,
                  fs: 0,
                  iv_load_policy: 3,
                  playsinline: 1,
                  autoplay: 0
                },
                embedOptions: {
                  host: 'https://www.youtube.com',
                  embedPath: '/embed/',
                  protocol: 'https'
                }
              }
            }}
          />

          {/* Media Chrome Control Bar */}
          <MediaControlBar>
            <MediaPlayButton 
              onClick={onTogglePlay} 
              isPlaying={isPlaying}
            />
            <MediaSeekBackwardButton 
              onClick={handleSeekBackward}
              seekOffset={10}
            />
            <MediaSeekForwardButton 
              onClick={handleSeekForward}
              seekOffset={10}
            />
            
            <MediaTimeRange 
              value={progress * 100}
              onValueChange={(value) => onSeek(value / 100)}
            />
            
            <MediaTimeDisplay 
              currentTime={progress * duration}
              duration={duration}
            />
            
            <MediaMuteButton 
              onClick={handleMuteToggle}
              isMuted={isMuted}
              volume={volume}
            />
            
            <MediaVolumeRange 
              value={volume}
              onValueChange={handleVolumeChange}
            />
            
            <MediaPlaybackRateButton 
              onClick={handlePlaybackRateChange}
              playbackRate={playbackRate}
            />
            
            {onFullscreen && (
              <MediaFullscreenButton 
                onClick={handleFullscreenToggle}
                isFullscreen={isFullscreen}
              />
            )}
          </MediaControlBar>

          {/* Video Info Overlay */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold text-lg">{video.title}</h3>
                <p className="text-white/80 text-sm">{video.channel}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-black/50 text-white">
                  {video.views} views
                </Badge>
                <Badge variant="secondary" className="bg-black/50 text-white">
                  {video.duration}
                </Badge>
              </div>
            </div>
          </div>
        </MediaController>
      </CardContent>
    </Card>
  )
}

// Standalone Media Chrome Controls Component
export function MediaChromeControls({
  isPlaying,
  onTogglePlay,
  volume,
  onVolumeChange,
  progress,
  onSeek,
  duration,
  playbackRate = 1,
  onPlaybackRateChange,
  isFullscreen = false,
  onFullscreenToggle,
  className = ""
}: {
  isPlaying: boolean
  onTogglePlay: () => void
  volume: number
  onVolumeChange: (volume: number) => void
  progress: number
  onSeek: (progress: number) => void
  duration: number
  playbackRate?: number
  onPlaybackRateRateChange?: (rate: number) => void
  isFullscreen?: boolean
  onFullscreenToggle?: () => void
  className?: string
}) {
  const [isMuted, setIsMuted] = useState(volume === 0)

  const handleMuteToggle = () => {
    if (isMuted) {
      onVolumeChange(0.8)
      setIsMuted(false)
    } else {
      onVolumeChange(0)
      setIsMuted(true)
    }
  }

  const handleSeekBackward = () => {
    onSeek(Math.max(0, progress - 0.1))
  }

  const handleSeekForward = () => {
    onSeek(Math.min(1, progress + 0.1))
  }

  return (
    <div className={`flex items-center space-x-2 p-3 bg-black/80 rounded-lg ${className}`}>
      <MediaPlayButton onClick={onTogglePlay} isPlaying={isPlaying} />
      <MediaSeekBackwardButton onClick={handleSeekBackward} seekOffset={10} />
      <MediaSeekForwardButton onClick={handleSeekForward} seekOffset={10} />
      
      <div className="flex-1 min-w-0">
        <MediaTimeRange 
          value={progress * 100}
          onValueChange={(value) => onSeek(value / 100)}
        />
      </div>
      
      <MediaTimeDisplay 
        currentTime={progress * duration}
        duration={duration}
      />
      
      <MediaMuteButton 
        onClick={handleMuteToggle}
        isMuted={isMuted}
        volume={volume}
      />
      
      <MediaVolumeRange 
        value={volume}
        onValueChange={onVolumeChange}
      />
      
      {onPlaybackRateRateChange && (
        <MediaPlaybackRateButton 
          onClick={() => onPlaybackRateRateChange(playbackRate)}
          playbackRate={playbackRate}
        />
      )}
      
      {onFullscreenToggle && (
        <MediaFullscreenButton 
          onClick={onFullscreenToggle}
          isFullscreen={isFullscreen}
        />
      )}
    </div>
  )
}