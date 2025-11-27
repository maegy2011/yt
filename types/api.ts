// API request and response types

export interface FavoriteVideoRequest {
  videoId: string
  title: string
  channelName: string
  thumbnail?: string
  duration?: string | number
  viewCount?: string | number
}

export interface FavoriteVideoResponse {
  id: string
  videoId: string
  title: string
  channelName: string
  thumbnail?: string
  duration?: string
  viewCount?: string
  addedAt: string
  updatedAt: string
}

export interface WatchedVideoRequest {
  videoId: string
  title: string
  channelName: string
  thumbnail?: string
  duration?: string | number
  viewCount?: string | number
}

export interface WatchedVideoResponse {
  id: string
  videoId: string
  title: string
  channelName: string
  thumbnail?: string
  duration?: string
  viewCount?: string
  watchedAt: string
  updatedAt: string
}

export interface VideoNoteRequest {
  videoId: string
  title: string
  note: string
  channelName?: string
  thumbnail?: string
  startTime?: number
  endTime?: number
  fontSize?: number
  isClip?: boolean
}

export interface VideoNoteResponse {
  id: string
  videoId: string
  title: string
  note: string
  channelName?: string
  thumbnail?: string
  startTime?: number
  endTime?: number
  fontSize: number
  isClip: boolean
  createdAt: string
  updatedAt: string
  notebookId?: string
}

export interface NotebookRequest {
  title: string
  description?: string
  color?: string
  isPublic?: boolean
  tags?: string
  category?: string
}

export interface NotebookResponse {
  id: string
  title: string
  description?: string
  color: string
  isPublic: boolean
  tags: string
  category: string
  thumbnail?: string
  createdAt: string
  updatedAt: string
}

export interface BlacklistItemRequest {
  itemId: string
  title: string
  type: 'video' | 'playlist' | 'channel'
  thumbnail?: string
  channelName?: string
}

export interface BlacklistItemResponse {
  id: string
  itemId: string
  title: string
  type: 'video' | 'playlist' | 'channel'
  thumbnail?: string
  channelName?: string
  addedAt: string
  updatedAt: string
  videoHash?: string
  channelHash?: string
  isChannelBlock: boolean
  priority: number
  batchId?: string
}

export interface WhitelistItemRequest {
  itemId: string
  title: string
  type: 'video' | 'playlist' | 'channel'
  thumbnail?: string
  channelName?: string
}

export interface WhitelistItemResponse {
  id: string
  itemId: string
  title: string
  type: 'video' | 'playlist' | 'channel'
  thumbnail?: string
  channelName?: string
  addedAt: string
  updatedAt: string
  videoHash?: string
  channelHash?: string
  isChannelWhitelist: boolean
  priority: number
  batchId?: string
}

export interface ChannelRequest {
  channelId: string
  name: string
  description?: string
  thumbnail?: string
  subscriberCount?: string | number
  videoCount?: string | number
  viewCount?: string | number
  handle?: string
}

export interface ChannelResponse {
  id: string
  channelId: string
  name: string
  description?: string
  thumbnail?: string
  subscriberCount?: string | number
  videoCount?: string | number
  viewCount?: string | number
  handle?: string
  addedAt: string
  updatedAt: string
  isFavorite?: boolean
}

export interface PlaybackPositionRequest {
  videoId: string
  title: string
  channelName: string
  thumbnail?: string
  duration: number
  currentTime?: number
}

export interface PlaybackPositionResponse {
  id: string
  videoId: string
  title: string
  channelName: string
  thumbnail?: string
  duration: number
  currentTime: number
  lastWatched: string
  updatedAt: string
}

export interface BatchOperationRequest<T = any> {
  operation: 'create' | 'update' | 'delete'
  items: T[]
}

export interface BatchOperationResponse<T = any> {
  successful: T[]
  failed: Array<{
    item: T
    error: string
  }>
  total: number
  successCount: number
  failureCount: number
}

export interface SearchChannelsRequest {
  query: string
  limit?: number
  offset?: number
}

export interface SearchChannelsResponse {
  items: ChannelResponse[]
  total: number
  hasMore: boolean
}

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  success?: boolean
}

export interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  continuation?: string
}

// Error response types
export interface ErrorResponse {
  error: string
  code?: string
  details?: any
  timestamp: string
}

export interface ValidationErrorResponse extends ErrorResponse {
  field?: string
  value?: any
}

// Success response types
export interface SuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

export interface CreatedResponse<T = any> extends SuccessResponse<T> {
  created: T
}

export interface UpdatedResponse<T = any> extends SuccessResponse<T> {
  updated: T
}

export interface DeletedResponse extends SuccessResponse {
  deleted: boolean
  count?: number
}

// Request body types for different endpoints
export interface RequestBodyMap {
  '/api/favorites': FavoriteVideoRequest
  '/api/watched': WatchedVideoRequest
  '/api/notes': VideoNoteRequest
  '/api/notebooks': NotebookRequest
  '/api/blacklist': BlacklistItemRequest
  '/api/whitelist': WhitelistItemRequest
  '/api/channels': ChannelRequest
  '/api/playback-position': PlaybackPositionRequest
}

// Response body types for different endpoints
export interface ResponseBodyMap {
  '/api/favorites': FavoriteVideoResponse[]
  '/api/watched': WatchedVideoResponse[]
  '/api/notes': VideoNoteResponse[]
  '/api/notebooks': NotebookResponse[]
  '/api/blacklist': BlacklistItemResponse[]
  '/api/whitelist': WhitelistItemResponse[]
  '/api/channels': ChannelResponse[]
  '/api/playback-position': PlaybackPositionResponse[]
}