'use client'

import { useState, useEffect } from 'react'

interface FavoriteVideo {
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

const STORAGE_KEY = 'youtube-platform-favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteVideo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        // Validate stored data before parsing
        if (typeof stored !== 'string') {
          throw new Error('Invalid stored data type')
        }
        
        // Basic validation - check if it looks like JSON
        if (!stored.trim().startsWith('[') || !stored.trim().endsWith(']')) {
          throw new Error('Invalid JSON format')
        }
        
        const parsed = JSON.parse(stored)
        
        // Validate that it's an array
        if (!Array.isArray(parsed)) {
          throw new Error('Favorites data is not an array')
        }
        
        // Validate and clean up favorites
        const validFavorites = parsed.filter((fav: any) => {
          // Check required fields
          if (!fav || typeof fav !== 'object') return false
          if (!fav.id || typeof fav.id !== 'string') return false
          if (!fav.title || typeof fav.title !== 'string') return false
          if (!fav.thumbnail || typeof fav.thumbnail !== 'string') return false
          if (!fav.channelName || typeof fav.channelName !== 'string') return false
          
          // Sanitize and validate fields
          fav.id = String(fav.id).replace(/[<>\"']/g, '').substring(0, 50).trim()
          fav.title = String(fav.title).replace(/[<>\"']/g, '').substring(0, 200).trim()
          fav.thumbnail = String(fav.thumbnail).substring(0, 500).trim()
          fav.channelName = String(fav.channelName).replace(/[<>\"']/g, '').substring(0, 100).trim()
          
          // Validate URL format for thumbnail
          try {
            if (fav.thumbnail && !fav.thumbnail.startsWith('http')) {
              return false
            }
          } catch {
            return false
          }
          
          return true
        })
        
        setFavorites(validFavorites)
      }
    } catch (error) {
      console.error('Error loading favorites:', error)
      // Clear corrupted data
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch (clearError) {
        console.error('Error clearing corrupted favorites:', clearError)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
      } catch (error) {
        console.error('Error saving favorites:', error)
      }
    }
  }, [favorites, isLoading])

  const addFavorite = (video: any) => {
    setFavorites(prev => {
      // Validate input
      if (!video || typeof video !== 'object') return prev
      if (!video.id || !video.title || !video.thumbnail || !video.channelName) return prev
      
      // Check if already exists
      const exists = prev.some(fav => fav.id === video.id)
      if (exists) {
        return prev
      }
      
      // Sanitize input data
      const sanitizedVideo = {
        id: String(video.id).replace(/[<>\"']/g, '').substring(0, 50).trim(),
        title: String(video.title).replace(/[<>\"']/g, '').substring(0, 200).trim(),
        thumbnail: String(video.thumbnail).substring(0, 500).trim(),
        channelName: String(video.channelName).replace(/[<>\"']/g, '').substring(0, 100).trim(),
        channelLogo: video.channelLogo ? String(video.channelLogo).substring(0, 500).trim() : undefined,
        publishedAt: video.publishedAt || new Date().toISOString(),
        duration: video.duration ? String(video.duration).substring(0, 20).trim() : undefined,
        viewCount: video.viewCount ? String(video.viewCount).substring(0, 20).trim() : undefined,
        addedAt: new Date().toISOString()
      }
      
      // Validate thumbnail URL
      try {
        if (sanitizedVideo.thumbnail && !sanitizedVideo.thumbnail.startsWith('http')) {
          return prev
        }
      } catch {
        return prev
      }
      
      // Add to beginning of array
      return [sanitizedVideo, ...prev]
    })
  }

  const removeFavorite = (videoId: string) => {
    setFavorites(prev => prev.filter(fav => fav.id !== videoId))
  }

  const toggleFavorite = (video: any) => {
    setFavorites(prev => {
      // Validate input
      if (!video || typeof video !== 'object') return prev
      if (!video.id || !video.title || !video.thumbnail || !video.channelName) return prev
      
      const exists = prev.some(fav => fav.id === video.id)
      if (exists) {
        return prev.filter(fav => fav.id !== video.id)
      } else {
        // Sanitize input data
        const sanitizedVideo = {
          id: String(video.id).replace(/[<>\"']/g, '').substring(0, 50).trim(),
          title: String(video.title).replace(/[<>\"']/g, '').substring(0, 200).trim(),
          thumbnail: String(video.thumbnail).substring(0, 500).trim(),
          channelName: String(video.channelName).replace(/[<>\"']/g, '').substring(0, 100).trim(),
          channelLogo: video.channelLogo ? String(video.channelLogo).substring(0, 500).trim() : undefined,
          publishedAt: video.publishedAt || new Date().toISOString(),
          duration: video.duration ? String(video.duration).substring(0, 20).trim() : undefined,
          viewCount: video.viewCount ? String(video.viewCount).substring(0, 20).trim() : undefined,
          addedAt: new Date().toISOString()
        }
        
        // Validate thumbnail URL
        try {
          if (sanitizedVideo.thumbnail && !sanitizedVideo.thumbnail.startsWith('http')) {
            return prev
          }
        } catch {
          return prev
        }
        
        return [sanitizedVideo, ...prev]
      }
    })
  }

  const isFavorite = (videoId: string) => {
    return favorites.some(fav => fav.id === videoId)
  }

  const clearFavorites = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setFavorites([])
    } catch (error) {
      console.error('Error clearing favorites:', error)
    }
  }

  const getFavoriteCount = () => {
    return favorites.length
  }

  const getRecentFavorites = (limit: number = 10) => {
    return favorites.slice(0, limit)
  }

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    getFavoriteCount,
    getRecentFavorites
  }
}