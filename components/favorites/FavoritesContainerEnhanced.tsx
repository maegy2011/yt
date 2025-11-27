'use client'

import { useCallback } from 'react'
import { FavoriteList } from './FavoriteList'
import { FavoriteVideo } from '@/types/favorites'
import { useFavorites } from '@/hooks/useFavorites'
import { IncognitoWrapper } from '@/components/incognito-wrapper-enhanced'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useAsyncOperation } from '@/hooks/useAsyncOperation'
import { FavoritesListSkeleton } from '@/components/ui/skeleton-components'

interface FavoritesContainerProps {
  className?: string
  onVideoPlay?: (video: FavoriteVideo) => void
}

export function FavoritesContainerEnhanced({ className = '', onVideoPlay }: FavoritesContainerProps) {
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

  // Async operations with loading states
  const removeOperation = useAsyncOperation({
    showToast: true,
    successMessage: 'Removed from favorites',
    errorMessage: 'Failed to remove from favorites'
  })
  
  const refreshOperation = useAsyncOperation({
    showToast: true,
    successMessage: 'Favorites refreshed',
    errorMessage: 'Failed to refresh favorites'
  })
  
  const toggleEnabledOperation = useAsyncOperation({
    showToast: false,
    errorMessage: 'Failed to toggle favorites'
  })
  
  const togglePausedOperation = useAsyncOperation({
    showToast: false,
    errorMessage: 'Failed to pause/resume favorites'
  })

  const handleRemove = useCallback(async (videoId: string) => {
    try {
      await removeOperation.execute(async () => {
        await removeFavorite(videoId)
      })
    } catch (error) {
      console.error('Failed to remove favorite:', error)
    }
  }, [removeFavorite, removeOperation])

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
      await refreshOperation.execute(async () => {
        await fetchFavorites()
      })
    } catch (error) {
      console.error('Failed to refresh favorites:', error)
    }
  }, [fetchFavorites, refreshOperation])

  const handleToggleEnabled = useCallback(async () => {
    try {
      await toggleEnabledOperation.execute(async () => {
        toggleEnabled()
      })
    } catch (error) {
      console.error('Failed to toggle enabled:', error)
    }
  }, [toggleEnabled, toggleEnabledOperation])

  const handleTogglePaused = useCallback(async () => {
    try {
      await togglePausedOperation.execute(async () => {
        togglePaused()
      })
    } catch (error) {
      console.error('Failed to toggle paused:', error)
    }
  }, [togglePaused, togglePausedOperation])

  const getContainerClasses = () => {
    const baseClasses = 'w-full h-full'
    return `${baseClasses} ${className}`
  }

  // Show loading skeleton while initially loading
  if (loading && favorites.length === 0) {
    return (
      <div className={getContainerClasses()}>
        <FavoritesListSkeleton count={6} />
      </div>
    )
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('FavoritesContainer error:', error, errorInfo)
      }}
    >
      <IncognitoWrapper feature="favorites" className={getContainerClasses()}>
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-sm text-destructive hover:text-destructive/80 underline"
              disabled={refreshOperation.loading}
            >
              {refreshOperation.loading ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        )}

        {/* Favorites List */}
        <FavoriteList
          favorites={favorites}
          loading={loading || removeOperation.loading || refreshOperation.loading}
          onRemove={handleRemove}
          onPlay={handlePlay}
          onRefresh={handleRefresh}
          onToggleEnabled={handleToggleEnabled}
          onTogglePaused={handleTogglePaused}
          enabled={enabled}
          paused={paused}
        />
      </IncognitoWrapper>
    </ErrorBoundary>
  )
}