'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, Clock, Eye, Calendar, RefreshCw, AlertCircle, Keyboard, Heart } from 'lucide-react'
import LiteYouTubeEmbed from 'react-lite-youtube-embed'
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css'
import { VideoListSkeleton } from '@/components/video-card-skeleton'
import { ThemeToggle } from '@/components/theme-toggle'
import { usePreferences } from '@/hooks/use-preferences'
import { FavoriteButton } from '@/components/favorite-button'

interface Video {
  id: string
  title: string
  thumbnail: string
  channelName: string
  channelLogo?: string
  publishedAt: string
  duration?: string
  viewCount?: string
  description?: string
}

interface Channel {
  id: string
  name: string
  url: string
  logo?: string
  banner?: string
  subscriberCount?: string
  videoCount?: string
  videos: Video[]
}

interface PaginationData {
  currentPage: number
  totalPages: number
  totalVideos: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface ApiResponse {
  videos: Video[]
  pagination: PaginationData
}

const CHANNELS = [
  {
    id: 'twjehdm',
    name: 'قناة توحيد',
    url: 'https://youtube.com/@twjehdm?si=lGJSUqw1_M6T1d5z'
  },
  {
    id: 'wmngovksa',
    name: 'قناة وزارة التعليم',
    url: 'https://youtube.com/@wmngovksa?si=Wjm404d8mRvb40yx'
  },
  {
    id: 'othmanalkamees',
    name: 'قناة عثمان الكميس',
    url: 'https://youtube.com/@othmanalkamees?si=uTV5BKqPz4E_oPb5'
  },
  {
    id: 'alhewenytube',
    name: 'قناة الحوين',
    url: 'https://www.youtube.com/channel/UC43bHWI3eZwfxOONWdQBi-w'
  }
]

type TimeFilter = 'all' | 'today' | 'week' | 'month' | 'year'

const VIDEOS_PER_PAGE = 24

export default function Home() {
  const router = useRouter()
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [activeChannel, setActiveChannel] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchMode, setSearchMode] = useState(false)
  const [switchingChannel, setSwitchingChannel] = useState(false)
  const [selectingVideo, setSelectingVideo] = useState(false)
  
  // Preferences hook
  const { preferences, updatePreference, isLoading: prefsLoading } = usePreferences()
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
        }
      }

      // Ctrl/Cmd + F to open favorites
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        router.push('/favorites')
      }

      // Ctrl/Cmd + R to refresh
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault()
        refreshData()
      }

      // Arrow key navigation for videos
      if (filteredVideos.length > 0) {
        const currentIndex = selectedVideo 
          ? filteredVideos.findIndex(v => v.id === selectedVideo.id)
          : -1

        switch (e.key) {
          case 'ArrowRight':
            e.preventDefault()
            if (currentIndex < filteredVideos.length - 1) {
              setSelectedVideo(filteredVideos[currentIndex + 1])
            }
            break
          case 'ArrowLeft':
            e.preventDefault()
            if (currentIndex > 0) {
              setSelectedVideo(filteredVideos[currentIndex - 1])
            }
            break
          case 'ArrowDown':
            e.preventDefault()
            if (currentIndex < filteredVideos.length - 4) {
              setSelectedVideo(filteredVideos[currentIndex + 4])
            }
            break
          case 'ArrowUp':
            e.preventDefault()
            if (currentIndex > 3) {
              setSelectedVideo(filteredVideos[currentIndex - 4])
            }
            break
          case 'Enter':
            if (selectedVideo) {
              e.preventDefault()
              router.push(`/video/${selectedVideo.id}`)
            }
            break
        }
      }

      // Number keys to switch channels (1-4)
      if (e.key >= '1' && e.key <= '4' && channels.length >= parseInt(e.key)) {
        const channelIndex = parseInt(e.key) - 1
        if (channels[channelIndex]) {
          e.preventDefault()
          handleChannelChange(channels[channelIndex].id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredVideos, selectedVideo, channels, router])
  
  // Function definitions moved here to avoid initialization issues
  const refreshData = async () => {
    setRefreshing(true)
    setApiError(null)
    setCurrentPage(1)
    setHasMore(true)
    setAllVideos([])
    
    // Refetch initial data
    try {
      const channelsData: Channel[] = []
      let hasData = false
      
      for (const channel of CHANNELS) {
        try {
          const response = await fetch(`/api/youtube/channel/${channel.id}?page=1&limit=${VIDEOS_PER_PAGE}`)
          if (response.ok) {
            const data: ApiResponse & { channel?: any } = await response.json()
            if (data.videos.length > 0) {
              hasData = true
              const channelInfo = data.channel || {}
              channelsData.push({
                ...channel,
                name: channelInfo.name || channel.name,
                logo: channelInfo.logo,
                banner: channelInfo.banner,
                subscriberCount: channelInfo.subscriberCount,
                videoCount: channelInfo.videoCount,
                videos: data.videos.map((video: any) => ({
                  ...video,
                  duration: video.duration || '',
                  viewCount: video.viewCount || '',
                  channelLogo: video.channelLogo || channelInfo.logo
                }))
              })
            } else {
              channelsData.push({
                ...channel,
                videos: []
              })
            }
          } else {
            channelsData.push({
              ...channel,
              videos: []
            })
          }
        } catch (error) {
          console.error(`Error fetching data for channel ${channel.id}:`, error)
          channelsData.push({
            ...channel,
            videos: []
          })
        }
      }
      
      setChannels(channelsData)
      
      if (!hasData) {
        setApiError('لا يمكن جلب البيانات من اليوتيوب حالياً. يرجى المحاولة مرة أخرى لاحقاً.')
      }
      
      const firstChannelWithVideos = channelsData.find(c => c.videos.length > 0)
      if (firstChannelWithVideos) {
        setActiveChannel(firstChannelWithVideos.id)
        setSelectedVideo(firstChannelWithVideos.videos[0])
        setAllVideos(firstChannelWithVideos.videos)
        setHasMore(firstChannelWithVideos.videos.length >= VIDEOS_PER_PAGE)
      }
    } catch (error) {
      console.error('Error refreshing data:', error)
      setApiError('حدث خطأ في جلب البيانات. يرجى المحاولة مرة أخرى.')
    } finally {
      setRefreshing(false)
    }
  }

  const handleChannelChange = async (channelId: string) => {
    setSwitchingChannel(true)
    setActiveChannel(channelId)
    setCurrentPage(1)
    setHasMore(true)
    setAllVideos([])
    setSearchMode(false)
    setSearchQuery('')
    
    // Save to preferences
    updatePreference('lastWatchedChannel', channelId)
    
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const channel = channels.find(c => c.id === channelId)
    if (channel && channel.videos.length > 0) {
      setAllVideos(channel.videos)
      setSelectedVideo(channel.videos[0])
      setHasMore(channel.videos.length >= VIDEOS_PER_PAGE)
    }
    
    setSwitchingChannel(false)
  }

  const handleVideoSelect = async (video: Video) => {
    if (selectingVideo) return
    
    setSelectingVideo(true)
    
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 200))
    
    setSelectedVideo(video)
    setSelectingVideo(false)
  }
  
  // Infinite scroll states
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [allVideos, setAllVideos] = useState<Video[]>([])
  
  const observer = useRef<IntersectionObserver | null>(null)
  const lastVideoRef = useCallback((node: HTMLDivElement) => {
    if (loadingMore || !hasMore) return
    
    if (observer.current) observer.current.disconnect()
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        console.log('Intersection detected, loading more videos...')
        // Use a function reference instead of direct dependency
        const loadMore = async () => {
          if (!hasMore || loadingMore) return
          
          setLoadingMore(true)
          
          try {
            if (searchMode && searchQuery.trim()) {
              // Load more search results
              await searchAllChannels(searchQuery, currentPage + 1)
            } else {
              // Load more videos from current channel
              const nextPage = currentPage + 1
              const response = await fetch(`/api/youtube/channel/${activeChannel}?page=${nextPage}&limit=${VIDEOS_PER_PAGE}`)
              
              if (response.ok) {
                const data: ApiResponse = await response.json()
                
                if (data.videos.length > 0) {
                  const newVideos = data.videos.map((video: any) => ({
                    ...video,
                    duration: video.duration || '',
                    viewCount: video.viewCount || ''
                  }))
                  
                  setAllVideos(prev => [...prev, ...newVideos])
                  setCurrentPage(nextPage)
                  setHasMore(data.pagination.hasNextPage)
                } else {
                  setHasMore(false)
                }
              } else {
                setHasMore(false)
              }
            }
          } catch (error) {
            console.error('Error loading more videos:', error)
            setHasMore(false)
          } finally {
            setLoadingMore(false)
          }
        }
        
        loadMore()
      }
    }, {
      rootMargin: '100px', // Start loading a bit earlier
      threshold: 0.1
    })
    
    if (node) observer.current.observe(node)
  }, [loadingMore, hasMore, searchMode, searchQuery, currentPage, activeChannel])

  useEffect(() => {
    fetchInitialData()
  }, [])

  // Initialize preferences when they're loaded
  useEffect(() => {
    if (!prefsLoading) {
      // Set time filter from preferences
      if (preferences.timeFilter) {
        setTimeFilter(preferences.timeFilter)
      }
      
      // Set active channel from preferences if available
      if (preferences.lastWatchedChannel) {
        setActiveChannel(preferences.lastWatchedChannel)
      } else if (CHANNELS.length > 0) {
        setActiveChannel(CHANNELS[0].id)
      }
    }
  }, [prefsLoading, preferences])

  useEffect(() => {
    if (searchQuery.trim()) {
      // Search across all channels
      const timeoutId = setTimeout(() => {
        searchAllChannels(searchQuery)
      }, 500) // Debounce search
      
      return () => clearTimeout(timeoutId)
    } else {
      // Normal filtering for current channel
      setSearchMode(false)
      filterVideos()
    }
  }, [searchQuery, timeFilter])

  useEffect(() => {
    if (!searchQuery.trim() && !searchMode && allVideos.length > 0) {
      filterVideos()
    }
  }, [allVideos, activeChannel])

  const fetchInitialData = async () => {
    try {
      setApiError(null)
      setLoading(true)
      const channelsData: Channel[] = []
      let hasData = false
      
      for (const channel of CHANNELS) {
        try {
          const response = await fetch(`/api/youtube/channel/${channel.id}?page=1&limit=${VIDEOS_PER_PAGE}`)
          if (response.ok) {
            const data: ApiResponse & { channel?: any } = await response.json()
            if (data.videos.length > 0) {
              hasData = true
              const channelInfo = data.channel || {}
              channelsData.push({
                ...channel,
                name: channelInfo.name || channel.name,
                logo: channelInfo.logo,
                banner: channelInfo.banner,
                subscriberCount: channelInfo.subscriberCount,
                videoCount: channelInfo.videoCount,
                videos: data.videos.map((video: any) => ({
                  ...video,
                  duration: video.duration || '',
                  viewCount: video.viewCount || '',
                  channelLogo: video.channelLogo || channelInfo.logo
                }))
              })
            } else {
              channelsData.push({
                ...channel,
                videos: []
              })
            }
          } else {
            channelsData.push({
              ...channel,
              videos: []
            })
          }
        } catch (error) {
          console.error(`Error fetching data for channel ${channel.id}:`, error)
          channelsData.push({
            ...channel,
            videos: []
          })
        }
      }
      
      setChannels(channelsData)
      
      // Only show error if no data at all
      if (!hasData) {
        setApiError('لا يمكن جلب البيانات من اليوتيوب حالياً. يرجى المحاولة مرة أخرى لاحقاً.')
      }
      
      // Auto-select first video from first channel with videos
      const firstChannelWithVideos = channelsData.find(c => c.videos.length > 0)
      if (firstChannelWithVideos) {
        setActiveChannel(firstChannelWithVideos.id)
        setSelectedVideo(firstChannelWithVideos.videos[0])
        setAllVideos(firstChannelWithVideos.videos)
        setHasMore(firstChannelWithVideos.videos.length >= VIDEOS_PER_PAGE)
      }
    } catch (error) {
      console.error('Error fetching channels data:', error)
      setApiError('حدث خطأ في جلب البيانات. يرجى المحاولة مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  const searchAllChannels = async (query: string, page: number = 1) => {
    if (!query.trim()) {
      setSearchMode(false)
      filterVideos()
      return
    }

    setIsSearching(true)
    setSearchMode(true)
    
    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&timeFilter=${timeFilter}&page=${page}&limit=${VIDEOS_PER_PAGE}`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (page === 1) {
          setFilteredVideos(data.videos)
        } else {
          setFilteredVideos(prev => [...prev, ...data.videos])
        }
        
        setHasMore(data.pagination.hasNextPage)
        setCurrentPage(page)
      } else {
        setFilteredVideos([])
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error searching videos:', error)
      setFilteredVideos([])
      setHasMore(false)
    } finally {
      setIsSearching(false)
    }
  }

  const loadMoreVideos = async () => {
    if (!hasMore || loadingMore) return
    
    setLoadingMore(true)
    
    try {
      if (searchMode && searchQuery.trim()) {
        // Load more search results
        await searchAllChannels(searchQuery, currentPage + 1)
      } else {
        // Load more videos from current channel
        const nextPage = currentPage + 1
        const response = await fetch(`/api/youtube/channel/${activeChannel}?page=${nextPage}&limit=${VIDEOS_PER_PAGE}`)
        
        if (response.ok) {
          const data: ApiResponse = await response.json()
          
          if (data.videos.length > 0) {
            const newVideos = data.videos.map((video: any) => ({
              ...video,
              duration: video.duration || '',
              viewCount: video.viewCount || ''
            }))
            
            setAllVideos(prev => [...prev, ...newVideos])
            setCurrentPage(nextPage)
            setHasMore(data.pagination.hasNextPage)
          } else {
            setHasMore(false)
          }
        } else {
          setHasMore(false)
        }
      }
    } catch (error) {
      console.error('Error loading more videos:', error)
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }

  const filterVideos = () => {
    // Get all videos from all channels for search
    let videos = allVideos
    
    // If search query exists, search across all channels
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const allChannelsVideos = channels.flatMap(channel => channel.videos)
      videos = allChannelsVideos.filter(video =>
        video.title.toLowerCase().includes(query) ||
        video.channelName.toLowerCase().includes(query) ||
        (video.description && video.description.toLowerCase().includes(query))
      )
    } else {
      // If no search query, use current channel's videos
      const currentChannel = channels.find(c => c.id === activeChannel)
      if (!currentChannel) return
      videos = allVideos
    }

    // Apply time filter
    if (timeFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (timeFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1)
          break
      }

      videos = videos.filter(video => {
        const videoDate = new Date(video.publishedAt)
        return videoDate >= filterDate
      })
    }

    setFilteredVideos(videos)
  }

  

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    // For today, show time
    if (diffDays === 0) {
      const hours = date.getHours()
      const minutes = date.getMinutes().toString().padStart(2, '0')
      const period = hours >= 12 ? 'م' : 'ص'
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
      return `الساعة ${displayHours}:${minutes} ${period}`
    }
    
    if (diffDays === 1) return 'أمس'
    if (diffDays < 7) return `منذ ${diffDays} أيام`
    if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`
    if (diffDays < 365) return `منذ ${Math.floor(diffDays / 30)} أشهر`
    return `منذ ${Math.floor(diffDays / 365)} سنوات`
  }

  const formatViewCount = (count: string) => {
    if (!count) return ''
    
    const numMatch = count.match(/\d+/)
    if (!numMatch) return count
    
    const num = parseInt(numMatch[0])
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* YouTube-style Header */}
        <header className="sticky top-0 z-40 bg-background border-b border-border backdrop-blur-sm bg-opacity-95">
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Logo */}
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xs sm:text-sm">ي</span>
                </div>
                <h1 className="text-lg sm:text-xl font-bold">المنصة التعليمية</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Loading Content */}
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-center mb-8">
            <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">جاري تحميل المنصة التعليمية</h2>
            <p className="text-muted-foreground">يتم الآن تحميل القنوات والفيديوهات التعليمية...</p>
          </div>
          
          {/* Loading Skeleton */}
          <div className="w-full max-w-4xl px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-card rounded-lg overflow-hidden border border-border">
                  <div className="aspect-video bg-muted animate-pulse" />
                  <div className="p-3">
                    <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isFullscreen && selectedVideo) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="w-full h-full relative">
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-4 right-4 z-10"
            onClick={toggleFullscreen}
          >
            ✕
          </Button>
          <LiteYouTubeEmbed
            id={selectedVideo.id}
            title={selectedVideo.title}
            thumbnail={selectedVideo.thumbnail}
            params="rel=0&modestbranding=1&showinfo=0&controls=1&autoplay=1&iv_load_policy=3&cc_load_policy=1"
            adNetwork={false}
            playlist={false}
            playlistCoverId=""
            poster="hqdefault"
            wrapperClass="yt-lite w-full h-full"
            playerClass="lty-playbtn"
            iframeClass="w-full h-full"
            noCookie={true}
          />
        </div>
      </div>
    )
  }

  const totalVideos = channels.reduce((sum, channel) => sum + channel.videos.length, 0)
  
  // Calculate total videos across all channels including loaded videos
  const totalLoadedVideos = allVideos.length + channels.reduce((sum, channel) => {
    return sum + (channel.id === activeChannel ? 0 : channel.videos.length)
  }, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* YouTube-style Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border backdrop-blur-sm bg-opacity-95">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Logo */}
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs sm:text-sm">ي</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold">المنصة التعليمية</h1>
            </div>
            
            {/* Search Bar - Hidden on mobile, shown on md+ */}
            <div className="hidden md:flex items-center max-w-md flex-1 mx-2 sm:mx-4">
              <div className="relative w-full">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder={searchMode ? "ابحث في جميع القنوات..." : "ابحث في الفيديوهات..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 youtube-search h-9 sm:h-10" // Slightly larger for better touch
                  disabled={totalLoadedVideos === 0}
                />
                {isSearching && (
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                {/* Search loading message */}
                {isSearching && searchQuery && (
                  <div className="absolute left-12 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground whitespace-nowrap">
                    جاري البحث في "{searchQuery}"...
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            {/* Filter Dropdown - Hidden on small screens */}
            <div className="hidden sm:flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={timeFilter} onValueChange={(value: TimeFilter) => {
                setTimeFilter(value)
                updatePreference('timeFilter', value)
              }} disabled={totalLoadedVideos === 0}>
                <SelectTrigger className="w-32 sm:w-40">
                  <SelectValue placeholder="الوقت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="week">أسبوع</SelectItem>
                  <SelectItem value="month">شهر</SelectItem>
                  <SelectItem value="year">سنة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Favorites Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/favorites')}
              className="gap-1 sm:gap-2 h-9 sm:h-10 px-2 sm:px-3" // Larger on mobile
            >
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">المفضلة</span>
            </Button>
            
            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={refreshing}
              className="gap-1 sm:gap-2 h-9 sm:h-10 px-2 sm:px-3" // Larger on mobile
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {refreshing ? 'جاري التحديث...' : 'تحديث'}
              </span>
              <span className="sm:hidden">
                {refreshing ? 'تحديث...' : 'تحديث'}
              </span>
            </Button>

            {/* Theme Toggle */}
            <div className="h-9 sm:h-10 flex items-center"> {/* Larger touch area */}
              <ThemeToggle />
            </div>

            {/* Keyboard Shortcuts Help - Hidden on small screens */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                alert('اختصارات لوحة المفاتيح:\n\n' +
                      'Ctrl/Cmd + K: التركيز على البحث\n' +
                      'Ctrl/Cmd + F: فتح المفضلة\n' +
                      'Ctrl/Cmd + R: تحديث المحتوى\n' +
                      '1-4: التبديل بين القنوات\n' +
                      '←→↑↓: التنقل بين الفيديوهات\n' +
                      'Enter: تشغيل الفيديو المحدد')
              }}
              className="gap-1 sm:gap-2 h-9 sm:h-10 px-2 sm:px-3 hidden sm:flex"
              title="اختصارات لوحة المفاتيح"
            >
              <Keyboard className="h-4 w-4" />
              <span className="hidden sm:inline">اختصارات</span>
            </Button>

            {/* Video Count Badge - Hidden on small screens */}
            <Badge variant="secondary" className="hidden sm:flex">
              {totalLoadedVideos} فيديو
            </Badge>
          </div>
        </div>

        {/* Mobile Search Bar - Full width below header */}
        <div className="md:hidden px-3 pb-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="ابحث في الفيديوهات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 youtube-search h-10 text-base"
              disabled={totalLoadedVideos === 0}
            />
            {isSearching && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {/* Search loading message */}
            {isSearching && searchQuery && (
              <div className="absolute left-12 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground whitespace-nowrap">
                جاري البحث في "{searchQuery}"...
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Error Message */}
      {apiError && (
        <div className="mx-4 mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{apiError}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar - Channel Navigation */}
        <aside className="hidden lg:block w-64 min-h-screen border-r border-border bg-muted/30">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4">القنوات</h2>
            <nav className="space-y-2">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelChange(channel.id)}
                  disabled={switchingChannel}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-right relative ${
                    activeChannel === channel.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  } ${switchingChannel ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {switchingChannel && activeChannel === channel.id && (
                    <div className="absolute inset-0 bg-background/50 rounded-lg flex items-center justify-center">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    {channel.logo ? (
                      <Image
                        src={channel.logo}
                        alt={channel.name}
                        width={28}
                        height={28}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                        {channel.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{channel.name}</div>
                    <div className="text-xs opacity-75">
                      {channel.id === activeChannel ? allVideos.length : channel.videos.length} فيديو
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1">
          {/* Mobile Channel Tabs */}
          <div className="lg:hidden border-b border-border">
            <div className="flex overflow-x-auto px-2 sm:px-0">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelChange(channel.id)}
                  disabled={switchingChannel}
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b-2 whitespace-nowrap transition-colors min-w-fit relative ${
                    activeChannel === channel.id
                      ? 'border-primary text-primary'
                      : 'border-transparent hover:border-muted-foreground/50'
                  } ${switchingChannel ? 'opacity-70' : ''}`}
                >
                  {switchingChannel && activeChannel === channel.id && (
                    <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 animate-spin absolute top-1 right-1" />
                  )}
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    {channel.logo ? (
                      <Image
                        src={channel.logo}
                        alt={channel.name}
                        width={16}
                        height={16}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-[8px] sm:text-xs">
                        {channel.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-medium truncate">{channel.name}</span>
                  <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 sm:px-2">
                    {channel.id === activeChannel ? allVideos.length : channel.videos.length}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Content Grid */}
          <div className="p-2 sm:p-4">
            {/* Video Player Section */}
            {selectedVideo && (
              <div className="mb-8">
                <div className="youtube-card bg-card rounded-lg overflow-hidden relative">
                  {/* Loading Overlay */}
                  {selectingVideo && (
                    <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
                      <div className="text-white text-center">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p className="text-sm">جاري تحميل الفيديو...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Video Player Preview */}
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <Image
                      src={selectedVideo.thumbnail}
                      alt={selectedVideo.title}
                      fill
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Button 
                        onClick={() => router.push(`/video/${selectedVideo.id}`)}
                        className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full text-lg font-semibold"
                        disabled={selectingVideo}
                      >
                        {selectingVideo ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                            جاري التحميل...
                          </>
                        ) : (
                          'تشغيل الفيديو'
                        )}
                      </Button>
                    </div>
                    {selectedVideo.duration && (
                      <div className="absolute bottom-2 right-2 youtube-badge">
                        {selectedVideo.duration}
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="p-3">
                    <h2 className="text-lg font-semibold mb-3 line-clamp-2">
                      {selectedVideo.title}
                    </h2>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                          {selectedVideo.channelLogo ? (
                            <Image
                              src={selectedVideo.channelLogo}
                              alt={selectedVideo.channelName}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                              {selectedVideo.channelName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{selectedVideo.channelName}</div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span>{formatViewCount(selectedVideo.viewCount)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(selectedVideo.publishedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/video/${selectedVideo.id}`)}
                        disabled={selectingVideo}
                        className="gap-2"
                      >
                        {selectingVideo ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          </>
                        ) : null}
                        مشاهدة
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Videos Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {searchMode ? 'نتائج البحث' : channels.find(c => c.id === activeChannel)?.name || 'الفيديوهات'}
                </h2>
                {(searchQuery || timeFilter !== 'all') && (
                  <Badge variant="outline">
                    {filteredVideos.length} نتيجة
                  </Badge>
                )}
              </div>

              {filteredVideos.length > 0 ? (
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {filteredVideos.map((video, index) => (
                    <div
                      key={`${video.id}-${video.publishedAt}-${index}`}
                      className={`youtube-card bg-card rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-lg relative ${
                        selectedVideo?.id === video.id ? 'ring-2 ring-primary' : ''
                      } ${selectingVideo ? 'pointer-events-none' : ''}`}
                      onClick={() => handleVideoSelect(video)}
                      ref={index === filteredVideos.length - 1 ? lastVideoRef : null}
                    >
                      {/* Loading Overlay */}
                      {selectingVideo && selectedVideo?.id === video.id && (
                        <div className="absolute inset-0 bg-black/30 z-10 flex items-center justify-center rounded-lg">
                          <RefreshCw className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                      
                      {/* Thumbnail */}
                      <div className="youtube-thumbnail aspect-video relative overflow-hidden bg-muted group">
                        <Image
                          src={video.thumbnail}
                          alt={video.title}
                          fill
                          className="object-cover w-full h-full"
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          priority={false}
                        />
                        {video.duration && (
                          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
                            {video.duration}
                          </div>
                        )}
                        
                        {/* Favorite button */}
                        <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <FavoriteButton 
                            video={video} 
                            size="sm"
                            className="bg-black/50 hover:bg-black/70"
                          />
                        </div>
                      </div>

                      {/* Video Info */}
                      <div className="p-2 sm:p-3">
                        <h3 className="font-medium text-xs sm:text-sm line-clamp-2 mb-1 sm:mb-2 leading-tight">
                          {video.title}
                        </h3>
                        
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full overflow-hidden bg-muted flex-shrink-0">
                            {video.channelLogo ? (
                              <Image
                                src={video.channelLogo}
                                alt={video.channelName}
                                width={16}
                                height={16}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-[8px] sm:text-xs">
                                {video.channelName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {video.channelName}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="h-2 w-2 sm:h-3 sm:w-3" />
                            <span>{formatViewCount(video.viewCount)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-2 w-2 sm:h-3 sm:w-3" />
                            <span>{formatDate(video.publishedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="text-6xl mb-4">
                    {isSearching ? (
                      <div className="flex flex-col items-center">
                        <RefreshCw className="h-16 w-16 animate-spin mb-2 text-primary" />
                        <span className="text-2xl">🔍</span>
                      </div>
                    ) : allVideos.length === 0 ? (
                      '📡'
                    ) : (
                      '🔍'
                    )}
                  </div>
                  <p className="text-lg mb-2">
                    {isSearching
                      ? `جاري البحث عن "${searchQuery}"...`
                      : allVideos.length === 0
                      ? 'لا توجد فيديوهات متاحة حالياً'
                      : searchQuery || timeFilter !== 'all'
                      ? `لا توجد نتائج للبحث عن "${searchQuery}"`
                      : 'لا توجد فيديوهات متاحة حالياً'
                    }
                  </p>
                  {isSearching && (
                    <p className="text-sm text-muted-foreground mb-4">
                      يرجى الانتظار بينما نبحث في جميع القنوات...
                    </p>
                  )}
                  {allVideos.length === 0 && !isSearching && (
                    <Button
                      variant="outline"
                      onClick={refreshData}
                      className="mt-4"
                    >
                      محاولة تحميل البيانات
                    </Button>
                  )}
                </div>
              )}

              {/* Load More Button - Always show when hasMore is true */}
              {hasMore && (
                <div className="flex justify-center mt-6 sm:mt-8">
                  <Button
                    variant="outline"
                    onClick={loadMoreVideos}
                    disabled={loadingMore}
                    className="flex items-center gap-2 min-w-[180px] sm:min-w-[200px] h-10 sm:h-auto"
                  >
                    {loadingMore ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>جاري التحميل...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        <span className="text-sm sm:text-base">تحميل المزيد</span>
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Loading indicator for infinite scroll */}
              {loadingMore && (
                <div className="flex justify-center mt-6 sm:mt-8">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span className="text-sm">
                      {searchMode 
                        ? `جاري تحميل المزيد من نتائج البحث عن "${searchQuery}"...` 
                        : 'جاري تحميل المزيد من الفيديوهات...'
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// Add custom styles for YouTube theme
const styles = `
  .youtube-card {
    transition: all 0.2s ease;
    border: 1px solid var(--border);
  }

  .youtube-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .youtube-thumbnail {
    position: relative;
    overflow: hidden;
    background: #000;
  }

  .youtube-thumbnail::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.7));
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .youtube-thumbnail:hover::before {
    opacity: 1;
  }

  .youtube-badge {
    background: rgba(0,0,0,0.8);
    color: white;
    font-size: 0.75rem;
    font-weight: 500;
    padding: 2px 4px;
    border-radius: 2px;
  }

  .youtube-button {
    background: #FF0000;
    color: white;
    border: none;
    border-radius: 18px;
    padding: 8px 16px;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .youtube-button:hover {
    background: #CC0000;
    transform: scale(1.05);
  }

  .youtube-search {
    border-radius: 40px;
    border: 1px solid var(--border);
  }

  .youtube-channel-tab {
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
  }

  .youtube-channel-tab.active {
    border-bottom-color: #FF0000;
    color: #FF0000;
  }

  /* Custom scrollbar for YouTube theme */
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: var(--muted);
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: var(--muted-foreground);
    border-radius: 4px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: var(--foreground);
  }

  /* Lite YouTube Embed styles */
  .yt-lite {
    background-color: #000;
    position: relative;
    display: block;
    contain: content;
    background-position: center center;
    background-size: cover;
    cursor: pointer;
    background-size: cover;
    cursor: pointer;
  }

  .yt-lite::before {
    content: '';
    display: block;
    padding-bottom: 56.25%;
  }

  .yt-lite > iframe {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    border: 0;
  }

  /* Mobile-specific styles */
  @media (max-width: 640px) {
    .youtube-card {
      border-radius: 0.5rem;
    }
    
    .youtube-thumbnail {
      border-radius: 0.375rem 0.375rem 0 0;
    }
    
    /* Ensure proper touch targets */
    button, .clickable {
      min-height: 44px;
    }
    
    /* Improve text readability on mobile */
    .text-xs {
      font-size: 0.75rem;
    }
    
    /* Better spacing for mobile */
    .gap-1 {
      gap: 0.25rem;
    }
    
    .gap-2 {
      gap: 0.5rem;
    }
  }
  
  /* Small mobile improvements */
  @media (max-width: 480px) {
    .youtube-card {
      margin: 0 -0.125rem;
    }
    
    .p-2 {
      padding: 0.5rem;
    }
  }
`

// Inject styles into the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}