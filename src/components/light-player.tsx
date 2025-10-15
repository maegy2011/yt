'use client'

import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, Volume2, VolumeX, Maximize2 } from 'lucide-react'

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

interface LightPlayerProps {
  video: Video
  onClick: () => void
  className?: string
  showControls?: boolean
  light?: string | boolean
}

export function LightPlayer({ 
  video, 
  onClick, 
  className = "",
  showControls = true,
  light = true 
}: LightPlayerProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState([0.8])
  const [muted, setMuted] = useState(false)
  const playerRef = useRef<any>(null)

  const handlePlay = () => {
    setIsPlaying(true)
    onClick()
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const toggleMute = () => {
    setMuted(!muted)
    setVolume(muted ? [0.8] : [0])
  }

  const handleProgress = (state: any) => {
    // Handle progress if needed
  }

  const handleError = (error: any) => {
    console.error('Light player error:', error)
    setIsPlaying(false)
  }

  const handleReady = () => {
    // Player is ready
  }

  // Custom light component
  const renderLightComponent = () => {
    if (typeof light === 'string') {
      // Custom image URL
      return (
        <img 
          src={light} 
          alt={video.title}
          className="w-full h-full object-cover"
        />
      )
    }

    // Default light mode with thumbnail
    return (
      <div className="relative w-full h-full">
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20 transition-opacity duration-300" />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="transform transition-transform duration-300 scale-90 group-hover:scale-100">
            <Button
              size="lg"
              variant="ghost"
              className="h-20 w-20 rounded-full bg-white/90 hover:bg-white text-black border-2 border-white/50 shadow-lg"
              onClick={handlePlay}
            >
              <Play className="h-10 w-10 ml-1" />
            </Button>
          </div>
        </div>

        {/* Video Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <h3 className="text-white font-semibold text-lg mb-1 line-clamp-2">
            {video.title}
          </h3>
          <p className="text-white/80 text-sm">{video.channel}</p>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="secondary" className="bg-black/50 text-white text-xs">
              {video.views} views
            </Badge>
            <Badge variant="secondary" className="bg-black/50 text-white text-xs">
              {video.duration}
            </Badge>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card 
      className={`overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-xl ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0">
        <div className="relative aspect-video bg-black">
          {light ? (
            renderLightComponent()
          ) : (
            <>
              <ReactPlayer
                ref={playerRef}
                url={video.embedUrl || video.url}
                width="100%"
                height="100%"
                playing={isPlaying}
                volume={volume[0]}
                muted={muted}
                light={false}
                playIcon={<></>} // Hide default play icon
                onPlay={handlePlay}
                onPause={handlePause}
                onProgress={handleProgress}
                onError={handleError}
                onReady={handleReady}
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
              
              {/* Custom Overlay */}
              <div className="absolute inset-0 bg-black/20 transition-opacity duration-300" />
              
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="transform transition-transform duration-300 scale-90 group-hover:scale-100">
                    <Button
                      size="lg"
                      variant="ghost"
                      className="h-16 w-16 rounded-full bg-white/90 hover:bg-white text-black border-2 border-white/50 shadow-lg"
                      onClick={handlePlay}
                    >
                      <Play className="h-8 w-8 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Hover Controls */}
              {showControls && isHovered && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="text-white">
                      <h4 className="font-medium text-sm line-clamp-1">{video.title}</h4>
                      <p className="text-xs text-white/80">{video.channel}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-white hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleMute()
                        }}
                      >
                        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-white hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          onClick()
                        }}
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Responsive Light Player Component
interface ResponsiveLightPlayerProps extends LightPlayerProps {
  aspectRatio?: string
  maxWidth?: string
}

export function ResponsiveLightPlayer({ 
  aspectRatio = '16/9',
  maxWidth = '100%',
  ...props 
}: ResponsiveLightPlayerProps) {
  return (
    <div 
      className="responsive-player-container"
      style={{ 
        maxWidth,
        aspectRatio
      }}
    >
      <LightPlayer {...props} />
    </div>
  )
}

// Advanced Light Player with Preview
interface AdvancedLightPlayerProps extends LightPlayerProps {
  previewTime?: number
  showPreview?: boolean
  autoPlayPreview?: boolean
}

export function AdvancedLightPlayer({ 
  previewTime = 3,
  showPreview = true,
  autoPlayPreview = false,
  ...props 
}: AdvancedLightPlayerProps) {
  const [showVideoPreview, setShowVideoPreview] = useState(false)
  const [previewPlaying, setPreviewPlaying] = useState(false)

  const handleMouseEnter = () => {
    if (showPreview && autoPlayPreview) {
      setShowVideoPreview(true)
      setPreviewPlaying(true)
    }
  }

  const handleMouseLeave = () => {
    setShowVideoPreview(false)
    setPreviewPlaying(false)
  }

  return (
    <div 
      className="relative group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <LightPlayer {...props} />
      
      {/* Video Preview Overlay */}
      {showPreview && (
        <div 
          className={`absolute inset-0 bg-black z-10 transition-opacity duration-300 ${
            showVideoPreview ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ReactPlayer
            url={props.video.embedUrl || props.video.url}
            width="100%"
            height="100%"
            playing={previewPlaying}
            volume={0}
            muted={true}
            controls={false}
            light={false}
            onReady={() => {
              // Seek to preview time
              if (previewTime > 0) {
                // Note: Seeking would need to be implemented with ref
              }
            }}
            config={{
              youtube: {
                playerVars: {
                  modestbranding: 1,
                  controls: 0,
                  showinfo: 0,
                  rel: 0,
                  autoplay: 1,
                  mute: 1,
                  playsinline: 1
                }
              }
            }}
          />
          
          {/* Preview Indicator */}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-black/70 text-white text-xs">
              Preview
            </Badge>
          </div>
        </div>
      )}
    </div>
  )
}