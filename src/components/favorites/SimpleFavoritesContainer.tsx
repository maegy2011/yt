'use client'

import { useState, useEffect, useCallback } from 'react'
import { SimpleFavoritesList } from './SimpleFavoritesList'
import { FavoriteVideo } from '@/types/favorites-simple'

interface SimpleFavoritesContainerProps {
  className?: string
  onVideoPlay?: (video: FavoriteVideo) => void
}

export function SimpleFavoritesContainer({ 
  className = '', 
  onVideoPlay 
}: SimpleFavoritesContainerProps) {
  const [favorites, setFavorites] = useState<FavoriteVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch favorites from API
  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/favorites')
      if (!response.ok) {
        throw new Error(`Failed to fetch favorites: ${response.status}`)
      }
      const data = await response.json()
      
      // Convert to FavoriteVideo format
      const convertedFavorites: FavoriteVideo[] = data.map((fav: any) => ({
        id: fav.id,
        videoId: fav.videoId,
        title: fav.title,
        channelName: fav.channelName,
        thumbnail: fav.thumbnail,
        duration: fav.duration || null,
        viewCount: fav.viewCount ? parseInt(fav.viewCount) : undefined,
        addedAt: fav.addedAt,
        updatedAt: fav.updatedAt
      }))
      
      setFavorites(convertedFavorites)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch favorites')
      console.error('Error fetching favorites:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load favorites on mount
  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const handleRemove = async (videoId: string) => {
    try {
      const response = await fetch(`/api/favorites/${videoId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Remove from local state
        setFavorites(prev => prev.filter(fav => fav.videoId !== videoId))
      } else {
        throw new Error('Failed to remove favorite')
      }
    } catch (err) {
      console.error('Error removing favorite:', err)
      // Optionally show error toast here
    }
  }

  const handlePlay = (favorite: FavoriteVideo) => {
    // Convert to video format expected by main app
    const video = {
      videoId: favorite.videoId,
      id: favorite.videoId,
      title: favorite.title,
      channelName: favorite.channelName,
      thumbnail: favorite.thumbnail,
      duration: favorite.duration,
      viewCount: favorite.viewCount,
      publishedAt: null,
      addedAt: favorite.addedAt,
      updatedAt: favorite.updatedAt || new Date().toISOString(),
      description: ''
    }
    
    if (onVideoPlay) {
      onVideoPlay(video)
    }
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center text-red-500">
          <p>Error loading favorites: {error}</p>
          <button 
            onClick={fetchFavorites}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <SimpleFavoritesList
      favorites={favorites}
      loading={loading}
      onRemove={handleRemove}
      onPlay={handlePlay}
      className={className}
    />
  )
}