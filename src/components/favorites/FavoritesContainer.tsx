'use client'

import { useCallback } from 'react'
import { FavoriteList } from './FavoriteList'
import { FavoriteVideo } from '@/types/favorites'
import { useFavorites } from '@/hooks/useFavorites'
import { useBackgroundPlayer } from '@/contexts/background-player-context'

interface FavoritesContainerProps {
  className?: string
}

export function FavoritesContainer({ className = '' }: FavoritesContainerProps) {
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

  const {
    backgroundVideo,
    playBackgroundVideo
  } = useBackgroundPlayer()

  const handleRemove = useCallback(async (videoId: string) => {
    try {
      await removeFavorite(videoId)
    } catch (error) {
      console.error('Failed to remove favorite:', error)
    }
  }, [removeFavorite])

  const handlePlay = useCallback((favorite: FavoriteVideo) => {
    if (favorite.videoId === backgroundVideo?.videoId) {
      // If it's the same video, just play it
      playBackgroundVideo()
    } else {
      // If it's a different video, we'd need to load it first
      // For now, just show a message or handle accordingly
      console.log('Playing different video:', favorite.videoId)
    }
  }, [backgroundVideo, playBackgroundVideo])

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
        onToggleEnabled={toggleEnabled}
        onTogglePaused={togglePaused}
        enabled={enabled}
        paused={paused}
      />
    </div>
  )
}