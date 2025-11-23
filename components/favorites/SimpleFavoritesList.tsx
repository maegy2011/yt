'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Heart, 
  Play, 
  Trash2, 
  ExternalLink,
  Loader2,
  Clock
} from 'lucide-react'
import { FavoriteVideo } from '@/types/favorites-simple'
import { VideoCard } from '@/components/video'
import { favoriteVideoToCardData } from '@/components/video/videoCardConverters'

interface SimpleFavoritesListProps {
  favorites: FavoriteVideo[]
  loading: boolean
  onRemove: (videoId: string) => void
  onPlay: (video: FavoriteVideo) => void
  className?: string
}

export function SimpleFavoritesList({ 
  favorites, 
  loading, 
  onRemove, 
  onPlay,
  className = '' 
}: SimpleFavoritesListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter favorites based on search
  const filteredFavorites = favorites.filter(favorite =>
    favorite.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    favorite.channelName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate simple stats
  const stats = {
    total: favorites.length,
    uniqueChannels: new Set(favorites.map(f => f.channelName)).size,
    totalViews: favorites.reduce((sum, f) => sum + (f.viewCount || 0), 0)
  }

  const formatViewCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  const formatAddedAt = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading favorites...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Favorite Videos
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="secondary">
                {stats.total} videos
              </Badge>
              <Badge variant="outline">
                {stats.uniqueChannels} channels
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Favorites Grid */}
      {filteredFavorites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Heart className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? 'No favorites found' : 'No favorites yet'}
            </h3>
            <p className="text-muted-foreground text-center">
              {searchQuery 
                ? 'Try adjusting your search terms.'
                : 'Start adding videos to your favorites to see them here.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFavorites.map((favorite) => (
              <VideoCard
                key={favorite.id}
                video={favoriteVideoToCardData(favorite)}
                variant="favorite"
                onRemove={onRemove}
                onPlay={onPlay}
                size="md"
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}