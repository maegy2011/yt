'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Clock, 
  Eye, 
  Heart, 
  ExternalLink,
  Loader2,
  Play
} from 'lucide-react'
import { searchVideos, formatViewCount, formatPublishedAt, formatDuration } from '@/lib/youtube'
import { useToast } from '@/hooks/use-toast'
import type { Video } from '@/lib/youtube'

interface SearchPageProps {
  onVideoSelect: (video: Video) => void
  onMarkAsWatched: (video: Video) => void
  onToggleFavorite: (video: Video) => void
  watchedVideos: any[]
  favoriteVideos: any[]
  videoNotes: any[]
}

export function SearchPage({ 
  onVideoSelect, 
  onMarkAsWatched, 
  onToggleFavorite,
  watchedVideos,
  favoriteVideos,
  videoNotes
}: SearchPageProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [searchType, setSearchType] = useState<'video' | 'channel' | 'all'>('video')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    try {
      const results = await searchVideos(searchQuery, searchType === 'all' ? 'video' : searchType)
      setSearchResults(results.items || [])
      
      // Add to search history
      if (!searchHistory.includes(searchQuery)) {
        setSearchHistory(prev => [searchQuery, ...prev.slice(0, 9)])
      }
      
      toast({
        title: 'Search Complete',
        description: `Found ${results.items?.length || 0} results`,
      })
    } catch (error) {
      console.error('Search error:', error)
      toast({
        title: 'Search Failed',
        description: 'An error occurred while searching',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const renderVideoCard = (video: Video) => {
    const isWatched = watchedVideos.some(watched => watched.videoId === video.id)
    const isFavorited = favoriteVideos.some(fav => fav.videoId === video.id)
    const hasNotes = videoNotes.some(note => note.videoId === video.id)

    return (
      <Card key={video.id} className={`group hover:shadow-lg transition-all duration-200 ${viewMode === 'list' ? 'p-4' : 'p-4'}`}>
        <div className={`${viewMode === 'list' ? 'flex gap-4' : 'space-y-3'}`}>
          <div className={`${viewMode === 'list' ? 'w-48 h-28' : 'w-full h-40'} relative overflow-hidden rounded-lg`}>
            <img
              src={video.thumbnail?.url || '/placeholder-video.png'}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-video.png'
              }}
            />
            {video.duration && (
              <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1">
                {formatDuration(video.duration)}
              </Badge>
            )}
            {isWatched && (
              <Badge className="absolute top-2 left-2 bg-green-600 text-white text-xs">
                <Eye className="w-3 h-3 mr-1" />
                Watched
              </Badge>
            )}
          </div>
          
          <div className={`${viewMode === 'list' ? 'flex-1' : 'space-y-2'}`}>
            <h3 className={`font-medium line-clamp-2 ${viewMode === 'list' ? 'text-base' : 'text-sm'}`}>
              {video.title}
            </h3>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{video.channel?.name || 'Unknown Channel'}</span>
              {video.viewCount && (
                <>
                  <span>•</span>
                  <span>{formatViewCount(video.viewCount)} views</span>
                </>
              )}
              {video.publishedAt && (
                <>
                  <span>•</span>
                  <span>{formatPublishedAt(video.publishedAt)}</span>
                </>
              )}
            </div>
            
            {video.description && viewMode === 'list' && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                {video.description}
              </p>
            )}
            
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onVideoSelect(video)}
                className="text-xs"
              >
                <Play className="w-3 h-3 mr-1" />
                Play
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMarkAsWatched(video)}
                disabled={isWatched}
                className="text-xs"
              >
                {isWatched ? (
                  <><Eye className="w-3 h-3 mr-1" /> Watched</>
                ) : (
                  <><Eye className="w-3 h-3 mr-1" /> Mark</>
                )}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => onToggleFavorite(video)}
                className="text-xs"
              >
                {isFavorited ? (
                  <><Heart className="w-3 h-3 mr-1 fill-red-500 text-red-500" /></>
                ) : (
                  <><Heart className="w-3 h-3 mr-1" /></>
                )}
              </Button>
              
              {hasNotes && (
                <Badge variant="secondary" className="text-xs">
                  Notes
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Search YouTube</h1>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search for videos, channels, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={searchType === 'video' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchType('video')}
            >
              Videos
            </Button>
            <Button
              variant={searchType === 'channel' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchType('channel')}
            >
              Channels
            </Button>
            <Button
              variant={searchType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchType('all')}
            >
              All
            </Button>
          </div>
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Recent:</span>
            {searchHistory.map((term, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-muted"
                onClick={() => {
                  setSearchQuery(term)
                  handleSearch()
                }}
              >
                {term}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Results Header */}
      {searchResults.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">
              Search Results ({searchResults.length})
            </h2>
            <Badge variant="secondary">{searchType}</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
          {searchResults.map(video => renderVideoCard(video))}
        </div>
      )}

      {/* Empty State */}
      {searchResults.length === 0 && !loading && searchQuery && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
          <p className="text-muted-foreground mb-4">
            Try different keywords or check your spelling
          </p>
        </div>
      )}

      {/* Initial State */}
      {!searchQuery && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Search YouTube</h3>
          <p className="text-muted-foreground mb-4">
            Find videos, channels, and topics you're interested in
          </p>
        </div>
      )}
    </div>
  )
}