'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Search, Video, Music, Radio, Clock, Heart, Plus, X, Menu, Moon, Sun, Bell, User, Home, TrendingUp, PlayCircle, History, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'
import { useTheme } from 'next-themes'
import VideoCard from '@/components/video/VideoCard'
import FavoritesContainer from '@/components/favorites/FavoritesContainer'
import NotesContainer from '@/components/notes/NotesContainer'
import WatchedHistoryContainer from '@/components/watched/WatchedHistoryContainer'
import { useBackgroundPlayer } from '@/contexts/background-player-context'
import { useFavorites } from '@/hooks/useFavorites'
import { useNotes } from '@/hooks/useNotes'
import { useWatchedHistory } from '@/hooks/useWatchedHistory'
import { searchVideos, getVideoDetails, getPopularVideos, getTrendingVideos, getMusicVideos, getLiveVideos } from '@/lib/youtube'
import { Video as VideoType, SearchResultItem } from '@/types/youtube'
import MiniPlayer from '@/components/mini-player'
import BottomNavigation from '@/components/navigation/BottomNavigation'
import NavigationSpacer from '@/components/navigation/NavigationSpacer'

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([])
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null)
  const [activeTab, setActiveTab] = useState('home')
  const [isLoading, setIsLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [paginationToken, setPaginationToken] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const { currentVideo, isPlaying, playVideo, pauseVideo, currentTime, duration } = useBackgroundPlayer()
  const { addFavorite, removeFavorite, isFavorited } = useFavorites()
  const { addNote, updateNote, deleteNote, getNotesForVideo } = useNotes()
  const { addToHistory, getHistory } = useWatchedHistory()

  const videosPerPage = 20

  const loadVideos = useCallback(async (tab: string, pageToken?: string) => {
    setIsLoading(true)
    try {
      let result
      switch (tab) {
        case 'trending':
          result = await getTrendingVideos(pageToken)
          break
        case 'music':
          result = await getMusicVideos(pageToken)
          break
        case 'live':
          result = await getLiveVideos(pageToken)
          break
        case 'home':
        default:
          result = await getPopularVideos(pageToken)
          break
      }
      
      if (pageToken) {
        setSearchResults(prev => [...prev, ...result.items])
      } else {
        setSearchResults(result.items)
      }
      
      setPaginationToken(result.nextPageToken || null)
      setHasMore(!!result.nextPageToken)
    } catch (error) {
      console.error('Error loading videos:', error)
      toast({
        title: 'Error',
        description: 'Failed to load videos',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadVideos(activeTab)
  }, [activeTab, loadVideos])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsLoading(true)
    try {
      const results = await searchVideos(searchQuery)
      setSearchResults(results.items)
      setPaginationToken(results.nextPageToken || null)
      setHasMore(!!results.nextPageToken)
      setCurrentPage(1)
      setActiveTab('search')
    } catch (error) {
      console.error('Error searching videos:', error)
      toast({
        title: 'Error',
        description: 'Failed to search videos',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVideoSelect = async (video: SearchResultItem) => {
    try {
      const videoDetails = await getVideoDetails(video.id.videoId)
      setSelectedVideo(videoDetails)
      playVideo(videoDetails)
      addToHistory(videoDetails)
    } catch (error) {
      console.error('Error fetching video details:', error)
      toast({
        title: 'Error',
        description: 'Failed to load video details',
        variant: 'destructive'
      })
    }
  }

  const handleFavoriteToggle = async (video: SearchResultItem) => {
    const videoDetails = selectedVideo || {
      id: video.id.videoId,
      snippet: {
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnails: {
          default: { url: video.snippet.thumbnails.default.url },
          medium: { url: video.snippet.thumbnails.medium.url },
          high: { url: video.snippet.thumbnails.high.url }
        },
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt
      },
      statistics: {
        viewCount: '0',
        likeCount: '0',
        commentCount: '0'
      }
    }

    try {
      if (isFavorited(video.id.videoId)) {
        await removeFavorite(video.id.videoId)
        toast({
          title: 'Removed from favorites',
          description: video.snippet.title
        })
      } else {
        await addFavorite(videoDetails)
        toast({
          title: 'Added to favorites',
          description: video.snippet.title
        })
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast({
        title: 'Error',
        description: 'Failed to update favorites',
        variant: 'destructive'
      })
    }
  }

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      if (activeTab === 'search' && searchQuery) {
        loadMoreSearchResults()
      } else {
        loadVideos(activeTab, paginationToken)
      }
    }
  }

  const loadMoreSearchResults = async () => {
    if (!searchQuery.trim() || !hasMore || isLoading) return

    setIsLoading(true)
    try {
      const results = await searchVideos(searchQuery, paginationToken)
      setSearchResults(prev => [...prev, ...results.items])
      setPaginationToken(results.nextPageToken || null)
      setHasMore(!!results.nextPageToken)
    } catch (error) {
      console.error('Error loading more search results:', error)
      toast({
        title: 'Error',
        description: 'Failed to load more results',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const goToPage = (page: number) => {
    const startIndex = (page - 1) * videosPerPage
    if (startIndex < searchResults.length) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    const totalPages = Math.ceil(searchResults.length / videosPerPage)
    if (currentPage < totalPages) {
      goToPage(currentPage + 1)
    }
  }

  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * videosPerPage
    const endIndex = startIndex + videosPerPage
    return searchResults.slice(startIndex, endIndex)
  }, [searchResults, currentPage])

  const totalPages = useMemo(() => {
    return Math.ceil(searchResults.length / videosPerPage)
  }, [searchResults.length])

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'live', label: 'Live', icon: Radio },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'notes', label: 'Notes', icon: Plus },
    { id: 'history', label: 'History', icon: Clock }
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <div className="mr-6 flex items-center space-x-2">
              <Video className="h-6 w-6" />
              <span className="hidden font-bold sm:inline-block">VideoHub</span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>

          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <form onSubmit={handleSearch} className="w-full flex-1 md:w-auto md:flex-none">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 md:w-[300px] lg:w-[400px]"
                />
              </div>
            </form>
            
            <nav className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
              
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
            {navigationItems.slice(0, 7).map((item) => (
              <TabsTrigger key={item.id} value={item.id} className="flex items-center gap-2">
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedResults.map((video) => (
                <VideoCard
                  key={video.id.videoId}
                  video={video}
                  onVideoSelect={handleVideoSelect}
                  onFavoriteToggle={handleFavoriteToggle}
                  isFavorited={isFavorited(video.id.videoId)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedResults.map((video) => (
                <VideoCard
                  key={video.id.videoId}
                  video={video}
                  onVideoSelect={handleVideoSelect}
                  onFavoriteToggle={handleFavoriteToggle}
                  isFavorited={isFavorited(video.id.videoId)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="music" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedResults.map((video) => (
                <VideoCard
                  key={video.id.videoId}
                  video={video}
                  onVideoSelect={handleVideoSelect}
                  onFavoriteToggle={handleFavoriteToggle}
                  isFavorited={isFavorited(video.id.videoId)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="live" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedResults.map((video) => (
                <VideoCard
                  key={video.id.videoId}
                  video={video}
                  onVideoSelect={handleVideoSelect}
                  onFavoriteToggle={handleFavoriteToggle}
                  isFavorited={isFavorited(video.id.videoId)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedResults.map((video) => (
                <VideoCard
                  key={video.id.videoId}
                  video={video}
                  onVideoSelect={handleVideoSelect}
                  onFavoriteToggle={handleFavoriteToggle}
                  isFavorited={isFavorited(video.id.videoId)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="space-y-6">
            <FavoritesContainer />
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <NotesContainer />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <WatchedHistoryContainer />
          </TabsContent>
        </Tabs>

        {searchResults.length > videosPerPage && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={handleLoadMore}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>

      <NavigationSpacer />
      <BottomNavigation 
        items={navigationItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      {currentVideo && (
        <MiniPlayer
          video={currentVideo}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onPlay={pauseVideo}
          onPause={pauseVideo}
        />
      )}
      
      <Toaster />
    </div>
  )
}