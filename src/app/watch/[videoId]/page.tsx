'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Share2, Download, MoreHorizontal, ThumbsUp, ThumbsDown, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/theme-toggle'
import VideoCard from '@/components/VideoCard'
import RelatedVideoCard from '@/components/RelatedVideoCard'
import BottomNav from '@/components/BottomNav'
import SideMenu from '@/components/SideMenu'
import UserProfileMenu from '@/components/UserProfileMenu'

const mockVideoDetails = {
  1: {
    id: 1,
    title: "Building a Modern Web App with Next.js 15 - Complete Tutorial",
    channel: "TechCode Academy",
    views: "245,389 views",
    timestamp: "2 days ago",
    thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=450&fit=crop",
    channelAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
    duration: "15:42",
    subscribers: "1.2M subscribers",
    description: "In this comprehensive tutorial, we'll build a modern web application using Next.js 15. Learn the latest features, best practices, and how to create production-ready applications.\n\n🔥 What you'll learn:\n• Next.js 15 fundamentals\n• Server Components and Client Components\n• App Router best practices\n• API routes and data fetching\n• Deployment strategies\n\n🚀 Level up your web development skills with this hands-on project!",
    likes: "12K",
    dislikes: "234"
  },
  2: {
    id: 2,
    title: "The Ultimate React Course 2024 - From Beginner to Pro",
    channel: "CodeMaster",
    views: "1.2M views",
    timestamp: "1 week ago",
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop",
    channelAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
    duration: "45:18",
    subscribers: "3.5M subscribers",
    description: "Master React from scratch! This complete course covers everything from basic concepts to advanced patterns. Perfect for beginners who want to become professional React developers.\n\n📚 Course Outline:\n• React fundamentals\n• Hooks and state management\n• Context API\n• Performance optimization\n• Testing strategies\n• Real-world projects",
    likes: "45K",
    dislikes: "892"
  }
}

const mockComments = [
  {
    id: 1,
    author: "Sarah Johnson",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face",
    timestamp: "2 hours ago",
    content: "This is exactly what I was looking for! The explanation is clear and the examples are practical. Thank you for sharing your knowledge!",
    likes: 234
  },
  {
    id: 2,
    author: "Mike Chen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
    timestamp: "5 hours ago",
    content: "Great tutorial! I've been struggling with Next.js 15 but this video made everything click. The step-by-step approach really helps.",
    likes: 156
  },
  {
    id: 3,
    author: "Emily Davis",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face",
    timestamp: "1 day ago",
    content: "Can you make a follow-up video on deployment strategies? I'd love to see how to deploy this to production with Vercel.",
    likes: 89
  }
]

export default function WatchPage() {
  const params = useParams()
  const router = useRouter()
  const videoId = params.videoId as string
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isDisliked, setIsDisliked] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  
  const video = mockVideoDetails[videoId as keyof typeof mockVideoDetails] || mockVideoDetails[1]

  const handleBack = () => {
    router.push('/')
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-md mx-auto relative">
      {/* Side Menu */}
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      
      {/* User Profile Menu */}
      <UserProfileMenu isOpen={isProfileMenuOpen} onClose={() => setIsProfileMenuOpen(false)} />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={handleBack}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          
          <div className="flex-1">
            <div className="font-semibold text-sm">Watching</div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="shrink-0" onClick={toggleMenu}>
              <Menu className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Download className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="shrink-0">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
            <Avatar className="h-8 w-8 cursor-pointer" onClick={toggleProfileMenu}>
              <AvatarImage src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=32&h=32&fit=crop&crop=face" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Video Player */}
      <div className="relative bg-black">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <img
            src={video.thumbnail}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="w-16 h-16 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-l-[20px] border-l-black border-y-[12px] border-y-transparent ml-1"></div>
            </div>
          </div>
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
            {video.duration}
          </div>
        </div>
        
        {/* Video Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <div className="mb-2">
            <div className="bg-gray-600 h-1 rounded-full">
              <div className="bg-red-600 h-1 rounded-full w-1/3"></div>
            </div>
            <div className="flex justify-between text-xs text-white mt-1">
              <span>5:14</span>
              <span>{video.duration}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className="flex-1 overflow-y-auto pb-16">
        <div className="p-4">
          {/* Title */}
          <h1 className="font-semibold text-base mb-2 leading-tight">
            {video.title}
          </h1>
          
          <div className="flex items-center justify-between mb-4">
            <div className="text-muted-foreground text-sm">
              {video.views} • {video.timestamp}
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`text-xs px-2 ${isLiked ? 'text-blue-500' : 'text-muted-foreground'}`}
                onClick={() => {
                  setIsLiked(!isLiked)
                  if (isDisliked) setIsDisliked(false)
                }}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                {video.likes}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`text-xs px-2 ${isDisliked ? 'text-blue-500' : 'text-muted-foreground'}`}
                onClick={() => {
                  setIsDisliked(!isDisliked)
                  if (isLiked) setIsLiked(false)
                }}
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
              </Button>
              <Button variant="ghost" size="sm" className="text-xs px-2 text-muted-foreground">
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
              <Button variant="ghost" size="sm" className="text-xs px-2 text-muted-foreground">
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>

          <Separator className="mb-4" />

          {/* Channel Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={video.channelAvatar} />
                <AvatarFallback>C</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-sm">{video.channel}</div>
                <div className="text-muted-foreground text-xs">{video.subscribers}</div>
              </div>
            </div>
            <Button 
              variant={isSubscribed ? "secondary" : "default"}
              size="sm"
              className={isSubscribed ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" : "bg-red-600 hover:bg-red-700 text-white"}
              onClick={() => setIsSubscribed(!isSubscribed)}
            >
              {isSubscribed ? "Subscribed" : "Subscribe"}
            </Button>
          </div>

          {/* Description */}
          <div className="bg-muted/50 rounded-lg p-3 mb-4">
            <div className="text-sm whitespace-pre-line">
              {video.description}
            </div>
          </div>

          <Separator className="mb-4" />

          {/* Comments */}
          <div className="mb-4">
            <h3 className="font-medium text-base mb-3">
              {mockComments.length} Comments
            </h3>
            
            {mockComments.map((comment) => (
              <div key={comment.id} className="mb-4">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.avatar} />
                    <AvatarFallback className="text-xs">U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{comment.author}</span>
                      <span className="text-muted-foreground text-xs">{comment.timestamp}</span>
                    </div>
                    <div className="text-sm mb-2">{comment.content}</div>
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground px-0">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        {comment.likes}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground px-0">
                        <ThumbsDown className="h-3 w-3 mr-1" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground px-0">
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator className="mb-4" />

          {/* Related Videos */}
          <div>
            <h3 className="font-medium text-base mb-3">Related Videos</h3>
            <div className="space-y-1">
              <RelatedVideoCard videoIndex={1} />
              <RelatedVideoCard videoIndex={2} />
              <RelatedVideoCard videoIndex={3} />
              <RelatedVideoCard videoIndex={4} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}