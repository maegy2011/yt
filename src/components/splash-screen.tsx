'use client'

import { useState, useEffect } from 'react'
import { Loader2, Play, FileText, Heart, Search, Youtube } from 'lucide-react'

interface SplashScreenProps {
  onComplete: () => void
}

const loadingMessages = [
  "Initializing MyTube...",
  "Loading your favorite videos...",
  "Connecting to YouTube...",
  "Preparing your watchlist...",
  "Loading video notes...",
  "Setting up preferences...",
  "Almost ready...",
  "Optimizing experience...",
  "Finalizing setup...",
  "Welcome to MyTube!"
]

const confirmationMessages = [
  "Videos loaded successfully!",
  "Notes synchronized!",
  "Favorites restored!",
  "Settings applied!",
  "Ready to explore!"
]

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Console statement removed
    
    // Simplified loading with fixed intervals
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        // Console statement removed
        if (prev >= loadingMessages.length - 1) {
          // Console statement removed
          clearInterval(messageInterval)
          setIsLoading(false)
          // Complete after a brief delay to show final message
          setTimeout(() => {
            // Console statement removed
            onComplete()
          }, 1000)
          return prev
        }
        return prev + 1
      })
    }, 800) // Slower, more reliable interval

    return () => {
      // Console statement removed
      clearInterval(messageInterval)
    }
  }, [onComplete])

  // Add a simple safety timeout
  useEffect(() => {
    // Console statement removed
    const safetyTimeout = setTimeout(() => {
      // Console statement removed
      onComplete()
    }, 8000) // 8 seconds max

    return () => {
      // Console statement removed
      clearTimeout(safetyTimeout)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-background via-card to-background flex items-center justify-center z-50 h-screen w-screen overflow-hidden">
      <div className="text-center space-y-6 max-w-sm mx-auto px-4">
        {/* Logo and Title */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-2xl">
              <Youtube className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">MyTube</h1>
          <p className="text-muted-foreground text-lg">Your Personal YouTube Experience</p>
        </div>

        {/* Loading Messages */}
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="w-6 h-6 text-foreground animate-spin" />
            <span className="text-foreground text-lg font-medium">
              {loadingMessages[currentMessageIndex]}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
              style={{ 
                width: `${((currentMessageIndex + 1) / loadingMessages.length) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Loading Dots */}
        <div className="flex justify-center space-x-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="w-2 h-2 bg-foreground rounded-full animate-pulse"
              style={{
                animationDelay: `${index * 150}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}