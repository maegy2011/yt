'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Channel {
  id: string
  channel_id: string
  channel_title: string
  video_count: number
  thumbnail_url?: string
}

interface ChannelSliderProps {
  channels: Channel[]
  onChannelClick?: (channelId: string) => void
  className?: string
}

export default function ChannelSlider({ 
  channels, 
  onChannelClick, 
  className = '' 
}: ChannelSliderProps) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    updateScrollButtons()
    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', updateScrollButtons)
      return () => container.removeEventListener('scroll', updateScrollButtons)
    }
  }, [channels])

  const updateScrollButtons = () => {
    const container = containerRef.current
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0)
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth
      )
      setScrollPosition(container.scrollLeft)
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    const container = containerRef.current
    if (container) {
      const scrollAmount = container.clientWidth * 0.8
      const newScrollPosition = direction === 'left' 
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount
      
      container.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
      })
    }
  }

  // Touch and mouse drag handlers
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const container = containerRef.current
    if (!container) return

    setIsDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    setStartX(clientX)
    setScrollLeft(container.scrollLeft)
    
    if (container.style) {
      container.style.cursor = 'grabbing'
      container.style.userSelect = 'none'
    }
  }

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return
    
    e.preventDefault()
    const container = containerRef.current
    if (!container) return

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const walk = (clientX - startX) * 2
    container.scrollLeft = scrollLeft - walk
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    const container = containerRef.current
    if (container && container.style) {
      container.style.cursor = 'grab'
      container.style.userSelect = ''
    }
  }

  const handleChannelClick = (channelId: string) => {
    onChannelClick?.(channelId)
  }

  if (channels.length === 0) {
    return null
  }

  return (
    <div className={`relative ${className}`}>
      {/* Scroll buttons */}
      {canScrollLeft && (
        <Button
          variant="outline"
          size="sm"
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 rounded-full shadow-lg bg-white/80 backdrop-blur-sm"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}
      
      {canScrollRight && (
        <Button
          variant="outline"
          size="sm"
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 rounded-full shadow-lg bg-white/80 backdrop-blur-sm"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}

      {/* Channel slider container */}
      <div
        ref={containerRef}
        className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4 cursor-grab"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        {channels.map((channel) => (
          <div
            key={channel.id}
            className="flex-shrink-0 w-32 cursor-pointer group"
            onClick={() => handleChannelClick(channel.channel_id)}
          >
            <div className="relative">
              {/* Channel thumbnail */}
              <div className="relative w-32 h-32 bg-gray-200 rounded-lg overflow-hidden group-hover:shadow-lg transition-shadow">
                {channel.thumbnail_url ? (
                  <Image
                    src={channel.thumbnail_url}
                    alt={channel.channel_title}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                    <span className="text-white text-2xl font-bold">
                      {channel.channel_title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                {/* Video count overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-2 text-center">
                  {channel.video_count} {channel.video_count === 1 ? 'video' : 'videos'}
                </div>
              </div>
              
              {/* Channel title */}
              <div className="mt-2 text-center">
                <h3 className="font-medium text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {channel.channel_title}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Custom scrollbar styling */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}