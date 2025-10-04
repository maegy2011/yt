'use client'

import { useState, useEffect } from 'react'
import VideoCard from '@/components/video-card'
import ChannelSlider from '@/components/channel-slider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Filter } from 'lucide-react'

interface Video {
  id: string
  video_id: string
  title: string
  description?: string
  thumbnails?: any
  duration?: string
  manual_tags?: string
  is_active: boolean
}

interface Channel {
  id: string
  channel_id: string
  channel_title: string
  video_count: number
  thumbnail_url?: string
}

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [videos, setVideos] = useState<Video[]>([])
  const [channels, setChannels] = useState<Channel[]>([])

  useEffect(() => {
    fetchVideos()
    fetchChannels()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchVideos(searchTerm)
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const fetchVideos = async (searchTerm = '') => {
    try {
      const url = searchTerm 
        ? `/api/videos?search=${encodeURIComponent(searchTerm)}`
        : '/api/videos'
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setVideos(data.videos || [])
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/channels')
      if (response.ok) {
        const data = await response.json()
        setChannels(data.channels || [])
      }
    } catch (error) {
      console.error('Error fetching channels:', error)
    }
  }

  const handleVideoPlay = (videoId: string) => {
    // Log video play for analytics
    console.log('Playing video:', videoId)
  }

  const handleChannelClick = (channelId: string) => {
    // Filter videos by channel
    console.log('Channel clicked:', channelId)
    // This could be enhanced to filter videos by channel
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading videos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">يوتيوب إسلامي</h1>
            
            {/* Search */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="ابحث في الفيديوهات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                تصفية
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Channel Slider */}
        {channels.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">القنوات</h2>
            <ChannelSlider
              channels={channels}
              onChannelClick={handleChannelClick}
            />
          </div>
        )}

        {/* Videos Grid */}
        {videos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📺</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'لم يتم العثور على فيديوهات' : 'لا توجد فيديوهات متاحة'}
            </h2>
            <p className="text-gray-600">
              {searchTerm 
                ? 'حاول تعديل شروط البحث'
                : 'تفقد لاحقاً المحتوى الإسلامي الجديد'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos
              .filter(video => video.is_active)
              .map((video) => (
                <VideoCard
                  key={video.id}
                  id={video.id}
                  videoId={video.video_id}
                  title={video.title}
                  description={video.description}
                  thumbnails={video.thumbnails}
                  duration={video.duration}
                  manualTags={video.manual_tags}
                  isActive={video.is_active}
                  onPlay={() => handleVideoPlay(video.video_id)}
                />
              ))}
          </div>
        )}
      </main>
    </div>
  )
}