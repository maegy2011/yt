// YouTube API types and interfaces

export interface YouTubeThumbnail {
  url: string
  width: number
  height: number
}

export interface YouTubeThumbnails {
  thumbnails?: YouTubeThumbnail[]
  best?: string
  [key: string]: any
}

export interface YouTubeChannel {
  id: string
  name: string
  description?: string
  thumbnails?: YouTubeThumbnails
  thumbnail?: string
  subscriberCount?: string | number
  videoCount?: string | number
  viewCount?: string | number
  handle?: string
  url?: string
}

export interface YouTubeVideo {
  id: string
  title: string
  description?: string
  thumbnails?: YouTubeThumbnails
  thumbnail?: string
  duration?: string | number
  viewCount?: string | number
  publishedAt?: string
  uploadDate?: string
  isLive?: boolean
  channel?: YouTubeChannel
}

export interface YouTubePlaylist {
  id: string
  title: string
  description?: string
  thumbnails?: YouTubeThumbnails
  thumbnail?: string
  videoCount?: number
  viewCount?: string | number
  lastUpdatedAt?: string
  channel?: YouTubeChannel
}

export interface YouTubeSearchResult {
  id: string
  title: string
  description?: string
  thumbnails?: YouTubeThumbnails
  thumbnail?: string
  duration?: string | number
  viewCount?: string | number
  publishedAt?: string
  uploadDate?: string
  isLive?: boolean
  videoCount?: number
  type: 'video' | 'playlist' | 'channel'
  channel?: YouTubeChannel
  subscriberCount?: string | number
  isFavorite?: boolean
  stats?: any
}

export interface YouTubeSearchResponse {
  items: YouTubeSearchResult[]
  continuation?: string
  hasMore?: boolean
  query?: string
  page?: number
}

export interface YouTubeClientOptions {
  type?: 'video' | 'playlist' | 'channel' | 'all'
  continuation?: string
  limit?: number
}

export interface YouTubeClient {
  search(query: string, options?: YouTubeClientOptions): Promise<YouTubeSearchResponse>
}

// YouTubei module types
export interface YouTubeiModule {
  default: {
    Client: new () => YouTubeClient
  }
  Client: new () => YouTubeClient
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  status?: number
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  continuation?: string
}

// Error types
export interface ApiError {
  error: string
  code?: string
  details?: any
  timestamp: string
}

// Database operation types
export interface DatabaseOperationResult<T = any> {
  success: boolean
  data?: T
  error?: string
  affected?: number
}

// Bulk operation types
export interface BulkOperation<T = any> {
  id: string
  operation: 'create' | 'update' | 'delete'
  data?: T
}

export interface BulkOperationResult<T = any> {
  successful: BulkOperation<T>[]
  failed: Array<BulkOperation<T> & { error: string }>
  total: number
  successCount: number
  failureCount: number
}