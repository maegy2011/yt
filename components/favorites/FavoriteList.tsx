'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Search, 
  Heart, 
  Play,
  RefreshCw,
  Trash2,
  Grid,
  List,
  Clock,
  Users
} from 'lucide-react'
import { VideoCard } from '@/components/video'
import { favoriteVideoToCardData } from '@/components/video/videoCardConverters'
import { FavoriteVideo } from '@/types/favorites'

interface FavoriteListProps {
  favorites: FavoriteVideo[]
  loading: boolean
  onRemove: (videoId: string) => void
  onPlay?: (video: FavoriteVideo) => void
  onRefresh?: () => void
  enabled: boolean
  paused: boolean
  className?: string
}

export function FavoriteList({ 
  favorites, 
  loading, 
  onRemove, 
  onPlay, 
  onRefresh,
  enabled,
  paused,
  className = '' 
}: FavoriteListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date')

  const filteredFavorites = useMemo(() => {
    let filtered = favorites

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(favorite =>
        favorite.title.toLowerCase().includes(query) ||
        favorite.channelName.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    switch (sortBy) {
      case 'date':
        filtered = filtered.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
        break
      case 'title':
        filtered = filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
    }
    return filtered
  }, [favorites, searchQuery, sortBy])

  const stats = useMemo(() => {
    const total = favorites.length
    const totalViews = favorites.reduce((sum, f) => sum + (f.viewCount || 0), 0)
    return { total, totalViews }
  }, [favorites])

  const getContainerClasses = () => {
    const baseClasses = 'w-full'
    return `${baseClasses} ${className}`
  }

  const getGridClasses = () => {
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
  }

  if (loading) {
    return (
      <div className={getContainerClasses()}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading favorites...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!enabled) {
    return (
      <div className={getContainerClasses()}>
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Heart className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Favorites Disabled</h3>
            <p className="text-muted-foreground text-center mb-4">
              The favorites module is currently disabled. Enable it to start saving your favorite videos.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={getContainerClasses()}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Favorite Videos
                <Badge variant="secondary">{stats.total}</Badge>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-4 h-4 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search favorites by title or channel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={paused}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Favorites Grid */}
      {filteredFavorites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Heart className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No favorites found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {paused 
                ? 'Favorites are currently paused. Unpause to add favorites.'
                : 'Start adding videos to your favorites to see them here.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className={getGridClasses()}>
            {filteredFavorites.map((favorite) => (
              <VideoCard
                key={favorite.id}
                video={favoriteVideoToCardData(favorite)}
                variant="favorite"
                onRemove={() => onRemove(favorite.id)}
                onPlay={onPlay ? () => onPlay(favorite) : undefined}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}