'use client'

import { useCallback } from 'react'
import { FavoriteList } from './FavoriteList'
import { FavoriteVideo } from '@/types/favorites'
import { useFavorites } from '@/hooks/useFavorites'
import { IncognitoWrapper } from '@/components/incognito-wrapper-enhanced'

interface FavoritesContainerProps {
  className?: string
  onVideoPlay?: (video: FavoriteVideo) => void
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
      console.error('Failed to remove favorite:', error)
    }
  }, [removeFavorite])

  const handlePlay = useCallback((favorite: FavoriteVideo) => {
    // Convert FavoriteVideo to Video format for the main app
    const video = {
      videoId: favorite.videoId,
      id: favorite.videoId, // Also set id for compatibility
      title: favorite.title,
      channelName: favorite.channelName,
      thumbnail: favorite.thumbnail,
      duration: favorite.duration,
      viewCount: favorite.viewCount,
      publishedAt: null, // Favorite videos don't have publishedAt
      description: ''
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
      console.error('Failed to refresh favorites:', error)
    }
  }, [fetchFavorites])

  const getContainerClasses = () => {
    const baseClasses = 'w-full h-full'
    return `${baseClasses} ${className}`
  }

  return (
    <IncognitoWrapper feature="favorites" className={getContainerClasses()}>
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
    </IncognitoWrapper>
  )
}