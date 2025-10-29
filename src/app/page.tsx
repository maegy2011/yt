'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import ErrorBoundary from '@/components/error-boundary'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Home, 
  Search, 
  Play, 
  Clock, 
  Heart, 
  FileText, 
  User, 
  Check,
  Loader2,
  Edit,
  ArrowLeft,
  Settings,
  RefreshCw,
  TrendingUp,
  Eye,
  Plus,
  Bell,
  Calendar,
  PlayCircle,
  Users,
  Video,
  Filter,
  Grid,
  List,
  Star,
  BarChart3,
  Zap
} from 'lucide-react'
import { searchVideos, formatViewCount, formatPublishedAt, formatDuration } from '@/lib/youtube'
import { apiRequest, useApiError } from '@/lib/api-error-handler'
import { ClientOnlyDate } from '@/components/client-only-date'
import { ErrorStatus } from '@/components/error-status'
import type { Video, Channel } from '@/lib/youtube'
import { VideoCardSkeleton } from '@/components/video-skeleton'
import { SplashScreen } from '@/components/splash-screen'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'
import { NavigationSidebar } from '@/components/navigation-sidebar'
import { BottomNavigation } from '@/components/bottom-navigation'
import { SearchPage } from '@/components/pages/search-page'

// Types
type Tab = 'home' | 'search' | 'player' | 'watched' | 'channels' | 'explore' | 'notes' | 'favorites' | 'config'

interface BaseVideoData {
  id: string
  videoId: string
  title: string
  channelName: string
  thumbnail: string
  duration?: string
  viewCount?: number
}

interface WatchedVideo extends BaseVideoData {
  watchedAt: string
}

type FavoriteVideo = BaseVideoData

interface FavoriteChannel {
  id: string
  channelId: string
  name: string
  thumbnail?: string
  logoUrl?: string
  hasCustomLogo?: boolean
  subscriberCount?: number
  isFollowed?: boolean
}

interface VideoNote extends BaseVideoData {
  note: string
  fontSize: number
  isArchived: boolean
}

interface SearchResults {
  items: Video[]
  error?: string
}

export default function MyTubeApp() {
  const { toast } = useToast()
  const { addError } = useApiError()
  
  // Core state
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSplashScreen, setShowSplashScreen] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // Data states
  const [watchedVideos, setWatchedVideos] = useState<WatchedVideo[]>([])
  const [favoriteChannels, setFavoriteChannels] = useState<FavoriteChannel[]>([])
  const [favoriteVideos, setFavoriteVideos] = useState<FavoriteVideo[]>([])
  const [recentVideosFromChannels, setRecentVideosFromChannels] = useState<Video[]>([])
  const [videoNotes, setVideoNotes] = useState<VideoNote[]>([])
  
  // Home page states
  const [homeViewMode, setHomeViewMode] = useState<'grid' | 'list'>('grid')
  const [contentFilter, setContentFilter] = useState<'all' | 'recent' | 'favorites' | 'trending'>('all')
  const [channelContent, setChannelContent] = useState<{ [key: string]: Video[] }>({})
  const [loadingChannelContent, setLoadingChannelContent] = useState<{ [key: string]: boolean }>({})
  
  // Dialog states
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [currentNote, setCurrentNote] = useState('')
  const [currentNoteVideo, setCurrentNoteVideo] = useState<Video | null>(null)
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null)
  const [noteFontSize, setNoteFontSize] = useState(16)

  // Toast functions
  const showToast = useCallback((title: string, description?: string, variant: 'success' | 'destructive' | 'info' = 'info') => {
    toast({
      title,
      description,
      variant,
    })
  }, [toast])

  // Safe timestamp function
  const getSafeTimestamp = useCallback((): string => {
    if (typeof window === 'undefined') {
      return new Date().toISOString()
    }
    try {
      return new Date().toISOString()
    } catch {
      return new Date().toISOString()
    }
  }, [])

  // Safe JSON parsing utility
  const safeJsonParse = async (response: Response): Promise<any> => {
    try {
      const text = await response.text()
      
      if (!text.trim()) {
        return {}
      }
      
      return JSON.parse(text)
    } catch (error: any) {
      console.error('JSON parsing error:', error)
      return {}
    }
  }

  // Simplified data loading functions with better error handling
  const loadWatchedVideos = async (): Promise<void> => {
    try {
      const response = await fetch('/api/watched', { 
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch watched videos`)
      const data = await safeJsonParse(response)
      setWatchedVideos(data || [])
    } catch (error: any) {
      console.error('Failed to load watched videos:', error)
      setWatchedVideos([])
    }
  }

  const loadRecentVideosFromChannels = async (): Promise<void> => {
    try {
      const response = await fetch('/api/channels/recent', { 
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (response.ok) {
        const data = await safeJsonParse(response)
        setRecentVideosFromChannels(data.videos || [])
      }
    } catch (error: any) {
      console.error('Failed to load recent videos from channels:', error)
      setRecentVideosFromChannels([])
    }
  }

  const loadFavoriteChannels = async (): Promise<void> => {
    try {
      const response = await fetch('/api/channels', { 
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch favorite channels`)
      const data = await safeJsonParse(response)
      setFavoriteChannels(data || [])
    } catch (error: any) {
      console.error('Failed to load favorite channels:', error)
      setFavoriteChannels([])
    }
  }

  const loadFavoriteVideos = async (): Promise<void> => {
    try {
      const response = await fetch('/api/favorites', { 
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch favorite videos`)
      const data = await safeJsonParse(response)
      setFavoriteVideos(data || [])
    } catch (error: any) {
      console.error('Failed to load favorite videos:', error)
      setFavoriteVideos([])
    }
  }

  const loadVideoNotes = async (): Promise<void> => {
    try {
      const response = await fetch('/api/notes', { 
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch video notes`)
      const data = await safeJsonParse(response)
      setVideoNotes((data || []).filter((note: VideoNote) => !note.isArchived))
    } catch (error: any) {
      console.error('Failed to load video notes:', error)
      setVideoNotes([])
    }
  }

  // Load content for specific channel
  const loadChannelContent = async (channelId: string, channelName: string): Promise<void> => {
    if (loadingChannelContent[channelId]) return
    
    setLoadingChannelContent(prev => ({ ...prev, [channelId]: true }))
    
    try {
      const response = await fetch(`/api/channels/${channelId}/content?limit=10`)
      if (response.ok) {
        const data = await response.json()
        setChannelContent(prev => ({ 
          ...prev, 
          [channelId]: data.videos || [] 
        }))
        
        showToast('Channel Content Loaded', `Found ${data.videos.length} videos from ${channelName}`, 'success')
      } else {
        throw new Error(`Failed to load channel content: ${response.status}`)
      }
    } catch (error) {
      console.error(`Failed to load content for channel ${channelName}:`, error)
      showToast('Failed to Load Content', `Could not load videos from ${channelName}`, 'destructive')
    } finally {
      setLoadingChannelContent(prev => ({ ...prev, [channelId]: false }))
    }
  }

  // Search videos
  const handleSearch = async (query: string, type: 'video' | 'channel' = 'video') => {
    if (!query.trim()) return
    
    setLoading(true)
    try {
      const results = await searchVideos(query, type)
      setSearchResults(results)
      
      if (results.error) {
        showToast('Search Error', results.error, 'destructive')
      } else {
        showToast('Search Complete', `Found ${results.items.length} results`, 'success')
      }
    } catch (error) {
      console.error('Search error:', error)
      showToast('Search Failed', 'An error occurred while searching', 'destructive')
    } finally {
      setLoading(false)
    }
  }

  // Mark video as watched
  const markAsWatched = async (video: Video) => {
    try {
      const response = await fetch('/api/watched', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video.id,
          title: video.title,
          channelName: video.channel?.name || 'Unknown Channel',
          thumbnail: video.thumbnail?.url || '',
          duration: video.duration,
          viewCount: video.viewCount,
          watchedAt: new Date().toISOString()
        })
      })
      
      if (response.ok) {
        await loadWatchedVideos()
        showToast('Marked as Watched', video.title, 'success')
      }
    } catch (error) {
      console.error('Failed to mark as watched:', error)
      showToast('Failed to Mark as Watched', 'Please try again', 'destructive')
    }
  }

  // Toggle favorite video
  const toggleFavoriteVideo = async (video: Video) => {
    try {
      const isFavorited = favoriteVideos.some(fav => fav.videoId === video.id)
      
      if (isFavorited) {
        await fetch(`/api/favorites/${video.id}`, { method: 'DELETE' })
        showToast('Removed from Favorites', video.title, 'info')
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: video.id,
            title: video.title,
            channelName: video.channel?.name || 'Unknown Channel',
            thumbnail: video.thumbnail?.url || '',
            duration: video.duration,
            viewCount: video.viewCount
          })
        })
        showToast('Added to Favorites', video.title, 'success')
      }
      
      await loadFavoriteVideos()
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      showToast('Failed to Update Favorites', 'Please try again', 'destructive')
    }
  }

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Load data sequentially to avoid resource exhaustion
        await loadWatchedVideos()
        await new Promise(resolve => setTimeout(resolve, 100))
        
        await loadFavoriteChannels()
        await new Promise(resolve => setTimeout(resolve, 100))
        
        await loadFavoriteVideos()
        await new Promise(resolve => setTimeout(resolve, 100))
        
        await loadVideoNotes()
        await new Promise(resolve => setTimeout(resolve, 100))
        
        await loadRecentVideosFromChannels()
        
      } catch (error) {
        console.error('Failed to initialize data:', error)
      } finally {
        // Hide splash screen after a delay
        setTimeout(() => {
          setShowSplashScreen(false)
        }, 1000)
      }
    }

    initializeData()
  }, [])

  // Filter content based on home filter
  const filteredContent = useMemo(() => {
    switch (contentFilter) {
      case 'recent':
        return recentVideosFromChannels
      case 'favorites':
        return favoriteVideos.map(fav => ({
          id: fav.videoId,
          title: fav.title,
          description: '',
          thumbnail: { url: fav.thumbnail, width: 320, height: 180 },
          duration: fav.duration,
          viewCount: fav.viewCount,
          publishedAt: '',
          channel: { name: fav.channelName, id: '' }
        } as Video))
      case 'trending':
        return [] // TODO: Implement trending
      default:
        return [...recentVideosFromChannels, ...favoriteVideos.map(fav => ({
          id: fav.videoId,
          title: fav.title,
          description: '',
          thumbnail: { url: fav.thumbnail, width: 320, height: 180 },
          duration: fav.duration,
          viewCount: fav.viewCount,
          publishedAt: '',
          channel: { name: fav.channelName, id: '' }
        } as Video))].slice(0, 20)
    }
  }, [contentFilter, recentVideosFromChannels, favoriteVideos])

  // Render video card
  const renderVideoCard = (video: Video, compact: boolean = false) => {
    const isWatched = watchedVideos.some(watched => watched.videoId === video.id)
    const isFavorited = favoriteVideos.some(fav => fav.videoId === video.id)
    const hasNotes = videoNotes.some(note => note.videoId === video.id)

    return (
      <Card key={video.id} className={`group hover:shadow-lg transition-all duration-200 ${compact ? 'p-3' : 'p-4'}`}>
        <div className={`${compact ? 'flex gap-3' : 'space-y-3'}`}>
          <div className={`${compact ? 'w-32 h-20' : 'w-full h-40'} relative overflow-hidden rounded-lg`}>
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
          
          <div className={`${compact ? 'flex-1' : 'space-y-2'}`}>
            <h3 className={`${compact ? 'text-sm font-medium line-clamp-2' : 'font-medium line-clamp-2'}`}>
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
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => markAsWatched(video)}
                disabled={isWatched}
                className="text-xs"
              >
                {isWatched ? (
                  <><Check className="w-3 h-3 mr-1" /> Watched</>
                ) : (
                  <><Eye className="w-3 h-3 mr-1" /> Mark Watched</>
                )}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleFavoriteVideo(video)}
                className="text-xs"
              >
                {isFavorited ? (
                  <><Heart className="w-3 h-3 mr-1 fill-red-500 text-red-500" /> Favorited</>
                ) : (
                  <><Heart className="w-3 h-3 mr-1" /> Favorite</>
                )}
              </Button>
              
              {hasNotes && (
                <Badge variant="secondary" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" />
                  Notes
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Render channel card
  const renderChannelCard = (channel: FavoriteChannel) => {
    const hasContent = channelContent[channel.channelId] && channelContent[channel.channelId].length > 0
    const isLoading = loadingChannelContent[channel.channelId]

    return (
      <Card key={channel.id} className="group hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
              <img
                src={channel.logoUrl || channel.thumbnail || '/placeholder-channel.png'}
                alt={channel.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-channel.png'
                }}
              />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{channel.name}</h3>
              {channel.subscriberCount && (
                <p className="text-sm text-muted-foreground">
                  {formatViewCount(channel.subscriberCount)} subscribers
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadChannelContent(channel.channelId, channel.name)}
              disabled={isLoading}
              className="text-xs"
            >
              {isLoading ? (
                <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Loading...</>
              ) : hasContent ? (
                <><Eye className="w-3 h-3 mr-1" /> View Content</>
              ) : (
                <><Search className="w-3 h-3 mr-1" /> Browse</>
              )}
            </Button>
          </div>
        </CardHeader>
        
        {hasContent && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Recent Videos</span>
                <Badge variant="secondary" className="text-xs">
                  {channelContent[channel.channelId].length} videos
                </Badge>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {channelContent[channel.channelId].slice(0, 3).map(video => 
                  renderVideoCard(video, true)
                )}
              </div>
              {channelContent[channel.channelId].length > 3 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full text-xs"
                  onClick={() => handleSearch(channel.name)}
                >
                  <Search className="w-3 h-3 mr-1" />
                  Browse All Videos
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  // Show splash screen
  if (showSplashScreen) {
    return <SplashScreen />
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background flex">
        {/* Navigation Sidebar - Desktop */}
        <div className="hidden md:block">
          <NavigationSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            watchedVideosCount={watchedVideos.length}
            favoriteVideosCount={favoriteVideos.length}
            favoriteChannelsCount={favoriteChannels.length}
            videoNotesCount={videoNotes.length}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-card">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold text-primary">MyTube</h1>
                  <p className="text-muted-foreground hidden sm:block">YouTube Video Manager</p>
                </div>
                
                {/* Mobile Navigation */}
                <div className="md:hidden">
                  <Button
                    variant={activeTab === 'search' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('search')}
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 container mx-auto px-4 py-6 pb-20 md:pb-6">
            {/* Home Tab */}
            {activeTab === 'home' && (
              <div className="space-y-6">
                {/* Welcome Header */}
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold">Welcome to MyTube</h2>
                  <p className="text-muted-foreground">
                    Discover content from your favorite channels and manage your YouTube experience
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="text-center p-4">
                    <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold">{favoriteChannels.length}</div>
                    <div className="text-sm text-muted-foreground">Followed Channels</div>
                  </Card>
                  <Card className="text-center p-4">
                    <Heart className="w-8 h-8 mx-auto mb-2 text-red-600" />
                    <div className="text-2xl font-bold">{favoriteVideos.length}</div>
                    <div className="text-sm text-muted-foreground">Favorite Videos</div>
                  </Card>
                  <Card className="text-center p-4">
                    <Eye className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold">{watchedVideos.length}</div>
                    <div className="text-sm text-muted-foreground">Videos Watched</div>
                  </Card>
                  <Card className="text-center p-4">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold">{videoNotes.length}</div>
                    <div className="text-sm text-muted-foreground">Video Notes</div>
                  </Card>
                </div>

                {/* Content Filter */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <span className="font-medium">Filter:</span>
                    <Select value={contentFilter} onValueChange={(value: any) => setContentFilter(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Content</SelectItem>
                        <SelectItem value="recent">Recent Videos</SelectItem>
                        <SelectItem value="favorites">Favorites</SelectItem>
                        <SelectItem value="trending">Trending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={homeViewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setHomeViewMode('grid')}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={homeViewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setHomeViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Recent Videos from Channels */}
                {recentVideosFromChannels.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-orange-600" />
                      <h3 className="text-xl font-semibold">Fresh from Your Channels</h3>
                      <Badge variant="secondary">{recentVideosFromChannels.length}</Badge>
                    </div>
                    <div className={homeViewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                      {recentVideosFromChannels.slice(0, 6).map(video => renderVideoCard(video))}
                    </div>
                  </div>
                )}

                {/* Favorite Videos */}
                {favoriteVideos.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-600" />
                      <h3 className="text-xl font-semibold">Your Favorite Videos</h3>
                      <Badge variant="secondary">{favoriteVideos.length}</Badge>
                    </div>
                    <div className={homeViewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                      {favoriteVideos.slice(0, 6).map(fav => renderVideoCard({
                        id: fav.videoId,
                        title: fav.title,
                        description: '',
                        thumbnail: { url: fav.thumbnail, width: 320, height: 180 },
                        duration: fav.duration,
                        viewCount: fav.viewCount,
                        publishedAt: '',
                        channel: { name: fav.channelName, id: '' }
                      } as Video))}
                    </div>
                  </div>
                )}

                {/* Followed Channels */}
                {favoriteChannels.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <h3 className="text-xl font-semibold">Followed Channels</h3>
                      <Badge variant="secondary">{favoriteChannels.length}</Badge>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {favoriteChannels.slice(0, 6).map(channel => renderChannelCard(channel))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {filteredContent.length === 0 && favoriteChannels.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No Content Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by searching for channels and videos to follow
                    </p>
                    <Button onClick={() => setActiveTab('search')}>
                      <Search className="w-4 h-4 mr-2" />
                      Start Exploring
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && (
              <SearchPage
                onVideoSelect={setSelectedVideo}
                onMarkAsWatched={markAsWatched}
                onToggleFavorite={toggleFavoriteVideo}
                watchedVideos={watchedVideos}
                favoriteVideos={favoriteVideos}
                videoNotes={videoNotes}
              />
            )}

            {/* Other tabs (placeholder) */}
            {activeTab !== 'home' && activeTab !== 'search' && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🚧</div>
                <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
                <p className="text-muted-foreground">
                  This section is under development. Check back soon!
                </p>
              </div>
            )}
          </main>

          {/* Bottom Navigation - Mobile */}
          <BottomNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            watchedVideosCount={watchedVideos.length}
            favoriteVideosCount={favoriteVideos.length}
            favoriteChannelsCount={favoriteChannels.length}
            videoNotesCount={videoNotes.length}
          />
        </div>

        {/* Toast Container */}
        <Toaster />
      </div>
    </ErrorBoundary>
  )
}