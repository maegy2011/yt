'use client'

import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const mockVideos = [
  {
    id: 1,
    title: "Building a Modern Web App with Next.js 15 - Complete Tutorial",
    channel: "TechCode Academy",
    views: "245K views",
    timestamp: "2 days ago",
    thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=225&fit=crop",
    channelAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
    duration: "15:42"
  },
  {
    id: 2,
    title: "The Ultimate React Course 2024 - From Beginner to Pro",
    channel: "CodeMaster",
    views: "1.2M views",
    timestamp: "1 week ago",
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=225&fit=crop",
    channelAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
    duration: "45:18"
  },
  {
    id: 3,
    title: "10 JavaScript Tips You Need to Know in 2024",
    channel: "DevTips Daily",
    views: "89K views",
    timestamp: "3 days ago",
    thumbnail: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400&h=225&fit=crop",
    channelAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face",
    duration: "12:35"
  },
  {
    id: 4,
    title: "CSS Grid vs Flexbox - When to Use What?",
    channel: "Design & Code",
    views: "156K views",
    timestamp: "5 days ago",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=225&fit=crop",
    channelAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=32&h=32&fit=crop&crop=face",
    duration: "18:22"
  },
  {
    id: 5,
    title: "TypeScript Full Course for Beginners 2024",
    channel: "Programming Hub",
    views: "523K views",
    timestamp: "2 weeks ago",
    thumbnail: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=225&fit=crop",
    channelAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
    duration: "2:34:15"
  },
  {
    id: 6,
    title: "Building Responsive Layouts with Tailwind CSS",
    channel: "UI/UX Masters",
    views: "78K views",
    timestamp: "4 days ago",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=225&fit=crop",
    channelAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face",
    duration: "22:10"
  },
  {
    id: 7,
    title: "Node.js and Express - Complete REST API Tutorial",
    channel: "Backend Pro",
    views: "342K views",
    timestamp: "1 week ago",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=225&fit=crop",
    channelAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
    duration: "38:45"
  },
  {
    id: 8,
    title: "React Hooks Explained - useState, useEffect, useContext",
    channel: "React University",
    views: "198K views",
    timestamp: "6 days ago",
    thumbnail: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400&h=225&fit=crop",
    channelAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=32&h=32&fit=crop&crop=face",
    duration: "25:30"
  }
]

interface RelatedVideoCardProps {
  videoIndex?: number
}

export default function RelatedVideoCard({ videoIndex }: RelatedVideoCardProps) {
  const router = useRouter()
  const video = mockVideos[videoIndex || 0]
  
  const handleVideoClick = () => {
    router.push(`/watch/${video.id}`)
  }
  
  return (
    <div className="flex gap-2 p-2 cursor-pointer hover:bg-muted/50 rounded-lg" onClick={handleVideoClick}>
      {/* Thumbnail */}
      <div className="relative shrink-0">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-36 h-20 object-cover rounded"
        />
        <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 rounded">
          {video.duration}
        </span>
      </div>

      {/* Video Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium line-clamp-2 leading-tight mb-1">
          {video.title}
        </h3>
        
        <div className="text-muted-foreground text-xs mb-1">
          {video.channel}
        </div>
        
        <div className="text-muted-foreground/70 text-xs">
          {video.views} • {video.timestamp}
        </div>
      </div>
    </div>
  )
}