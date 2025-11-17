'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Heart,
  Play,
  Clock,
  Users,
  SortAsc,
  SortDesc,
  Settings,
  Pause,
  Power,
  RefreshCw
} from 'lucide-react'
import { FavoriteVideo } from '@/types/favorites'
import { FavoriteCard } from './FavoriteCard'
import { getFavoritesStats, getUniqueChannels, sortFavoritesByDate, sortFavoritesByTitle, sortFavoritesByViews, formatViewCount } from '@/utils/favorites'

interface FavoriteListProps {
  favorites: FavoriteVideo[]
  loading: boolean
  onRemove: (videoId: string) => void
  onPlay?: (favorite: FavoriteVideo) => void
  onRefresh?: () => void
  onToggleEnabled: (enabled: boolean) => void
  onTogglePaused: (paused: boolean) => void
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
  onToggleEnabled,
  onTogglePaused,
  enabled,
  paused,
  className = '' 
}: FavoriteListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'views'>('date')
  const [showSettings, setShowSettings] = useState(false)

  const uniqueChannels = useMemo(() => getUniqueChannels(favorites), [favorites])
  
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

    // Apply channel filter
    if (channelFilter !== 'all') {
      filtered = filtered.filter(favorite => favorite.channelName === channelFilter)
    }

    // Apply sorting
    switch (sortBy) {
      case 'date':
        filtered = sortFavoritesByDate(filtered)
        break
      case 'title':
        filtered = sortFavoritesByTitle(filtered)
        break
      case 'views':
        filtered = sortFavoritesByViews(filtered)
        break
    }

    return filtered
  }, [favorites, searchQuery, channelFilter, sortBy])

  const stats = useMemo(() => getFavoritesStats(favorites), [favorites])

  const getContainerClasses = () => {
    const baseClasses = 'w-full'
    return `${baseClasses} ${className}`
  }

  const getGridClasses = () => {
    if (viewMode === 'grid') {
      return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
    }
    return 'space-y-4'
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
            <Power className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Favorites Disabled</h3>
            <p className="text-muted-foreground text-center mb-4">
              The favorites module is currently disabled. Enable it to start saving your favorite videos.
            </p>
            <Button onClick={() => onToggleEnabled(true)}>
              <Power className="w-4 h-4 mr-2" />
              Enable Favorites
            </Button>
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
                {paused && (
                  <Badge variant="secondary" className="ml-2">
                    <Pause className="w-3 h-3 mr-1" />
                    Paused
                  </Badge>
                )}
              </CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">
                  {stats.total} videos
                </Badge>
                <Badge variant="outline">
                  {stats.uniqueChannels} channels
                </Badge>
                {stats.totalViews > 0 && (
                  <Badge variant="outline">
                    {formatViewCount(stats.totalViews)}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="w-full sm:w-auto"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? (
                    <div className="w-4 h-4 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refresh
                </Button>
              )}
            </div>
          </div>
          
          {/* Settings Panel */}
          {showSettings && (
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Enable Favorites</h4>
                    <p className="text-xs text-muted-foreground">
                      Turn the favorites module on or off
                    </p>
                  </div>
                  <Button
                    variant={enabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => onToggleEnabled(!enabled)}
                  >
                    <Power className="w-4 h-4 mr-2" />
                    {enabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
                
                {enabled && (
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">Pause Favorites</h4>
                      <p className="text-xs text-muted-foreground">
                        Temporarily pause adding/removing favorites
                      </p>
                    </div>
                    <Button
                      variant={paused ? "default" : "outline"}
                      size="sm"
                      onClick={() => onTogglePaused(!paused)}
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      {paused ? 'Paused' : 'Active'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </CardHeader>
        
        <CardContent>
          {/* Search and Filters */}
          <div className="space-y-4">
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

            {/* Filter Controls - Mobile First */}
            <div className="space-y-3">
              {/* Channel Filter */}
              <div className="flex items-center gap-1 p-2 bg-muted rounded-lg">
                <Button
                  variant={channelFilter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChannelFilter('all')}
                  className="text-xs flex-1 justify-start"
                >
                  All Channels
                </Button>
                {uniqueChannels.slice(0, 3).map(channel => (
                  <Button
                    key={channel}
                    variant={channelFilter === channel ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setChannelFilter(channel)}
                    className="text-xs flex-1 justify-start"
                  >
                    <Users className="w-3 h-3 mr-2" />
                    {channel}
                  </Button>
                ))}
              </div>

              {/* Sort and View Options */}
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Sort Options */}
                <div className="flex items-center gap-1 p-2 bg-muted rounded-lg flex-1">
                  <Button
                    variant={sortBy === 'date' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy('date')}
                    className="text-xs flex-1 justify-start"
                  >
                    <Clock className="w-3 h-3 mr-2" />
                    Date
                  </Button>
                  <Button
                    variant={sortBy === 'title' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy('title')}
                    className="text-xs flex-1 justify-start"
                  >
                    A-Z
                  </Button>
                  <Button
                    variant={sortBy === 'views' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy('views')}
                    className="text-xs flex-1 justify-start"
                  >
                    Views
                  </Button>
                </div>

                {/* View Mode */}
                <div className="flex items-center gap-1 p-2 bg-muted rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="text-xs flex-1 justify-start"
                  >
                    <Grid className="w-3 h-3 mr-2" />
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="text-xs flex-1 justify-start"
                  >
                    <List className="w-3 h-3 mr-2" />
                    List
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Favorites Grid/List */}
      {filteredFavorites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Heart className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No favorites found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {paused 
                ? 'Favorites are currently paused. Unpause to add favorites.'
                : searchQuery || channelFilter !== 'all'
                ? 'No favorites match your search criteria.'
                : 'Start adding videos to your favorites to see them here.'
              }
            </p>
            {paused && (
              <Button onClick={() => onTogglePaused(false)}>
                <Pause className="w-4 h-4 mr-2" />
                Unpause Favorites
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className={getGridClasses()}>
            {filteredFavorites.map((favorite) => (
              <FavoriteCard
                key={favorite.id}
                favorite={favorite}
                onRemove={onRemove}
                onPlay={onPlay}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}