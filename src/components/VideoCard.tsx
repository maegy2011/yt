'use client'

import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Video } from '@/types'
import { mockVideos } from '@/constants/videos'

interface VideoCardProps {
  videoIndex?: number
  video?: Video
}

export default function VideoCard({ videoIndex, video }: VideoCardProps) {
  const router = useRouter()
  const videoData = video || mockVideos[videoIndex || 0]
  
  const handleVideoClick = () => {
    router.push(`/watch/${videoData.id}`)
  }
  
  return (
    <div className="p-2">
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="relative shrink-0 cursor-pointer" onClick={handleVideoClick}>
          <img
            src={videoData.thumbnail}
            alt={videoData.title}
            className="w-40 h-28 object-cover rounded-lg"
          />
          <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 rounded">
            {videoData.duration}
          </span>
        </div>

        {/* Video Info */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={handleVideoClick}>
          <h3 className="font-medium text-sm line-clamp-2 leading-tight mb-1 text-gray-900 dark:text-white">
            {videoData.title}
          </h3>
          
          <div className="flex items-center gap-1 mb-1">
            <Avatar className="h-5 w-5">
              <AvatarImage src={videoData.channelAvatar} />
              <AvatarFallback className="text-xs">C</AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-600 dark:text-gray-400">{videoData.channel}</span>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {videoData.views} • {videoData.timestamp}
          </div>
        </div>

        {/* More Options */}
        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
          <MoreVertical className="h-4 w-4 text-gray-900 dark:text-white" />
        </Button>
      </div>
    </div>
  )
}