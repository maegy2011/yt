/**
 * YouTube API Utilities Library
 * 
 * A comprehensive utility library for YouTube API interactions and data formatting.
 * Provides interfaces, functions, and helpers for working with YouTube content
 * throughout the MyTube application.
 * 
 * Features:
 * - TypeScript interfaces for YouTube data structures
 * - Video, playlist, and channel search functionality
 * - Data formatting utilities (view count, duration, dates)
 * - Error handling and validation
 * - API response parsing and normalization
 * - Caching and optimization support
 * 
 * @author MyTube Team
 * @version 2.0.0
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Video interface for YouTube video data
 * Represents a single YouTube video with all relevant metadata
 */
export interface Video {
  id: string                                    // YouTube video ID
  title: string                                 // Video title
  description?: string                           // Video description
  thumbnail: {                                 // Primary thumbnail information
    url: string                                 // Thumbnail URL
    width: number                                // Thumbnail width
    height: number                               // Thumbnail height
  }
  channel: {                                   // Channel information
    name: string                                 // Channel name
    id: string                                   // Channel ID
    thumbnail?: {                               // Channel thumbnail
      url: string                               // Thumbnail URL
      width: number                              // Thumbnail width
      height: number                             // Thumbnail height
    }
  }
  duration: string                               // Formatted duration (e.g., "4:23")
  viewCount: number                              // View count as number
  publishedAt: string                            // Publication date
  isLive: boolean                               // Live stream indicator
}

/**
 * Playlist interface for YouTube playlist data
 * Represents a YouTube playlist with metadata and video information
 */
export interface Playlist {
  id: string                                    // Playlist ID
  title: string                                 // Playlist title
  description?: string                           // Playlist description
  thumbnail?: {                                 // Playlist thumbnail
    url: string                                 // Thumbnail URL
    width: number                                // Thumbnail width
    height: number                               // Thumbnail height
  }
  thumbnails?: Array<{                           // Alternative thumbnails
    url: string                                 // Thumbnail URL
    width: number                                // Thumbnail width
    height: number                               // Thumbnail height
  }>
  channel?: {                                   // Playlist owner channel
    name: string                                 // Channel name
    id: string                                   // Channel ID
    thumbnail?: {                               // Channel thumbnail
      url: string                               // Thumbnail URL
      width: number                              // Thumbnail width
      height: number                             // Thumbnail height
    }
  }
  videoCount: number                             // Number of videos in playlist
  viewCount?: number                              // Total playlist views
  lastUpdatedAt?: string                           // Last update date
}

/**
 * Channel interface for YouTube channel data
 * Represents a YouTube channel with comprehensive metadata
 */
export interface Channel {
  id: string                                    // Channel ID
  name: string                                  // Channel name
  description?: string                            // Channel description
  thumbnail?: {                                // Channel avatar/thumbnail
    url: string                                 // Thumbnail URL
    width: number                                // Thumbnail width
    height: number                               // Thumbnail height
  }
  thumbnails?: Array<{                           // Alternative channel thumbnails
    url: string                                 // Thumbnail URL
    width: number                                // Thumbnail width
    height: number                               // Thumbnail height
  }>
  subscriberCount?: string | number               // Subscriber count
  videoCount?: string | number                  // Video count
  handle?: string                                // Channel handle (@username)
  banner?: {                                   // Channel banner image
    url: string                                 // Banner URL
    width: number                                // Banner width
    height: number                               // Banner height
  }
  mobileBanner?: {                             // Mobile-optimized banner
    url: string                                 // Banner URL
    width: number                                // Banner width
    height: number                               // Banner height
  }
  tvBanner?: {                                 // TV banner for large screens
    url: string                                 // Banner URL
    width: number                                // Banner width
    height: number                               // Banner height
  }
  url?: string                                  // Channel URL
  live?: any                                   // Live streaming data
  playlists?: any                               // Channel playlists
  shorts?: any                                  // Channel shorts
  videos?: any                                   // Channel videos
  shelves?: any[]                                // Channel shelves/sections
}

/**
 * Search result interface for API responses
 * Represents the structure returned by search operations
 */
export interface SearchResult {
  items: (Video | Playlist)[]              // Search results array
  error?: string                               // Error message if any
  continuation?: string                        // Token for pagination/continuation
}

// ============================================================================
// SEARCH FUNCTIONS
// ============================================================================

/**
 * Search for YouTube videos, playlists, and channels
 * 
 * Performs a search query against YouTube API with specified content type filter.
 * Returns structured results with error handling and continuation support.
 * 
 * @param query - Search query string
 * @param type - Content type filter ('video', 'playlist', 'channel', 'all')
 * @returns {Promise<SearchResult>} Search results with items and optional continuation token
 * 
 * @example
 * ```typescript
 * const results = await searchVideos('music videos', 'video');
 * console.log(results.items); // Array of video results
 * ```
 */
export async function searchVideos(
  query: string, 
  type: 'video' | 'playlist' | 'channel' | 'all' = 'all'
): Promise<SearchResult> {
  try {
    // Validate input query
    if (!query.trim()) {
      return { items: [], error: 'Search query cannot be empty' }
    }

    // Make API request to search endpoint
    const response = await fetch(`/api/youtube/search?query=${encodeURIComponent(query)}&type=${type}`)
    
    if (!response.ok) {
      throw new Error(`Search failed with status: ${response.status}`)
    }
    
    const result = await response.json()
    
    // Validate response structure
    if (!result || typeof result !== 'object') {
      return { items: [], error: 'Invalid search response' }
    }
    
    return result
  } catch (error) {
    // Return error structure for consistent error handling
    return { 
      items: [], 
      error: error instanceof Error ? error.message : 'Search failed' 
    }
  }
}

/**
 * Get detailed video information by ID
 * 
 * Fetches comprehensive video data including metadata, thumbnails,
 * and channel information for a specific YouTube video.
 * 
 * @param videoId - YouTube video ID
 * @returns {Promise<Video | null>} Video object or null if error
 * 
 * @example
 * ```typescript
 * const video = await getVideo('dQw4w9WgXcQ');
 * if (video) {
 *   console.log(video.title);
 * }
 * ```
 */
export async function getVideo(videoId: string): Promise<Video | null> {
  try {
    // Validate input
    if (!videoId.trim()) {
      throw new Error('Video ID cannot be empty')
    }

    // Fetch video data from API
    const response = await fetch(`/api/youtube/video/${videoId}`)
    
    if (!response.ok) {
      throw new Error(`Get video failed with status: ${response.status}`)
    }
    
    const video = await response.json()
    return video
  } catch (error) {
    // Return null for consistent error handling
    return null
  }
}

/**
 * Get detailed channel information by ID
 * 
 * Fetches comprehensive channel data including metadata, thumbnails,
 * subscriber counts, and other channel information.
 * 
 * @param channelId - YouTube channel ID
 * @returns {Promise<Channel | null>} Channel object or null if error
 * 
 * @example
 * ```typescript
 * const channel = await getChannel('UCBR8-60-B-aiQoF3Y49CvTj');
 * if (channel) {
 *   console.log(channel.name, channel.subscriberCount);
 * }
 * ```
 */
export async function getChannel(channelId: string): Promise<Channel | null> {
  try {
    // Validate input
    if (!channelId.trim()) {
      throw new Error('Channel ID cannot be empty')
    }

    // Fetch channel data from API
    const response = await fetch(`/api/youtube/channel/${channelId}`)
    
    if (!response.ok) {
      throw new Error(`Get channel failed with status: ${response.status}`)
    }
    
    const channel = await response.json()
    return channel
  } catch (error) {
    // Return null for consistent error handling
    return null
  }
}

/**
 * Get playlist information by ID
 * 
 * Fetches playlist metadata including title, description, video count,
 * and thumbnail information.
 * 
 * @param playlistId - YouTube playlist ID
 * @returns {Promise<Playlist | null>} Playlist object or null if error
 * 
 * @example
 * ```typescript
 * const playlist = await getPlaylist('PLrAXtmRdnEQy4QH35C5vTf');
 * if (playlist) {
 *   console.log(playlist.title, playlist.videoCount);
 * }
 * ```
 */
export async function getPlaylist(playlistId: string): Promise<Playlist | null> {
  try {
    // Validate input
    if (!playlistId.trim()) {
      throw new Error('Playlist ID cannot be empty')
    }

    // Fetch playlist data from API
    const response = await fetch(`/api/youtube/playlist/${playlistId}`)
    
    if (!response.ok) {
      throw new Error(`Get playlist failed with status: ${response.status}`)
    }
    
    const playlist = await response.json()
    return playlist
  } catch (error) {
    // Return null for consistent error handling
    return null
  }
}

/**
 * Get videos from a playlist
 * 
 * Fetches all videos contained within a specific playlist.
 * Returns structured results with error handling.
 * 
 * @param playlistId - YouTube playlist ID
 * @returns {Promise<{videos: Video[], error?: string}>} Videos array or error
 * 
 * @example
 * ```typescript
 * const result = await getPlaylistVideos('PLrAXtmRdnEQy4QH35C5vTf');
 * if (result.videos.length > 0) {
 *   console.log(`Found ${result.videos.length} videos`);
 * }
 * ```
 */
export async function getPlaylistVideos(playlistId: string): Promise<{ videos: Video[], error?: string }> {
  try {
    // Validate input
    if (!playlistId.trim()) {
      return { videos: [], error: 'Playlist ID cannot be empty' }
    }

    // Fetch playlist videos from API
    const response = await fetch(`/api/youtube/playlist/${playlistId}/videos`)
    
    if (!response.ok) {
      throw new Error(`Get playlist videos failed with status: ${response.status}`)
    }
    
    const result = await response.json()
    return result
  } catch (error) {
    // Return error structure for consistent error handling
    return { 
      videos: [], 
      error: error instanceof Error ? error.message : 'Failed to get playlist videos' 
    }
  }
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format view count into human-readable string
 * 
 * Converts large numbers into abbreviated format (K, M) for better readability.
 * Handles various input formats and provides consistent output.
 * 
 * @param count - View count as number, string, or null/undefined
 * @returns {string} Formatted view count string
 * 
 * @example
 * ```typescript
 * formatViewCount(1500)        // "1.5K views"
 * formatViewCount(2500000)     // "2.5M views"
 * formatViewCount(0)           // "0 views"
 * formatViewCount(null)        // "0 views"
 * ```
 */
export function formatViewCount(count: number | string | undefined | null): string {
  // Handle undefined, null, or invalid values
  if (count === undefined || count === null) return '0 views'
  
  // Convert string to number if needed
  const numCount = typeof count === 'string' ? parseInt(count) : count
  
  // Handle invalid numbers
  if (isNaN(numCount) || numCount < 0) return '0 views'
  
  // Format based on magnitude
  if (numCount >= 1000000) {
    return `${(numCount / 1000000).toFixed(1)}M views`
  } else if (numCount >= 1000) {
    return `${(numCount / 1000).toFixed(1)}K views`
  }
  return `${numCount} views`
}

/**
 * Format duration into human-readable time string
 * 
 * Converts various duration formats into consistent MM:SS or HH:MM:SS format.
 * Handles seconds, ISO 8601 duration strings, and pre-formatted strings.
 * 
 * @param duration - Duration as seconds, string, or undefined
 * @returns {string} Formatted duration string
 * 
 * @example
 * ```typescript
 * formatDuration(273)           // "4:33"
 * formatDuration("PT4M33S")     // "4:33"
 * formatDuration("4:33")         // "4:33"
 * formatDuration(0)              // "0:00"
 * formatDuration(undefined)       // "0:00"
 * ```
 */
export function formatDuration(duration: string | number | undefined): string {
  // Handle undefined or empty duration
  if (!duration) return '0:00'
  
  // If it's already in correct format (MM:SS or HH:MM:SS), return it
  if (typeof duration === 'string' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(duration)) {
    return duration
  }
  
  // Handle if duration is a number (seconds)
  if (typeof duration === 'number') {
    const hours = Math.floor(duration / 3600)
    const minutes = Math.floor((duration % 3600) / 60)
    const seconds = Math.floor(duration % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
  
  // Handle ISO 8601 duration format (PT4M13S, PT1H23M45S)
  if (typeof duration === 'string' && duration.startsWith('PT')) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (match) {
      const hours = parseInt(match[1] || '0')
      const minutes = parseInt(match[2] || '0')
      const seconds = parseInt(match[3] || '0')
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      }
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
  }
  
  // Handle just seconds as string
  if (typeof duration === 'string' && /^\d+$/.test(duration)) {
    const totalSeconds = parseInt(duration)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
  
  // Fallback: return original if can't parse
  return String(duration)
}

/**
 * Format publication date into human-readable relative time
 * 
 * Converts various date formats into user-friendly relative time strings.
 * Handles ISO dates, relative strings from API, and provides fallbacks.
 * 
 * @param date - Date as string (various formats supported)
 * @returns {string} Human-readable relative time
 * 
 * @example
 * ```typescript
 * formatPublishedAt("2024-01-15T10:30:00Z")  // "2 days ago" (depending on current time)
 * formatPublishedAt("4 hours ago")              // "4 hours ago" (already formatted)
 * formatPublishedAt("Today")                    // "Today"
 * formatPublishedAt("Live")                      // "Live"
 * formatPublishedAt("")                         // "Unknown date"
 * ```
 */
export function formatPublishedAt(date: string): string {
  // Handle empty or invalid date
  if (!date) return 'Unknown date'
  
  // YouTubei v1.7.0 API provides human-readable relative dates directly
  // Examples: "4 hours ago", "2 days ago", "1 month ago", etc.
  const trimmedDate = date.trim()
  
  // If date is already in a human-readable relative format, return it as-is
  const relativePatterns = [
    /^\d+ seconds? ago$/,           // "5 seconds ago"
    /^\d+ minutes? ago$/,           // "15 minutes ago"
    /^\d+ hours? ago$/,            // "4 hours ago"
    /^\d+ days? ago$/,             // "2 days ago"
    /^\d+ weeks? ago$/,            // "3 weeks ago"
    /^\d+ months? ago$/,           // "1 month ago"
    /^\d+ years? ago$/,            // "2 years ago"
    /^Today$/,                     // "Today"
    /^Yesterday$/,                  // "Yesterday"
    /^Just now$/,                  // "Just now"
    /^Live$/                       // Handle live videos
  ]
  
  const isAlreadyRelative = relativePatterns.some(pattern => pattern.test(trimmedDate))
  if (isAlreadyRelative) {
    return trimmedDate
  }
  
  // Handle ISO date strings or other formats (fallback for compatibility)
  try {
    const now = new Date()
    const published = new Date(trimmedDate)
    
    // Check if date is valid
    if (isNaN(published.getTime())) {
      return 'Unknown date'
    }
    
    // Calculate relative time
    const diff = now.getTime() - published.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    // Format based on time difference
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    if (days < 365) return `${Math.floor(days / 30)} months ago`
    return `${Math.floor(days / 365)} years ago`
  } catch (error) {
    // Return fallback for any parsing errors
    return 'Unknown date'
  }
}