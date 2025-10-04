'use client'

import { useState } from 'react'
import Image from 'next/image'
import VideoPlayer from './video-player'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Eye } from 'lucide-react'

interface VideoCardProps {
  id: string
  videoId: string
  title: string
  description?: string
  thumbnails?: any
  duration?: string
  manualTags?: string
  isActive?: boolean
  onPlay?: () => void
}

export default function VideoCard({
  id,
  videoId,
  title,
  description,
  thumbnails,
  duration,
  manualTags,
  isActive = true,
  onPlay
}: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Get the best thumbnail URL
  const getThumbnailUrl = () => {
    if (thumbnails && thumbnails.maxres) {
      return thumbnails.maxres.url
    }
    if (thumbnails && thumbnails.high) {
      return thumbnails.high.url
    }
    if (thumbnails && thumbnails.medium) {
      return thumbnails.medium.url
    }
    if (thumbnails && thumbnails.default) {
      return thumbnails.default.url
    }
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
  }

  // Format duration from ISO 8601 to readable format
  const formatDuration = (duration?: string) => {
    if (!duration) return ''
    
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return ''
    
    const hours = parseInt(match[1] || '0')
    const minutes = parseInt(match[2] || '0')
    const seconds = parseInt(match[3] || '0')
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handlePlay = () => {
    setIsPlaying(true)
    onPlay?.()
  }

  if (isPlaying) {
    return (
      <Card className="w-full">
        <CardContent className="p-0">
          <VideoPlayer
            videoId={videoId}
            title={title}
            className="aspect-video"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="relative aspect-video bg-gray-100">
          <Image
            src={getThumbnailUrl()}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Duration badge */}
          {duration && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
              {formatDuration(duration)}
            </div>
          )}
          
          {/* Play button overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
            <Button
              variant="secondary"
              size="lg"
              className="opacity-0 hover:opacity-100 transition-opacity"
              onClick={handlePlay}
            >
              <Eye className="w-5 h-5 mr-2" />
              Play
            </Button>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{title}</h3>
          
          {description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-3">{description}</p>
          )}
          
          {manualTags && (
            <div className="flex flex-wrap gap-1 mb-3">
              {manualTags.split(',').map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag.trim()}
                </Badge>
              ))}
            </div>
          )}
          
          {!isActive && (
            <Badge variant="destructive" className="text-xs">
              Inactive
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}