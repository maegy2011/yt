'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Settings, ExternalLink, Users, Play, Eye } from 'lucide-react'
import type { FavoriteChannel } from '@/lib/type-compatibility'

interface ScrollingChannelBarProps {
  channels: FavoriteChannel[]
  className?: string
}

interface ScrollSettings {
  speed: number // pixels per second
  imageSize: 'small' | 'medium' | 'large'
  hoverPause: boolean
  showControls: boolean
}

const imageSizeMap = {
  small: { width: 48, height: 48, class: 'w-12 h-12' },
  medium: { width: 64, height: 64, class: 'w-16 h-16' },
  large: { width: 80, height: 80, class: 'w-20 h-20' }
}

const speedMap = {
  slow: 20,   // 20 pixels per second
  medium: 40, // 40 pixels per second  
  fast: 60    // 60 pixels per second
}

export function ScrollingChannelBar({ channels, className = '' }: ScrollingChannelBarProps) {
  const [settings, setSettings] = useState<ScrollSettings>({
    speed: 40,
    imageSize: 'medium',
    hoverPause: true,
    showControls: false
  })
  
  const [isPaused, setIsPaused] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollContentRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)

  // Duplicate channels for seamless looping
  const duplicatedChannels = [...channels, ...channels]

  useEffect(() => {
    if (!scrollContainerRef.current || !scrollContentRef.current) return

    const container = scrollContainerRef.current
    const content = scrollContentRef.current
    
    const animate = (currentTime: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime
      }

      const deltaTime = currentTime - lastTimeRef.current
      lastTimeRef.current = currentTime

      // Check if we should pause
      const shouldPause = settings.hoverPause && isHovering
      
      if (!shouldPause && content.scrollLeft <= content.scrollWidth / 2) {
        // Scroll to the right
        const scrollAmount = (settings.speed * deltaTime) / 1000 // Convert to pixels
        content.scrollLeft += scrollAmount
      } else if (!shouldPause && content.scrollLeft >= content.scrollWidth / 2) {
        // Reset to beginning for seamless loop
        content.scrollLeft = 0
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    // Start animation
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [settings.speed, settings.hoverPause, isHovering])

  const handleChannelClick = (channel: FavoriteChannel) => {
    window.open(`https://youtube.com/channel/${channel.channelId}`, '_blank')
  }

  const formatCount = (count: number | string | undefined) => {
    if (!count) return '0'
    const num = typeof count === 'string' ? parseInt(count) : count
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (channels.length === 0) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="text-center text-muted-foreground">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Followed Channels</h3>
          <p className="text-sm max-w-md mx-auto">
            Start following YouTube channels to see them here in a beautiful scrolling carousel.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`${className}`}>
      {/* Header with Controls */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Followed Channels
              <Badge variant="secondary">{channels.length}</Badge>
            </h3>
            <p className="text-sm text-muted-foreground">
              Continuously scrolling bar of your favorite YouTube channels
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettings(prev => ({ ...prev, showControls: !prev.showControls }))}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Settings Panel */}
        {settings.showControls && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Speed Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Scroll Speed</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Slow</span>
                  <Slider
                    value={[settings.speed]}
                    onValueChange={([value]) => setSettings(prev => ({ ...prev, speed: value }))}
                    min={20}
                    max={60}
                    step={10}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground">Fast</span>
                </div>
              </div>

              {/* Image Size Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Image Size</label>
                <div className="flex gap-2">
                  {(['small', 'medium', 'large'] as const).map(size => (
                    <Button
                      key={size}
                      variant={settings.imageSize === size ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSettings(prev => ({ ...prev, imageSize: size }))}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Hover Pause Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Hover to Pause</label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.hoverPause}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, hoverPause: checked }))}
                  />
                  <span className="text-sm text-muted-foreground">
                    {settings.hoverPause ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scrolling Container */}
      <div 
        ref={scrollContainerRef}
        className="relative overflow-hidden bg-gradient-to-r from-background via-background to-background"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div
          ref={scrollContentRef}
          className="flex gap-4 p-4 overflow-x-hidden scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {duplicatedChannels.map((channel, index) => (
            <div
              key={`${channel.id}-${index}`}
              className="flex-shrink-0 group cursor-pointer transition-all duration-200 hover:scale-105"
              onClick={() => handleChannelClick(channel)}
            >
              <div className="relative">
                {/* Channel Avatar */}
                <img
                  src={channel.thumbnail?.url || `https://via.placeholder.com/${imageSizeMap[settings.imageSize].width}x${imageSizeMap[settings.imageSize].height}/374151/ffffff?text=${channel.name.charAt(0)}`}
                  alt={channel.name}
                  className={`${imageSizeMap[settings.imageSize].class} rounded-full object-cover border-2 border-border group-hover:border-primary transition-colors`}
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <ExternalLink className="w-4 h-4 text-white" />
                </div>
                
                {/* Online Indicator */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
              </div>
              
              {/* Channel Info */}
              <div className="mt-2 text-center min-w-[80px]">
                <p className="text-xs font-medium line-clamp-1">{channel.name}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {channel.subscriberCount && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{formatCount(channel.subscriberCount)}</span>
                    </div>
                  )}
                  {channel.videoCount && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Play className="w-3 h-3" />
                      <span>{formatCount(channel.videoCount)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Gradient Edges for smooth fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
      </div>

      {/* Status Bar */}
      <div className="p-3 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Speed: {settings.speed === 20 ? 'Slow' : settings.speed === 40 ? 'Medium' : 'Fast'}</span>
            <span>Size: {settings.imageSize.charAt(0).toUpperCase() + settings.imageSize.slice(1)}</span>
            <span>Hover Pause: {settings.hoverPause ? 'On' : 'Off'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-green-500'}`} />
            <span>{isPaused ? 'Paused' : 'Scrolling'}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}