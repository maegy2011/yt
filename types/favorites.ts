// Enhanced types for advanced favorites features

export interface FavoriteChannel {
  id: string
  channelId: string
  name: string
  thumbnail?: string
  subscriberCount?: number
  videoCount?: number
  viewCount?: number
  addedAt: string
  updatedAt: string
  isFavorite?: boolean
}

export interface FavoriteVideo {
  id: string
  videoId: string
  title: string
  channelName: string
  thumbnail: string | undefined
  duration: string | undefined
  viewCount: string | number | undefined  // Accept both string and number
  addedAt: string
  updatedAt: string
  // Optional properties that may not be in database
  isPrivate?: boolean
  tags?: string[]
  category?: string
  rating?: number
  notes?: string
  watchProgress?: number
}

export interface CreateFavoriteRequest {
  videoId: string
  title: string
  channelName: string
  thumbnail?: string
  duration?: string
  viewCount?: number
  isPrivate?: boolean
  tags?: string[]
  category?: string
  rating?: number
  notes?: string
}

export interface UpdateFavoriteRequest {
  isPrivate?: boolean
  tags?: string[]
  category?: string
  rating?: number
  notes?: string
  watchProgress?: number
}

export interface FavoriteFilters {
  searchQuery?: string
  channelName?: string
  isPrivate?: boolean
  tags?: string[]
  category?: string
  rating?: number
  dateRange?: {
    start: string
    end: string
  }
  durationRange?: {
    min: number
    max: number
  }
}

export interface FavoriteSortOptions {
  field: 'addedAt' | 'updatedAt' | 'title' | 'viewCount' | 'rating' | 'watchProgress' | 'duration'
  direction: 'asc' | 'desc'
}

export interface FavoritesState {
  favorites: FavoriteVideo[]
  loading: boolean
  error: string | null
  filters: FavoriteFilters
  sort: FavoriteSortOptions
  enabled: boolean
  paused: boolean
  viewMode: 'grid' | 'list' | 'compact'
  displaySettings: {
    showThumbnails: boolean
    showDuration: boolean
    showViewCount: boolean
    showRating: boolean
    showWatchProgress: boolean
    compactMode: boolean
  }
}

export interface FavoriteOperations {
  addFavorite: (data: CreateFavoriteRequest) => Promise<FavoriteVideo>
  removeFavorite: (videoId: string) => Promise<void>
  fetchFavorites: (filters?: FavoriteFilters) => Promise<FavoriteVideo[]>
  isFavorite: (videoId: string) => Promise<boolean>
  toggleFavorite: (videoData: CreateFavoriteRequest) => Promise<void>
  toggleEnabled: (enabled: boolean) => void
  togglePaused: (paused: boolean) => void
  updateFavorite: (videoId: string, data: UpdateFavoriteRequest) => Promise<FavoriteVideo>
  batchUpdateFavorites: (updates: Array<{ videoId: string; data: UpdateFavoriteRequest }>) => Promise<FavoriteVideo[]>
  batchDeleteFavorites: (videoIds: string[]) => Promise<void>
  exportFavorites: (format: 'json' | 'csv' | 'txt') => Promise<string>
  importFavorites: (data: string) => Promise<FavoriteVideo[]>
}

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