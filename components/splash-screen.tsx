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
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationIndex, setConfirmationIndex] = useState(0)

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        if (prev >= loadingMessages.length - 1) {
          clearInterval(messageInterval)
          setIsLoading(false)
          setShowConfirmation(true)
          return prev
        }
        return prev + 1
      })
    }, 400)

    return () => clearInterval(messageInterval)
  }, [])

  useEffect(() => {
    if (showConfirmation) {
      const confirmationInterval = setInterval(() => {
        setConfirmationIndex((prev) => {
          if (prev >= confirmationMessages.length - 1) {
            clearInterval(confirmationInterval)
            setTimeout(() => {
              onComplete()
            }, 800)
            return prev
          }
          return prev + 1
        })
      }, 600)

      return () => clearInterval(confirmationInterval)
    }
  }, [showConfirmation, onComplete])

  // Add a safety timeout to prevent getting stuck
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      console.log('Splash screen safety timeout triggered')
      onComplete()
    }, 15000) // 15 seconds max

    return () => clearTimeout(safetyTimeout)
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-background via-card to-background flex items-center justify-center z-50 h-screen w-screen overflow-hidden">
      <div className="text-center space-y-6 sm:space-y-8 max-w-sm sm:max-w-md mx-auto px-4 sm:px-6 h-full flex flex-col justify-center py-8">
        {/* Logo and Title */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-2xl flex items-center justify-center shadow-2xl">
                <Youtube className="w-10 h-10 sm:w-12 sm:h-12 text-primary-foreground" />
              </div>
              <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full flex items-center justify-center">
                <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary-foreground" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">MyTube</h1>
          <p className="text-muted-foreground text-base sm:text-lg">Your Personal YouTube Experience</p>
        </div>

        {/* Loading Messages */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-center space-x-2 sm:space-x-3">
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-foreground animate-spin" />
                <span className="text-foreground text-base sm:text-lg font-medium animate-pulse">
                  {loadingMessages[currentMessageIndex]}
                </span>
              </>
            ) : (
              <span className="text-primary text-base sm:text-lg font-medium">
                {confirmationMessages[confirmationIndex]}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
              style={{ 
                width: isLoading 
                  ? `${((currentMessageIndex + 1) / loadingMessages.length) * 100}%`
                  : '100%' 
              }}
            />
          </div>
        </div>

        {/* Feature Icons */}
        <div className="flex justify-center space-x-4 sm:space-x-6">
          <div className={`flex flex-col items-center space-y-2 transition-all duration-500 ${
            currentMessageIndex >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Search</span>
          </div>
          <div className={`flex flex-col items-center space-y-2 transition-all duration-500 delay-100 ${
            currentMessageIndex >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Watch</span>
          </div>
          <div className={`flex flex-col items-center space-y-2 transition-all duration-500 delay-200 ${
            currentMessageIndex >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Notes</span>
          </div>
          <div className={`flex flex-col items-center space-y-2 transition-all duration-500 delay-300 ${
            currentMessageIndex >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Favorites</span>
          </div>
        </div>

        {/* Loading Dots */}
        <div className="flex justify-center space-x-1.5 sm:space-x-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 bg-foreground rounded-full transition-all duration-300 ${
                isLoading 
                  ? 'animate-pulse'
                  : 'bg-primary'
              }`}
              style={{
                animationDelay: `${index * 150}ms`,
                opacity: isLoading ? 0.6 : 1,
                transform: isLoading ? 'scale(1)' : 'scale(1.2)'
              }}
            />
          ))}
        </div>

        {/* Footer with YouTube Logo and Disclaimer */}
        <div className="absolute bottom-2 sm:bottom-4 left-0 right-0 text-center px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 text-muted-foreground text-xs">
            {/* YouTube Logo */}
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-primary rounded flex items-center justify-center">
                <Youtube className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-primary-foreground" />
              </div>
              <span className="text-muted-foreground">YouTube™</span>
            </div>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <span className="text-muted-foreground text-center">
              MyTube is not affiliated with YouTube or Google LLC
            </span>
          </div>
          <div className="mt-1 text-muted-foreground text-xs">
            YouTube is a trademark of Google LLC. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  )
}