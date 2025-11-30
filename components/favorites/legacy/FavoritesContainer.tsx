'use client'

import { useCallback } from 'react'
import { FavoriteList } from './FavoriteList'
import { FavoriteVideo } from '@/types/favorites'
import { SimpleVideo } from '@/types'
import { useFavorites } from '@/hooks/useFavorites'

interface FavoritesContainerProps {
  className?: string
  onVideoPlay?: (video: SimpleVideo) => void
}

export function FavoritesContainer({ className = '', onVideoPlay }: FavoritesContainerProps) {
  const {
    favorites,
    loading,
    error,
    enabled,
    paused,
    removeFavorite,
    fetchFavorites,
    toggleEnabled,
    togglePaused
  } = useFavorites()

  const handleRemove = useCallback(async (videoId: string) => {
    try {
      await removeFavorite(videoId)
    } catch (error) {
      // Error handled by parent component
    }
  }, [removeFavorite])

  const handlePlay = useCallback((favorite: FavoriteVideo) => {
    // Convert FavoriteVideo to SimpleVideo format for the main app
    const video: SimpleVideo = {
      videoId: favorite.videoId,
      id: favorite.videoId, // Also set id for compatibility
      title: favorite.title,
      channelName: favorite.channelName,
      thumbnail: favorite.thumbnail,
      duration: favorite.duration,
      viewCount: favorite.viewCount,
      publishedAt: favorite.addedAt, // Use addedAt as publishedAt
      description: '',
      type: 'video'
    }
    
    // Call the parent's onVideoPlay function if provided
    if (onVideoPlay) {
      onVideoPlay(video)
    }
  }, [onVideoPlay])

  const handleRefresh = useCallback(async () => {
    try {
      await fetchFavorites()
    } catch (error) {
      // Error handled by parent component
    }
  }, [fetchFavorites])

  const getContainerClasses = () => {
    const baseClasses = 'w-full h-full'
    return `${baseClasses} ${className}`
  }

  return (
    <div className={getContainerClasses()}>
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Favorites List */}
      <FavoriteList
        favorites={favorites}
        loading={loading}
        onRemove={handleRemove}
        onPlay={handlePlay}
        onRefresh={handleRefresh}
        onToggleEnabled={toggleEnabled}
        onTogglePaused={togglePaused}
        enabled={enabled}
        paused={paused}
      />
    </div>
  )
}