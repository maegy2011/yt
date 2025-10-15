'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Eye, Heart, Download } from 'lucide-react'

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

interface VideoCardProps {
  video: Video
  onClick: () => void
  onBookmark?: () => void
  onSubscribe?: () => void
  isBookmarked?: boolean
  isDownloaded?: boolean
  isSubscribed?: boolean
}

export function VideoCard({ 
  video, 
  onClick, 
  onBookmark,
  onSubscribe,
  isBookmarked = false,
  isDownloaded = false,
  isSubscribed = false
}: VideoCardProps) {
  return (
    <Card 
      className="overflow-hidden cursor-pointer video-card group"
      onClick={onClick}
    >
      <div className="relative aspect-video">
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="bg-white/90 rounded-full p-3">
            <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-12 border-b-black ml-1"></div>
          </div>
        </div>
        <Badge 
          variant="secondary" 
          className="absolute bottom-2 right-2 bg-black/80 text-white text-xs"
        >
          {video.duration}
        </Badge>
        {isDownloaded && (
          <Badge 
            variant="default" 
            className="absolute top-2 left-2 bg-green-600 text-white text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            Downloaded
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground line-clamp-1">
              {video.channel}
            </p>
            {onSubscribe && (
              <Button
                size="sm"
                variant={isSubscribed ? "default" : "outline"}
                className="text-xs px-2 py-1 h-6"
                onClick={(e) => {
                  e.stopPropagation()
                  onSubscribe()
                }}
              >
                <Heart className={`h-3 w-3 mr-1 ${isSubscribed ? 'fill-current' : ''}`} />
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Eye className="h-3 w-3" />
                <span>{video.views}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{video.published}</span>
              </div>
            </div>
            {onBookmark && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs px-2 py-1 h-6"
                onClick={(e) => {
                  e.stopPropagation()
                  onBookmark()
                }}
              >
                <Heart className={`h-3 w-3 ${isBookmarked ? 'fill-current text-red-500' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}