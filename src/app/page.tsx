'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, Clock, Eye, Calendar, RefreshCw, AlertCircle } from 'lucide-react'
import LiteYouTubeEmbed from 'react-lite-youtube-embed'
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css'

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
    url: 'https://youtube.com/@alhewenytube?si=PsPY3cC-Zl5osfN_'
  }
]

type TimeFilter = 'all' | 'today' | 'week' | 'month' | 'year'

const VIDEOS_PER_PAGE = 24

export default function Home() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [activeChannel, setActiveChannel] = useState<string>(CHANNELS[0]?.id || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchMode, setSearchMode] = useState(false)
  
  // Infinite scroll states
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [allVideos, setAllVideos] = useState<Video[]>([])
  
  const observer = useRef<IntersectionObserver | null>(null)
  const lastVideoRef = useCallback((node: HTMLDivElement) => {
    if (loadingMore) return
    
    if (observer.current) observer.current.disconnect()
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        loadMoreVideos()
      }
    })
    
    if (node) observer.current.observe(node)
  }, [loadingMore, hasMore])

  useEffect(() => {
    fetchInitialData()
  }, [])

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

  const handleChannelChange = (channelId: string) => {
    setActiveChannel(channelId)
    setCurrentPage(1)
    setHasMore(true)
    setAllVideos([])
    setSearchMode(false)
    setSearchQuery('')
    
    const channel = channels.find(c => c.id === channelId)
    if (channel && channel.videos.length > 0) {
      setAllVideos(channel.videos)
      setSelectedVideo(channel.videos[0])
      setHasMore(channel.videos.length >= VIDEOS_PER_PAGE)
    }
  }

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video)
    if (isFullscreen) {
      setIsFullscreen(false)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'اليوم'
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
      <div className="container mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">المنصة التعليمية</h1>
          <p className="text-muted-foreground">مركز الفيديوهات التعليمية من القنوات الموثوقة</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <Card key={index}>
              <Skeleton className="aspect-video w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
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

  return (
    <div className="container mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">المنصة التعليمية</h1>
        <p className="text-muted-foreground">مركز الفيديوهات التعليمية من القنوات الموثوقة</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <Badge variant="secondary">
            بيئة تعليمية خالية من التشتت
          </Badge>
          <Badge variant="outline">
            {totalVideos} فيديو متاح
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {apiError && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{apiError}</span>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder={searchMode ? "ابحث في جميع القنوات..." : "ابحث في الفيديوهات..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
            disabled={totalVideos === 0}
          />
          {isSearching && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)} disabled={totalVideos === 0}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="تصفية حسب التاريخ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفيديوهات</SelectItem>
                <SelectItem value="today">اليوم</SelectItem>
                <SelectItem value="week">آخر أسبوع</SelectItem>
                <SelectItem value="month">آخر شهر</SelectItem>
                <SelectItem value="year">آخر سنة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player Section */}
        <div className="lg:col-span-2">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedVideo ? selectedVideo.title : 'اختر فيديو للمشاهدة'}
              </CardTitle>
              {selectedVideo && (
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
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(selectedVideo.publishedAt)}</span>
                        </div>
                        {selectedVideo.viewCount && (
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{formatViewCount(selectedVideo.viewCount)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFullscreen}
                    disabled={!selectedVideo}
                  >
                    ملء الشاشة
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {selectedVideo ? (
                <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                  <LiteYouTubeEmbed
                    id={selectedVideo.id}
                    title={selectedVideo.title}
                    thumbnail={selectedVideo.thumbnail}
                    params="rel=0&modestbranding=1&showinfo=0&controls=1&autoplay=1&iv_load_policy=3&cc_load_policy=1"
                    adNetwork={false}
                    playlist={false}
                    playlistCoverId=""
                    poster="hqdefault"
                    wrapperClass="yt-lite"
                    playerClass="lty-playbtn"
                    onIframeAdded={() => console.log('YouTube iframe added')}
                    noCookie={true}
                  />
                  {selectedVideo.duration && (
                    <Badge className="absolute bottom-2 left-2 bg-black/80 text-white">
                      {selectedVideo.duration}
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📺</div>
                    <p className="text-muted-foreground">
                      {totalVideos === 0 ? 'لا توجد فيديوهات متاحة حالياً' : 'اختر فيديو من القائمة لبدء المشاهدة'}
                    </p>
                    {totalVideos === 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshData}
                        className="mt-4"
                      >
                        محاولة تحميل البيانات
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Channels and Videos Section */}
        <div className="lg:col-span-1">
          <Tabs value={activeChannel} onValueChange={handleChannelChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-4 h-auto p-1 gap-2">
              {channels.map((channel) => (
                <TabsTrigger 
                  key={channel.id} 
                  value={channel.id}
                  className="flex flex-col items-center gap-2 py-3 px-2 h-auto text-center leading-tight data-[state=active]:shadow-md transition-all"
                  disabled={channel.videos.length === 0}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                    {channel.logo ? (
                      <Image
                        src={channel.logo}
                        alt={channel.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                        {channel.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium line-clamp-2">{channel.name}</span>
                  <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                    {channel.videos.length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {channels.map((channel) => (
              <TabsContent key={channel.id} value={channel.id} className="space-y-4 mt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      {channel.logo ? (
                        <Image
                          src={channel.logo}
                          alt={channel.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                          {channel.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{channel.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {allVideos.length} فيديو
                        </Badge>
                        {channel.subscriberCount && (
                          <Badge variant="secondary" className="text-xs">
                            {channel.subscriberCount}
                          </Badge>
                        )}
                        {(searchQuery || timeFilter !== 'all') && (
                          <Badge variant="secondary" className="text-xs">
                            {filteredVideos.length} نتيجة
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-3 custom-scrollbar">
                  {filteredVideos.length > 0 ? (
                    filteredVideos.map((video, index) => (
                      <Card 
                        key={`${video.id}-${video.publishedAt}-${index}`} 
                        className={`cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${
                          selectedVideo?.id === video.id ? 'ring-2 ring-primary shadow-md' : ''
                        }`}
                        onClick={() => handleVideoSelect(video)}
                        ref={index === filteredVideos.length - 1 ? lastVideoRef : null}
                      >
                        <CardContent className="p-3">
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 w-24 h-16 rounded overflow-hidden bg-muted relative">
                              <Image
                                src={video.thumbnail}
                                alt={video.title}
                                fill
                                className="object-cover"
                                sizes="96px"
                                priority={false}
                              />
                              {video.duration && (
                                <Badge className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 py-0">
                                  {video.duration}
                                </Badge>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm line-clamp-2 mb-1 leading-tight">
                                {video.title}
                              </h3>
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-5 h-5 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                  {video.channelLogo ? (
                                    <Image
                                      src={video.channelLogo}
                                      alt={video.channelName}
                                      width={20}
                                      height={20}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                                      {video.channelName.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground truncate">{video.channelName}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatDate(video.publishedAt)}</span>
                                </div>
                                {video.viewCount && (
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Eye className="h-3 w-3" />
                                    <span>{formatViewCount(video.viewCount)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="text-4xl mb-2">
                        {isSearching ? '🔍' : (allVideos.length === 0 ? '📡' : '🔍')}
                      </div>
                      <p>
                        {isSearching
                          ? 'جاري البحث...'
                          : allVideos.length === 0
                          ? 'لا توجد فيديوهات متاحة حالياً'
                          : searchQuery || timeFilter !== 'all'
                          ? 'لا توجد نتائج للبحث'
                          : 'لا توجد فيديوهات متاحة حالياً'
                        }
                      </p>
                      {allVideos.length === 0 && !isSearching && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={refreshData}
                          className="mt-4"
                        >
                          محاولة تحميل البيانات
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Loading indicator for infinite scroll */}
                  {loadingMore && (
                    <div className="flex justify-center py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>{searchMode ? 'جاري تحميل نتائج البحث...' : 'جاري تحميل المزيد من الفيديوهات...'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground));
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--foreground));
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .yt-lite {
          background-color: #000;
          position: relative;
          display: block;
          contain: content;
          background-position: center center;
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
      `}</style>
    </div>
  )
}