// Enhanced types for advanced favorites features
// This file now re-exports from the unified type system

// Re-export all favorite-related types from the unified system
export type {
  FavoriteVideo,
  FavoriteChannel,
  CreateFavoriteRequest,
  UpdateFavoriteRequest,
  FavoriteFilters,
  FavoriteSortOptions,
  FavoritesState,
  FavoriteOperations
} from '@/types'

// Additional types specific to favorites features
export interface FavoriteStats {
  total: number
  privateFavorites: number
  publicFavorites: number
  averageRating: number
  totalWatchTime: number
  categoryStats: Record<string, number>
  tagStats: Record<string, number>
  ratingStats: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

export interface FavoriteCategory {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  favoriteIds: string[]
  createdAt: string
}

export interface FavoritePlaylist {
  id: string
  name: string
  description?: string
  isPrivate: boolean
  videoIds: string[]
  createdAt: string
  updatedAt: string
}

export interface WatchSession {
  id: string
  videoId: string
  startTime: string
  endTime?: string
  duration: number
  progress: number
  completed: boolean
  notes?: string
  rating?: number
}