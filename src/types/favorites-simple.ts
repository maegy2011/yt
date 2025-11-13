// Simplified favorites types

export interface FavoriteVideo {
  id: string
  videoId: string
  title: string
  channelName: string
  thumbnail?: string
  duration?: string
  viewCount?: number
  addedAt: string
}

export interface CreateFavoriteRequest {
  videoId: string
  title: string
  channelName: string
  thumbnail?: string
  duration?: string
  viewCount?: number
}

export interface FavoritesState {
  favorites: FavoriteVideo[]
  loading: boolean
  error: string | null
}

export interface FavoriteStats {
  total: number
  uniqueChannels: number
  totalViews: number
}