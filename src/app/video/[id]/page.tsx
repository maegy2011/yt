'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Eye, Calendar, Clock } from 'lucide-react'
import LiteYouTubeEmbed from 'react-lite-youtube-embed'
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css'
import { RelatedVideoSkeleton } from '@/components/video-card-skeleton'

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
}

export default function VideoPage() {
  const params = useParams()
  const router = useRouter()
  const videoId = params.id as string
  
  const [video, setVideo] = useState<Video | null>(null)
  const [channel, setChannel] = useState<Channel | null>(null)
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (videoId) {
      fetchVideoData()
    }
  }, [videoId])

  const fetchVideoData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch video details using the dedicated video API
      const videoResponse = await fetch(`/api/youtube/video?id=${videoId}`)
      if (videoResponse.ok) {
        const data = await videoResponse.json()
        if (data.video) {
          setVideo(data.video)
          setChannel(data.channel)
          setRelatedVideos(data.relatedVideos || [])
        } else {
          setError('الفيديو غير موجود')
        }
      } else if (videoResponse.status === 404) {
        setError('الفيديو غير موجود')
      } else {
        setError('حدث خطأ في جلب بيانات الفيديو. يرجى المحاولة مرة أخرى.')
      }
    } catch (error) {
      console.error('Error fetching video data:', error)
      setError('حدث خطأ في جلب بيانات الفيديو. يرجى المحاولة مرة أخرى.')
    } finally {
      setLoading(false)
    }
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

  const handleGoBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background border-b border-border backdrop-blur-sm bg-opacity-95">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="sm" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-bold">مشغل الفيديو</h1>
          </div>
        </header>

        <div className="p-4">
          {/* Video Player Skeleton */}
          <div className="aspect-video bg-black rounded-lg mb-4">
            <Skeleton className="w-full h-full" />
          </div>

          {/* Video Info Skeleton */}
          <div className="space-y-4 mb-6">
            <Skeleton className="h-6 w-3/4" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>

          {/* Related Videos Skeleton */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">فيديوهات مقترحة</h2>
            <RelatedVideoSkeleton count={6} />
          </div>
        </div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold mb-2">حدث خطأ</h2>
          <p className="text-muted-foreground mb-4">{error || 'الفيديو غير موجود'}</p>
          <Button onClick={handleGoBack}>العودة للصفحة الرئيسية</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border backdrop-blur-sm bg-opacity-95">
        <div className="flex items-center gap-4 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">مشغل الفيديو</h1>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* Main Content */}
        <main className="flex-1 p-4">
          {/* Video Player */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
            <LiteYouTubeEmbed
              id={video.id}
              title={video.title}
              thumbnail={video.thumbnail}
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

          {/* Video Info */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h1 className="text-xl font-bold mb-4 leading-tight">{video.title}</h1>
              
              {/* Video Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{formatViewCount(video.viewCount)} مشاهدة</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(video.publishedAt)}</span>
                </div>
                {video.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{video.duration}</span>
                  </div>
                )}
              </div>

              {/* Channel Info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {video.channelLogo ? (
                    <Image
                      src={video.channelLogo}
                      alt={video.channelName}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {video.channelName.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium">{video.channelName}</div>
                  {channel?.subscriberCount && (
                    <div className="text-sm text-muted-foreground">
                      {channel.subscriberCount} مشترك
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {video.description && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">الوصف</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {video.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Sidebar - Related Videos */}
        <aside className="w-full lg:w-96 p-4 border-t lg:border-t-0 lg:border-r">
          <h2 className="text-lg font-semibold mb-4">فيديوهات مقترحة</h2>
          
          {relatedVideos.length > 0 ? (
            <div className="space-y-4">
              {relatedVideos
                .filter(v => v.id !== video.id)
                .slice(0, 10)
                .map((relatedVideo) => (
                  <div
                    key={`${relatedVideo.id}-${relatedVideo.publishedAt}`}
                    className="flex gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                    onClick={() => router.push(`/video/${relatedVideo.id}`)}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video w-32 flex-shrink-0 rounded-lg overflow-hidden bg-muted relative">
                      <Image
                        src={relatedVideo.thumbnail}
                        alt={relatedVideo.title}
                        width={128}
                        height={72}
                        className="w-full h-full object-cover"
                      />
                      {relatedVideo.duration && (
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
                          {relatedVideo.duration}
                        </div>
                      )}
                    </div>

                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-2 mb-1 leading-tight">
                        {relatedVideo.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-1">
                        {relatedVideo.channelName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatViewCount(relatedVideo.viewCount)} مشاهدة</span>
                        <span>•</span>
                        <span>{formatDate(relatedVideo.publishedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>لا توجد فيديوهات مقترحة</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}