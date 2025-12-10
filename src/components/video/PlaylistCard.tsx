'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { 
  Play, 
  Heart, 
  MoreVertical,
  ExternalLink
} from 'lucide-react'

export interface PlaylistCardProps {
  playlist: {
    id: string
    title: string
    description?: string
    thumbnail: string
    videoCount: string
    viewCount: string
    lastUpdatedAt: string
    channelId: string
    channelName: string
    channelThumbnail?: string
  }
  onRemove?: (playlistId: string) => void
  onPlay?: (playlist: any) => void
  className?: string
}

export function PlaylistCard({ playlist, onRemove, onPlay, className = '' }: PlaylistCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    if (onPlay) {
      onPlay(playlist)
    }
  }

  const handleRemove = () => {
    if (onRemove && playlist.id) {
      onRemove(playlist.id)
    }
    setIsMenuOpen(false)
  }

  return (
    <Card 
      className={`group relative transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${className}`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        {/* Playlist Thumbnail */}
        <div className="relative aspect-video bg-muted overflow-hidden rounded-t-lg">
          {playlist.thumbnail ? (
            <img 
              src={playlist.thumbnail} 
              alt={playlist.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <div className="text-4xl font-bold text-muted-foreground">
                📋
              </div>
            </div>
          )}
        </div>

        {/* Playlist Info */}
        <div className="mt-4 space-y-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg font-semibold line-clamp-2">
                {playlist.title}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="h-8 w-8 p-0"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <div className="space-y-2">
            {playlist.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {playlist.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="font-medium">{playlist.videoCount}</span>
                <span>videos</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium">{playlist.viewCount}</span>
                <span>views</span>
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Channel:</span>
              <span className="font-medium">{playlist.channelName}</span>
            </div>

            <div className="text-xs text-muted-foreground">
              Updated {new Date(playlist.lastUpdatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemove}
            className="text-destructive hover:text-destructive"
          >
            Remove
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={() => window.open(`https://youtube.com/playlist?list=${playlist.id}`, '_blank')}
            className="ml-2"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Open
          </Button>
        </div>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-2 z-50 bg-background border rounded-md shadow-lg min-w-[120px] py-1">
            <div className="px-1 py-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(false)}
                className="w-full justify-start"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}