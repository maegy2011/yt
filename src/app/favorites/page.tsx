'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Star, Clock, Eye, Calendar, Heart, Trash2 } from 'lucide-react'
import { useFavorites } from '@/hooks/use-favorites'
import { VideoListSkeleton } from '@/components/video-card-skeleton'
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
  addedAt: string
}

export default function FavoritesPage() {
  const router = useRouter()
  const { favorites, isLoading, removeFavorite, clearFavorites, getFavoriteCount } = useFavorites()
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)

  const handleVideoSelect = (video: Video) => {
    router.push(`/video/${video.id}`)
  }

  const handleRemoveFavorite = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeFavorite(videoId)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background border-b border-border backdrop-blur-sm bg-opacity-95">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="sm" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-bold">المفضلة</h1>
          </div>
        </header>

        <div className="p-4">
          <VideoListSkeleton count={8} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border backdrop-blur-sm bg-opacity-95">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-bold">المفضلة</h1>
            <Badge variant="secondary" className="gap-1">
              <Heart className="h-3 w-3" />
              {getFavoriteCount()}
            </Badge>
          </div>
          
          {favorites.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFavorites}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              مسح الكل
            </Button>
          )}
        </div>
      </header>

      <div className="p-4">
        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-4">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">لا توجد فيديوهات مفضلة</h2>
            <p className="text-muted-foreground mb-6">
              أضف فيديوهات إلى المفضلة بالضغط على زر النجمة
            </p>
            <Button onClick={handleGoBack}>
              استعراض الفيديوهات
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {favorites.map((video) => (
              <Card 
                key={`${video.id}-${video.addedAt}`} 
                className="youtube-card bg-card rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 group"
                onClick={() => handleVideoSelect(video)}
              >
                {/* Thumbnail */}
                <div className="aspect-video relative overflow-hidden">
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {video.duration && (
                    <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                      {video.duration}
                    </div>
                  )}
                  
                  {/* Favorite button overlay */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <FavoriteButton 
                      video={video} 
                      size="sm"
                      className="bg-black/50 hover:bg-black/70"
                    />
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 mb-2 leading-tight group-hover:text-primary transition-colors">
                    {video.title}
                  </h3>
                  
                  {/* Channel Info */}
                  <div className="flex items-center gap-2 mb-2">
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
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {video.channelName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {video.channelName}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{formatViewCount(video.viewCount)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(video.publishedAt)}</span>
                    </div>
                  </div>

                  {/* Added date */}
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span>أضيف {formatDate(video.addedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}