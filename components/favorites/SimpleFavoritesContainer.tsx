'use client'

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
  // Mock data for now - in real app this would come from API/hook
  const mockFavorites: FavoriteVideo[] = [
    {
      id: '1',
      videoId: 'dQw4w9WgXcQ',
      title: 'Never Gonna Give You Up',
      channelName: 'Rick Astley',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      duration: '3:33',
      viewCount: 1500000000,
      addedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
    },
    {
      id: '2',
      videoId: '9bZkp7q19f0',
      title: 'Gangnam Style',
      channelName: 'PSY',
      thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/mqdefault.jpg',
      duration: '4:13',
      viewCount: 4800000000,
      addedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days ago
    }
  ]

  const loading = false

  const handleRemove = async (videoId: string) => {
    // In real app, this would call API to remove favorite
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
      description: ''
    }
    
    if (onVideoPlay) {
      onVideoPlay(video)
    }
  }

  return (
    <SimpleFavoritesList
      favorites={mockFavorites}
      loading={loading}
      onRemove={handleRemove}
      onPlay={handlePlay}
      className={className}
    />
  )
}