'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Menu, 
  Search, 
  Home as HomeIcon, 
  TrendingUp, 
  Music, 
  Gamepad2, 
  Newspaper, 
  Trophy, 
  Film, 
  BookOpen, 
  Cpu, 
  Clock, 
  Bookmark, 
  Download, 
  List, 
  Settings, 
  Moon,
  Sun,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  Heart,
  User,
  History as HistoryIcon
} from 'lucide-react'
import { EnhancedSearch } from '@/components/enhanced-search'
import { Pagination } from '@/components/pagination'
import { SearchResultsHeader } from '@/components/search-results-header'
import { SearchAnalytics } from '@/components/search-analytics'
import { ToastNotifications, useToast } from '@/components/toast-notifications'
import { VideoPlayer } from '@/components/video-player'
import { VideoCard } from '@/components/video-card'
import { Sidebar } from '@/components/sidebar'
import { LightPlayer } from '@/components/light-player'
import { ResponsivePlayer } from '@/components/responsive-player'
import { EnhancedVideoPlayer } from '@/components/enhanced-video-player'
import { LoadingOverlay, InlineLoading, VideoCardSkeleton } from '@/components/loading-overlay'
import { useNewPipeStore } from '@/lib/store'

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

interface SearchFilters {
  duration: string
  uploadDate: string
  sortBy: string
  videoType: string
}

interface PaginationData {
  currentPage: number
  totalPages: number
  totalResults: number
}

export default function Home() {
  const { theme, setTheme } = useTheme()
  const { toasts, removeToast, showSuccess, showError, showInfo, showWarning } = useToast()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [videos, setVideos] = useState<Video[]>([
    {
      id: 'mock1',
      title: 'Welcome to NewPipe - Tutorial Video 1',
      channel: 'NewPipe Team',
      thumbnail: 'https://via.placeholder.com/320x180/4a5568/ffffff?text=Welcome+to+NewPipe',
      duration: '10:30',
      views: '1.2K',
      published: '2 days ago',
      url: 'https://www.youtube.com/watch?v=mock1',
      embedUrl: 'https://www.youtube.com/embed/mock1'
    },
    {
      id: 'mock2',
      title: 'Getting Started with NewPipe - Tutorial Video 2',
      channel: 'NewPipe Academy',
      thumbnail: 'https://via.placeholder.com/320x180/4a5568/ffffff?text=Getting+Started',
      duration: '15:45',
      views: '3.4K',
      published: '1 week ago',
      url: 'https://www.youtube.com/watch?v=mock2',
      embedUrl: 'https://www.youtube.com/embed/mock2'
    },
    {
      id: 'mock3',
      title: 'NewPipe Advanced Features - Tutorial Video 3',
      channel: 'NewPipe Experts',
      thumbnail: 'https://via.placeholder.com/320x180/4a5568/ffffff?text=Advanced+Features',
      duration: '25:12',
      views: '8.7K',
      published: '3 days ago',
      url: 'https://www.youtube.com/watch?v=mock3',
      embedUrl: 'https://www.youtube.com/embed/mock3'
    },
    {
      id: 'mock4',
      title: 'NewPipe vs YouTube - Comparison Guide',
      channel: 'Tech Reviews',
      thumbnail: 'https://via.placeholder.com/320x180/4a5568/ffffff?text=Comparison+Guide',
      duration: '8:15',
      views: '2.1K',
      published: '5 days ago',
      url: 'https://www.youtube.com/watch?v=mock4',
      embedUrl: 'https://www.youtube.com/embed/mock4'
    }
  ])
  const [loading, setLoading] = useState(false)
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null)
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)
  const [isMiniPlayer, setIsMiniPlayer] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentView, setCurrentView] = useState<'videos' | 'history' | 'bookmarks' | 'downloads' | 'playlists'>('videos')
  
  // Enhanced search state
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    duration: 'any',
    uploadDate: 'any',
    sortBy: 'relevance',
    videoType: 'any'
  })
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalResults: 4
  })
  const [searchTime, setSearchTime] = useState(0)

  const {
    history,
    bookmarks,
    downloads,
    playlists,
    addToHistory,
    addBookmark,
    removeBookmark,
    isBookmarked,
    isDownloaded,
    subscribe,
    unsubscribe,
    isSubscribed
  } = useNewPipeStore()

  const categories = [
    'All', 'Trending', 'Music', 'Gaming', 'News', 'Sports', 'Entertainment', 'Education', 'Tech'
  ]

  // Initialize with mock data to ensure something is always displayed
  useEffect(() => {
    console.log('Initializing with mock data')
    const mockVideos: Video[] = [
      {
        id: 'mock1',
        title: 'Welcome to NewPipe - Tutorial Video 1',
        channel: 'NewPipe Team',
        thumbnail: 'https://via.placeholder.com/320x180/4a5568/ffffff?text=Welcome+to+NewPipe',
        duration: '10:30',
        views: '1.2K',
        published: '2 days ago',
        url: 'https://www.youtube.com/watch?v=mock1',
        embedUrl: 'https://www.youtube.com/embed/mock1'
      },
      {
        id: 'mock2',
        title: 'Getting Started with NewPipe - Tutorial Video 2',
        channel: 'NewPipe Academy',
        thumbnail: 'https://via.placeholder.com/320x180/4a5568/ffffff?text=Getting+Started',
        duration: '15:45',
        views: '3.4K',
        published: '1 week ago',
        url: 'https://www.youtube.com/watch?v=mock2',
        embedUrl: 'https://www.youtube.com/embed/mock2'
      },
      {
        id: 'mock3',
        title: 'NewPipe Advanced Features - Tutorial Video 3',
        channel: 'NewPipe Experts',
        thumbnail: 'https://via.placeholder.com/320x180/4a5568/ffffff?text=Advanced+Features',
        duration: '25:12',
        views: '8.7K',
        published: '3 days ago',
        url: 'https://www.youtube.com/watch?v=mock3',
        embedUrl: 'https://www.youtube.com/embed/mock3'
      },
      {
        id: 'mock4',
        title: 'NewPipe vs YouTube - Comparison Guide',
        channel: 'Tech Reviews',
        thumbnail: 'https://via.placeholder.com/320x180/4a5568/ffffff?text=Comparison+Guide',
        duration: '8:15',
        views: '2.1K',
        published: '5 days ago',
        url: 'https://www.youtube.com/watch?v=mock4',
        embedUrl: 'https://www.youtube.com/embed/mock4'
      }
    ]
    
    setVideos(mockVideos)
    setPagination({
      currentPage: 1,
      totalPages: 1,
      totalResults: mockVideos.length
    })
    
    // Then try to fetch real data
    fetchVideos(1)
  }, [])

  const fetchVideos = async (page: number = 1, newFilters?: SearchFilters) => {
    console.log('fetchVideos called with:', { page, selectedCategory, searchQuery, newFilters })
    setLoading(true)
    const startTime = Date.now()
    
    try {
      const filters = newFilters || searchFilters
      const params = new URLSearchParams({
        category: selectedCategory,
        q: searchQuery,
        duration: filters.duration,
        uploadDate: filters.uploadDate,
        sortBy: filters.sortBy,
        videoType: filters.videoType,
        page: page.toString()
      })
      
      console.log('Fetching from API:', `/api/newpipe?${params}`)
      const response = await fetch(`/api/newpipe?${params}`)
      const data = await response.json()
      
      console.log('API response:', data)
      
      setVideos(data.videos || [])
      setPagination(data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalResults: data.videos?.length || 0
      })
      
      // Calculate search time
      const endTime = Date.now()
      const timeTaken = (endTime - startTime) / 1000
      setSearchTime(timeTaken)
      
      // Show toast notifications based on results
      if (data.videos && data.videos.length === 0) {
        if (searchQuery) {
          showWarning('No results found', `No videos found matching "${searchQuery}" with your current filters.`)
        } else {
          showInfo('No videos available', 'No videos found in this category. YouTube may be using JavaScript to load content dynamically.')
        }
      } else if (data.videos && data.videos.length > 0) {
        showSuccess('Search completed', `Found ${data.videos.length} videos in ${timeTaken.toFixed(2)}s`)
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
      showError('Search failed', 'Unable to fetch videos from YouTube. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string, filters: SearchFilters) => {
    setSearchQuery(query)
    setSearchFilters(filters)
    setPagination(prev => ({ ...prev, currentPage: 1 }))
    fetchVideos(1, filters)
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }))
    fetchVideos(page)
  }

  const handleClearFilters = () => {
    const defaultFilters: SearchFilters = {
      duration: 'any',
      uploadDate: 'any',
      sortBy: 'relevance',
      videoType: 'any'
    }
    setSearchFilters(defaultFilters)
    fetchVideos(1, defaultFilters)
  }

  useEffect(() => {
    console.log('useEffect triggered - fetching videos for category:', selectedCategory)
    // Only fetch if we have a valid category
    if (selectedCategory) {
      fetchVideos(1)
    }
  }, [selectedCategory])

  // Also fetch on initial mount
  useEffect(() => {
    console.log('Initial mount - fetching videos')
    fetchVideos(1)
  }, [])

  const handleVideoClick = (video: Video) => {
    setCurrentVideo(video)
    setIsPlayerOpen(true)
    setIsMiniPlayer(false)
    setIsPlaying(true)
    addToHistory(video)
  }

  const handleBookmark = (video: Video) => {
    if (isBookmarked(video.id)) {
      removeBookmark(video.id)
    } else {
      addBookmark(video)
    }
  }

  const handleSubscribe = (channelName: string) => {
    if (isSubscribed(channelName)) {
      unsubscribe(channelName)
    } else {
      subscribe(channelName)
    }
  }

  const toggleTheme = () => {
    if (theme) {
      setTheme(theme === 'light' ? 'dark' : 'light')
    }
  }

  const toggleMiniPlayer = () => {
    setIsMiniPlayer(!isMiniPlayer)
  }

  const closePlayer = () => {
    setIsPlayerOpen(false)
    setIsMiniPlayer(false)
    setCurrentVideo(null)
    setIsPlaying(false)
  }

  const getCurrentVideos = () => {
    switch (currentView) {
      case 'history':
        return history
      case 'bookmarks':
        return bookmarks
      case 'downloads':
        return downloads
      case 'playlists':
        return playlists.flatMap(p => p.videos)
      default:
        return videos
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Loading Overlay */}
      <LoadingOverlay 
        isLoading={loading}
        message={searchQuery ? `Searching for "${searchQuery}"...` : undefined}
      />
      
      {/* Toast Notifications */}
      <ToastNotifications toasts={toasts} onRemove={removeToast} />
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[400px]">
              <Sidebar 
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                currentView={currentView}
                setCurrentView={setCurrentView}
              />
            </SheetContent>
          </Sheet>

          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">NewPipe</h1>
          </div>

          <div className="flex flex-1 items-center space-x-2 justify-center px-2">
            <div className="w-full max-w-sm">
              <EnhancedSearch 
                onSearch={handleSearch}
                initialQuery={searchQuery}
                isLoading={loading}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="theme-toggle">
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:block w-64 border-r bg-background">
          <Sidebar 
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            currentView={currentView}
            setCurrentView={setCurrentView}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {currentView === 'videos' ? (
            <>
              {/* Search Results Header */}
              <SearchResultsHeader
                searchQuery={searchQuery}
                totalResults={pagination.totalResults}
                filters={searchFilters}
                onClearFilters={handleClearFilters}
                className="mb-6"
              />

              {/* Two-column layout for search results and analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main video grid - 3/4 width on large screens */}
                <div className="lg:col-span-3">
                  {/* Video Grid */}
                  {loading && videos.length === 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      <VideoCardSkeleton count={12} />
                    </div>
                  ) : videos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <div className="text-6xl">📺</div>
                        <h3 className="text-xl font-semibold">No videos found</h3>
                        <p className="text-muted-foreground max-w-md">
                          {searchQuery 
                            ? `No videos found matching "${searchQuery}" with your current filters. Try adjusting your search term or filters.`
                            : 'No videos found. YouTube may be using JavaScript to load content dynamically, or there might be no videos in this category.'
                          }
                        </p>
                        <Button onClick={() => fetchVideos(1)} variant="outline">
                          Try Again
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {videos.map((video) => (
                          <VideoCard
                            key={video.id}
                            video={video}
                            onClick={() => handleVideoClick(video)}
                            onBookmark={() => handleBookmark(video)}
                            onSubscribe={() => handleSubscribe(video.channel)}
                            isBookmarked={isBookmarked(video.id)}
                            isDownloaded={isDownloaded(video.id)}
                            isSubscribed={isSubscribed(video.channel)}
                          />
                        ))}
                      </div>

                      {/* Pagination */}
                      <Pagination
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        totalResults={pagination.totalResults}
                        onPageChange={handlePageChange}
                        className="mt-6"
                      />
                    </>
                  )}
                </div>

                {/* Analytics sidebar - 1/4 width on large screens */}
                <div className="lg:col-span-1">
                  <div className="sticky top-6">
                    <SearchAnalytics
                      searchQuery={searchQuery}
                      totalResults={pagination.totalResults}
                      searchTime={searchTime}
                      filters={searchFilters}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Other Views (History, Bookmarks, etc.) */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold capitalize">
                    {currentView === 'history' ? 'Watch History' :
                     currentView === 'bookmarks' ? 'Bookmarks' :
                     currentView === 'downloads' ? 'Downloads' :
                     currentView === 'playlists' ? 'Playlists' :
                     selectedCategory}
                  </h2>
                  <Badge variant="secondary">{getCurrentVideos().length} videos</Badge>
                </div>
                <Separator />
              </div>

              {/* Video Grid for other views */}
              {getCurrentVideos().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <div className="text-6xl">📺</div>
                    <h3 className="text-xl font-semibold">No videos found</h3>
                    <p className="text-muted-foreground max-w-md">
                      {currentView === 'history' ? 'Your watch history is empty. Start watching videos to see them here.' :
                       currentView === 'bookmarks' ? 'You haven\'t bookmarked any videos yet. Click the bookmark icon on videos you like.' :
                       currentView === 'downloads' ? 'You haven\'t downloaded any videos yet.' :
                       currentView === 'playlists' ? 'You haven\'t created any playlists yet.' :
                       'No videos found.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {getCurrentVideos().map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onClick={() => handleVideoClick(video)}
                      onBookmark={() => handleBookmark(video)}
                      onSubscribe={() => handleSubscribe(video.channel)}
                      isBookmarked={isBookmarked(video.id)}
                      isDownloaded={isDownloaded(video.id)}
                      isSubscribed={isSubscribed(video.channel)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Video Player Modal */}
      {isPlayerOpen && currentVideo && (
        <VideoPlayer
          video={currentVideo}
          isOpen={isPlayerOpen}
          isMiniPlayer={isMiniPlayer}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onToggleMiniPlayer={toggleMiniPlayer}
          onClose={closePlayer}
          onPlayingStateChange={setIsPlaying}
          onBookmark={() => handleBookmark(currentVideo)}
          onSubscribe={() => handleSubscribe(currentVideo.channel)}
          isBookmarked={isBookmarked(currentVideo.id)}
          isSubscribed={isSubscribed(currentVideo.channel)}
        />
      )}
    </div>
  )
}