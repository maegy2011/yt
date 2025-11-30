// Unified type definitions for YouTube app
// This file consolidates all type definitions to resolve conflicts

import type { Video as YouTubeVideo, Playlist as YouTubePlaylist } from '@/lib/youtube'

// ==================== BASE VIDEO TYPES ====================

export interface BaseVideoData {
  id: string
  videoId: string
  title: string
  channelName: string
  thumbnail: string
  duration?: string | number
  viewCount?: number | string
  publishedAt?: string | null
  isLive?: boolean
  description?: string
  type?: 'video'
  channel?: {
    name: string
    thumbnail?: string
    handle?: string
  }
  // Allow additional properties for flexibility
  [key: string]: any
}

export interface SimpleVideo extends BaseVideoData {
  id: string
  videoId: string
  title: string
  channelName: string
  thumbnail: string
  duration?: string | number
  viewCount?: number | string
  publishedAt?: string | null
  isLive?: boolean
  description?: string
  type?: 'video'
}

// ==================== FAVORITE TYPES ====================

export interface FavoriteVideo {
  id: string
  videoId: string
  title: string
  channelName: string
  thumbnail: string
  duration?: string | number
  viewCount?: string | number | undefined
  addedAt: string
  updatedAt: string
  // Optional properties that may not be in database
  isPrivate?: boolean
  tags?: string[]
  category?: string
  rating?: number
  notes?: string
  watchProgress?: number
  // Allow additional properties for flexibility
  [key: string]: any
}

export interface FavoriteChannel {
  id: string
  channelId: string
  name: string
  thumbnail?: string
  subscriberCount?: number | string
  videoCount?: number
  viewCount?: number
  addedAt: string
  updatedAt: string
  isFavorite?: boolean
  handle?: string
  // Allow additional properties for flexibility
  [key: string]: any
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

// ==================== PLAYLIST TYPES ====================

export interface SimplePlaylist {
  id: string
  playlistId: string
  title: string
  channelName: string
  thumbnail: string
  videoCount: number
  viewCount?: number
  lastUpdatedAt?: string
  description?: string
  type: 'playlist'
}

// ==================== CHANNEL TYPES ====================

export interface SimpleChannel {
  id: string
  channelId: string
  title: string
  name: string
  thumbnail: string
  subscriberCount?: string
  videoCount?: number
  viewCount?: number
  description?: string
  isFavorite?: boolean
  handle?: string
  type: 'channel'
}

export interface ChannelSearchResult {
  channelId: string
  name: string
  thumbnail?: string
  subscriberCount?: number
  videoCount?: number
  viewCount?: number
  description?: string
  url?: string
}

// ==================== NOTES TYPES ====================

export interface VideoNote {
  id: string
  videoId: string
  title: string
  channelName: string
  thumbnail?: string
  note: string
  fontSize: number // Required number, not optional
  startTime?: number
  endTime?: number
  isClip: boolean
  isPrivate?: boolean
  tags?: string[]
  color?: string
  priority?: 'low' | 'medium' | 'high'
  notebookId?: string
  linkType?: string
  createdAt: string
  updatedAt: string
  // Allow additional properties for flexibility
  [key: string]: any
}

export interface CreateNoteRequest {
  videoId: string
  title: string
  channelName: string
  thumbnail?: string
  note: string
  fontSize?: number
  startTime?: number
  endTime?: number
  isClip?: boolean
  isPrivate?: boolean
  tags?: string[]
  color?: string
  priority?: 'low' | 'medium' | 'high'
  notebookId?: string
}

export interface UpdateNoteRequest {
  note: string
  title?: string
  fontSize?: number
  isPrivate?: boolean
  tags?: string[]
  color?: string
  priority?: 'low' | 'medium' | 'high'
}

export interface NoteFilters {
  searchQuery?: string
  videoId?: string
  isClip?: boolean
  isPrivate?: boolean
  tags?: string[]
  color?: string
  priority?: 'low' | 'medium' | 'high'
  dateRange?: {
    start: string
    end: string
  }
}

export interface NoteSortOptions {
  field: 'createdAt' | 'updatedAt' | 'title' | 'startTime' | 'priority' | 'color'
  direction: 'asc' | 'desc'
}

export interface NotesState {
  notes: VideoNote[]
  loading: boolean
  error: string | null
  filters: NoteFilters
  sort: NoteSortOptions
  viewMode: 'grid' | 'list' | 'compact'
  displaySettings: {
    showThumbnails: boolean
    showTimestamps: boolean
    showTags: boolean
    showPriority: boolean
    compactMode: boolean
  }
}

export interface NoteOperations {
  createNote: (data: CreateNoteRequest) => Promise<VideoNote>
  updateNote: (id: string, data: UpdateNoteRequest) => Promise<VideoNote>
  deleteNote: (id: string) => Promise<void>
  fetchNotes: (filters?: NoteFilters) => Promise<VideoNote[]>
  searchNotes: (query: string) => Promise<VideoNote[]>
  batchDeleteNotes: (ids: string[]) => Promise<void>
  exportNotes: (format: 'json' | 'csv' | 'txt') => Promise<string>
  importNotes: (data: string) => Promise<VideoNote[]>
}

// ==================== NOTEBOOK TYPES ====================

export interface Notebook {
  id: string
  title: string
  description?: string
  color: string
  isPublic: boolean
  tags: string
  createdAt: string
  updatedAt: string
  thumbnail?: string
  notes?: VideoNote[]
  noteCount?: number
  category?: string
  pdfCount?: number // Added for compatibility
}

export interface CreateNotebookRequest {
  title: string
  description?: string
  color?: string
  isPublic?: boolean
  tags?: string
}

export interface UpdateNotebookRequest {
  title?: string
  description?: string
  color?: string
  isPublic?: boolean
  tags?: string
}

export interface NotebookOperations {
  createNotebook: (data: CreateNotebookRequest) => Promise<Notebook>
  updateNotebook: (id: string, data: UpdateNotebookRequest) => Promise<Notebook>
  deleteNotebook: (id: string) => Promise<void>
  fetchNotebooks: () => Promise<Notebook[]>
  fetchNotebook: (id: string) => Promise<Notebook | null>
  addNoteToNotebook: (notebookId: string, noteId: string) => Promise<void>
  removeNoteFromNotebook: (noteId: string) => Promise<void>
  getNotebookNotes: (notebookId: string) => Promise<VideoNote[]>
  batchAddNotesToNotebook: (notebookId: string, noteIds: string[]) => Promise<void> // Added for compatibility
}

// ==================== WATCHED HISTORY TYPES ====================

export interface WatchedVideo {
  id: string
  videoId: string
  title: string
  channelName: string
  thumbnail: string
  duration?: string
  viewCount?: string
  watchedAt: string
  updatedAt: string
}

export interface WatchedVideoInput {
  videoId: string
  title: string
  channelName: string
  thumbnail: string
  duration?: string
  viewCount?: string
}

export interface WatchedHistoryStats {
  totalVideos: number
  totalWatchTime: number
  averageVideoLength: number
  mostWatchedChannel: string
  videosThisWeek: number
  videosThisMonth: number
}

// ==================== PAGINATION TYPES ====================

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  hasPreviousPage: boolean
  totalItems: number
}

// ==================== FOLLOWED CHANNELS TYPES ====================

export interface FollowedChannelsContent {
  channels: FavoriteChannel[]
  videos: SimpleVideo[]
  playlists: SimplePlaylist[]
  stats: {
    totalVideos: number
    totalPlaylists: number
    totalChannels: number
    totalViews: number
  }
  pagination: {
    videos: PaginationInfo | null
    playlists: PaginationInfo | null
  }
}

// ==================== BLACKLIST/WHITELIST TYPES ====================

export interface BlacklistedItem {
  id: string
  itemId: string
  title: string
  type: 'video' | 'playlist' | 'channel'
  thumbnail?: string
  channelName?: string
  addedAt: string
  updatedAt?: string
  expiresAt?: string
  isChannelBlock?: boolean
  priority?: number
  batchId?: string
  categoryId?: string
  category?: BlacklistCategory
  // Allow additional properties for flexibility
  [key: string]: any
}

export interface WhitelistedItem {
  id: string
  itemId: string
  title: string
  type: 'video' | 'playlist' | 'channel'
  thumbnail?: string
  channelName?: string
  addedAt: string
  updatedAt?: string
  expiresAt?: string
  isChannelWhitelist?: boolean
  priority?: number
  batchId?: string
  // Allow additional properties for flexibility
  [key: string]: any
}

export interface BlacklistCategory {
  id: string
  name: string
  color: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ==================== VIDEO CARD TYPES ====================

export interface VideoCardData {
  videoId: string // Required
  id?: string
  title: string
  channelName: string
  channelHandle?: string
  channelThumbnail?: string
  thumbnail: string // Required
  duration?: string
  viewCount?: number
  publishedAt?: string
  description?: string
  quality?: string
  isLive?: boolean
  isUpcoming?: boolean
  subscriberCount?: string
  // Favorites specific
  addedAt?: string
  isFavorite?: boolean
  // Watched specific
  watchedAt?: string
  progress?: number
  // Note specific
  hasNotes?: boolean
  noteCount?: number
  // Database specific
  createdAt?: string
  updatedAt?: string
  // Allow additional properties for flexibility
  [key: string]: any
}

// ==================== CONVERSION FUNCTIONS ====================

// Convert YouTube API Video to SimpleVideo
export function convertYouTubeVideo(video: YouTubeVideo): SimpleVideo {
  return {
    id: video.id,
    videoId: video.id,
    title: video.title,
    channelName: video.channel.name,
    thumbnail: typeof video.thumbnail === 'string' 
      ? video.thumbnail 
      : video.thumbnail.url,
    duration: video.duration,
    viewCount: video.viewCount,
    publishedAt: video.publishedAt,
    isLive: video.isLive,
    description: video.description,
    type: 'video'
  }
}

// Convert SimpleVideo to YouTubeVideo (for compatibility)
export function convertToYouTubeVideo(video: SimpleVideo): YouTubeVideo {
  return {
    id: video.id,
    title: video.title,
    description: video.description || '',
    thumbnail: {
      url: video.thumbnail,
      width: 320,
      height: 180
    },
    channel: {
      name: video.channelName,
      id: video.channelName, // fallback
      thumbnail: {
        url: video.thumbnail,
        width: 320,
        height: 180
      }
    },
    duration: typeof video.duration === 'string' ? video.duration : '0:00',
    viewCount: typeof video.viewCount === 'number' ? video.viewCount : 0,
    publishedAt: video.publishedAt || new Date().toISOString(),
    isLive: video.isLive || false
  }
}

// Convert YouTube API Playlist to SimplePlaylist
export function convertYouTubePlaylist(playlist: YouTubePlaylist): SimplePlaylist {
  return {
    id: playlist.id,
    playlistId: playlist.id,
    title: playlist.title,
    channelName: playlist.channel?.name || 'Unknown Channel',
    thumbnail: typeof playlist.thumbnail === 'string' 
      ? playlist.thumbnail 
      : (playlist.thumbnail?.url || ''),
    videoCount: playlist.videoCount,
    viewCount: playlist.viewCount,
    lastUpdatedAt: playlist.lastUpdatedAt,
    description: playlist.description,
    type: 'playlist'
  }
}

// Convert channel data to SimpleChannel
export function convertYouTubeChannel(channel: any): SimpleChannel {
  return {
    id: channel.id || channel.channelId,
    channelId: channel.id || channel.channelId,
    title: channel.name || channel.title,
    name: channel.name || channel.title,
    thumbnail: channel.thumbnail?.url || channel.thumbnail || '',
    subscriberCount: channel.subscriberCount,
    videoCount: channel.videoCount,
    viewCount: channel.viewCount,
    description: channel.description,
    isFavorite: channel.isFavorite,
    handle: channel.handle,
    type: 'channel'
  }
}

// Convert database video to SimpleVideo
export function convertDbVideoToSimple(dbVideo: FavoriteVideo | any): SimpleVideo {
  return {
    id: dbVideo.id,
    videoId: dbVideo.videoId,
    title: dbVideo.title,
    channelName: dbVideo.channelName,
    thumbnail: dbVideo.thumbnail || '',
    duration: dbVideo.duration,
    viewCount: dbVideo.viewCount,
    publishedAt: 'addedAt' in dbVideo ? dbVideo.addedAt : new Date().toISOString(),
    isLive: false,
    type: 'video'
  }
}

// Convert SimpleVideo to VideoCardData
export function convertSimpleVideoToCardData(video: SimpleVideo): VideoCardData {
  return {
    videoId: video.videoId,
    id: video.id,
    title: video.title,
    channelName: video.channelName,
    thumbnail: video.thumbnail,
    duration: typeof video.duration === 'string' ? video.duration : undefined,
    viewCount: typeof video.viewCount === 'number' ? video.viewCount : undefined,
    publishedAt: video.publishedAt || undefined,
    description: video.description,
    isLive: video.isLive,
    type: video.type
  }
}

// Convert FavoriteVideo to VideoCardData
export function convertFavoriteVideoToCardData(video: FavoriteVideo): VideoCardData {
  return {
    videoId: video.videoId,
    id: video.id,
    title: video.title,
    channelName: video.channelName,
    thumbnail: video.thumbnail,
    duration: typeof video.duration === 'string' ? video.duration : undefined,
    viewCount: typeof video.viewCount === 'number' ? video.viewCount : undefined,
    addedAt: video.addedAt,
    updatedAt: video.updatedAt,
    isFavorite: true
  }
}

// Convert VideoCardData to SimpleVideo
export function convertCardDataToSimpleVideo(card: VideoCardData): SimpleVideo {
  return {
    id: card.id || card.videoId,
    videoId: card.videoId,
    title: card.title,
    channelName: card.channelName,
    thumbnail: card.thumbnail,
    duration: card.duration,
    viewCount: card.viewCount,
    publishedAt: card.publishedAt,
    isLive: card.isLive,
    description: card.description,
    type: 'video'
  }
}

// ==================== TYPE GUARDS ====================

export function isVideoCardData(obj: any): obj is VideoCardData {
  return obj && typeof obj === 'object' && 
         typeof obj.videoId === 'string' && 
         typeof obj.title === 'string' && 
         typeof obj.channelName === 'string' && 
         typeof obj.thumbnail === 'string'
}

export function isSimpleVideo(obj: any): obj is SimpleVideo {
  return obj && typeof obj === 'object' && 
         typeof obj.id === 'string' && 
         typeof obj.videoId === 'string' && 
         typeof obj.title === 'string' && 
         typeof obj.channelName === 'string' && 
         typeof obj.thumbnail === 'string'
}

export function isFavoriteVideo(obj: any): obj is FavoriteVideo {
  return obj && typeof obj === 'object' && 
         typeof obj.id === 'string' && 
         typeof obj.videoId === 'string' && 
         typeof obj.title === 'string' && 
         typeof obj.channelName === 'string' && 
         typeof obj.thumbnail === 'string' && 
         typeof obj.addedAt === 'string' && 
         typeof obj.updatedAt === 'string'
}

export function isVideoNote(obj: any): obj is VideoNote {
  return obj && typeof obj === 'object' && 
         typeof obj.id === 'string' && 
         typeof obj.videoId === 'string' && 
         typeof obj.title === 'string' && 
         typeof obj.channelName === 'string' && 
         typeof obj.note === 'string' && 
         typeof obj.fontSize === 'number' && 
         typeof obj.isClip === 'boolean'
}