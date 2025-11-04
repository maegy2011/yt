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

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center z-50">
      <div className="text-center space-y-8 max-w-md mx-auto px-6">
        {/* Logo and Title */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <Youtube className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Play className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white">MyTube</h1>
          <p className="text-gray-300 text-lg">Your Personal YouTube Experience</p>
        </div>

        {/* Loading Messages */}
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-3">
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 text-white animate-spin" />
                <span className="text-white text-lg font-medium animate-pulse">
                  {loadingMessages[currentMessageIndex]}
                </span>
              </>
            ) : (
              <span className="text-green-400 text-lg font-medium">
                {confirmationMessages[confirmationIndex]}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full transition-all duration-300 ease-out"
              style={{ 
                width: isLoading 
                  ? `${((currentMessageIndex + 1) / loadingMessages.length) * 100}%`
                  : '100%' 
              }}
            />
          </div>
        </div>

        {/* Feature Icons */}
        <div className="flex justify-center space-x-6">
          <div className={`flex flex-col items-center space-y-2 transition-all duration-500 ${
            currentMessageIndex >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Search className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-xs text-gray-400">Search</span>
          </div>
          <div className={`flex flex-col items-center space-y-2 transition-all duration-500 delay-100 ${
            currentMessageIndex >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6 text-red-400" />
            </div>
            <span className="text-xs text-gray-400">Watch</span>
          </div>
          <div className={`flex flex-col items-center space-y-2 transition-all duration-500 delay-200 ${
            currentMessageIndex >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-xs text-gray-400">Notes</span>
          </div>
          <div className={`flex flex-col items-center space-y-2 transition-all duration-500 delay-300 ${
            currentMessageIndex >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="w-12 h-12 bg-pink-600/20 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-pink-400" />
            </div>
            <span className="text-xs text-gray-400">Favorites</span>
          </div>
        </div>

        {/* Loading Dots */}
        <div className="flex justify-center space-x-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`w-2 h-2 bg-white rounded-full transition-all duration-300 ${
                isLoading 
                  ? 'animate-pulse'
                  : 'bg-green-400'
              }`}
              style={{
                animationDelay: `${index * 150}ms`,
                opacity: isLoading ? 0.6 : 1,
                transform: isLoading ? 'scale(1)' : 'scale(1.2)'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}