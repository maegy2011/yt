'use client'

import { useState, useEffect } from 'react'
import { Loader2, Search, Download, Music, Play, Star, Zap, Wifi, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  progress?: number
  className?: string
}

interface LoadingMessage {
  text: string
  icon: React.ComponentType<any>
  duration: number
}

const loadingMessages: LoadingMessage[] = [
  { text: "Searching YouTube...", icon: Search, duration: 2000 },
  { text: "Fetching videos...", icon: Download, duration: 1500 },
  { text: "Loading content...", icon: Play, duration: 1800 },
  { text: "Processing results...", icon: RefreshCw, duration: 2200 },
  { text: "Almost there...", icon: Zap, duration: 1600 },
  { text: "Optimizing search...", icon: Star, duration: 1900 },
  { text: "Connecting to YouTube...", icon: Wifi, duration: 1700 },
  { text: "Preparing your videos...", icon: Music, duration: 2100 }
]

export function LoadingOverlay({ 
  isLoading, 
  message: customMessage, 
  progress,
  className 
}: LoadingOverlayProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true)
      setCurrentMessageIndex(0)
    } else {
      // Fade out animation
      const timer = setTimeout(() => setIsVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  useEffect(() => {
    if (!isLoading) return

    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % loadingMessages.length)
    }, loadingMessages[currentMessageIndex]?.duration || 2000)

    return () => clearInterval(messageInterval)
  }, [isLoading, currentMessageIndex])

  const currentMessage = loadingMessages[currentMessageIndex]
  const CurrentIcon = currentMessage?.icon || Loader2
  const displayMessage = customMessage || currentMessage?.text || "Loading..."

  if (!isVisible) return null

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300",
      isLoading ? "opacity-100" : "opacity-0 pointer-events-none",
      className
    )}>
      <div className="bg-background border rounded-lg shadow-xl p-8 max-w-md mx-4 transform transition-all duration-300 scale-100">
        {/* Main Content */}
        <div className="flex flex-col items-center space-y-6">
          {/* Animated Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg animate-pulse"></div>
            <div className="relative bg-primary/10 rounded-full p-4">
              <CurrentIcon className="h-8 w-8 text-primary animate-spin" />
            </div>
          </div>

          {/* Message */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {displayMessage}
            </h3>
            {progress !== undefined && (
              <p className="text-sm text-muted-foreground">
                {progress}% complete
              </p>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full space-y-2">
            {progress !== undefined ? (
              <div className="bg-secondary rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            ) : (
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-primary/40 rounded-full h-2 w-2 animate-bounce"
                    style={{ 
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '1s'
                    }}
                  ></div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="text-xs text-muted-foreground text-center">
            {customMessage ? (
              <p>This may take a few moments...</p>
            ) : (
              <p>Finding the best videos for you</p>
            )}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary/30 rounded-full animate-ping"></div>
        <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-primary/40 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
      </div>
    </div>
  )
}

// Simplified version for inline use
export function InlineLoading({ 
  message = "Loading...", 
  className 
}: { 
  message?: string 
  className?: string 
}) {
  return (
    <div className={cn("flex items-center space-x-2 text-muted-foreground", className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">{message}</span>
    </div>
  )
}

// Loading skeleton for video cards
export function VideoCardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border rounded-lg overflow-hidden animate-pulse">
          <div className="aspect-video bg-secondary"></div>
          <div className="p-4 space-y-3">
            <div className="h-4 bg-secondary rounded w-3/4"></div>
            <div className="h-3 bg-secondary rounded w-1/2"></div>
            <div className="flex justify-between">
              <div className="h-3 bg-secondary rounded w-1/4"></div>
              <div className="h-3 bg-secondary rounded w-1/6"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}