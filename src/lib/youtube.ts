// Enhanced YouTube API utilities for frontend use
export interface Video {
  id: string
  title: string
  description?: string
  thumbnail: {
    url: string
    width: number
    height: number
  }
  channel: {
    name: string
    id: string
    thumbnail?: {
      url: string
      width: number
      height: number
    }
  }
  duration: string
  viewCount: number
  publishedAt: string
  isLive: boolean
}

export interface Playlist {
  id: string
  title: string
  description?: string
  thumbnail: {
    url: string
    width: number
    height: number
  }
  channel: {
    name: string
    id: string
    thumbnail?: {
      url: string
      width: number
      height: number
    }
  }
  videoCount: number
  viewCount: number
  lastUpdatedAt?: string
}

export interface Channel {
  id: string
  name: string
  description?: string
  thumbnail: {
    url: string
    width: number
    height: number
  }
  subscriberCount?: string | number
  videoCount?: string | number
  handle?: string
  banner?: {
    url: string
    width: number
    height: number
  }
  mobileBanner?: {
    url: string
    width: number
    height: number
  }
  tvBanner?: {
    url: string
    width: number
    height: number
  }
  url?: string
  live?: any
  playlists?: any
  shorts?: any
  videos?: any
  shelves?: any[]
}

export interface SearchResult {
  items: (Video | Playlist)[]
  error?: string
  continuation?: string
}

export async function searchVideos(query: string, type: 'video' | 'playlist' | 'channel' | 'all' = 'all'): Promise<SearchResult> {
  try {
    if (!query.trim()) {
      return { items: [], error: 'Search query cannot be empty' }
    }

    const response = await fetch(`/api/youtube/search?query=${encodeURIComponent(query)}&type=${type}`)
    
    if (!response.ok) {
      throw new Error(`Search failed with status: ${response.status}`)
    }
    
    const result = await response.json()
    
    // Validate the response structure
    if (!result || typeof result !== 'object') {
      return { items: [], error: 'Invalid search response' }
    }
    
    return result
  } catch (error) {
    console.error('Search error:', error)
    return { 
      items: [], 
      error: error instanceof Error ? error.message : 'Search failed' 
    }
  }
}

export async function getVideo(videoId: string): Promise<Video | null> {
  try {
    if (!videoId.trim()) {
      throw new Error('Video ID cannot be empty')
    }

    const response = await fetch(`/api/youtube/video/${videoId}`)
    
    if (!response.ok) {
      throw new Error(`Get video failed with status: ${response.status}`)
    }
    
    const video = await response.json()
    return video
  } catch (error) {
    console.error('Get video error:', error)
    return null
  }
}

export async function getChannel(channelId: string): Promise<Channel | null> {
  try {
    if (!channelId.trim()) {
      throw new Error('Channel ID cannot be empty')
    }

    const response = await fetch(`/api/youtube/channel/${channelId}`)
    
    if (!response.ok) {
      throw new Error(`Get channel failed with status: ${response.status}`)
    }
    
    const channel = await response.json()
    return channel
  } catch (error) {
    console.error('Get channel error:', error)
    return null
  }
}

export async function getPlaylist(playlistId: string): Promise<Playlist | null> {
  try {
    if (!playlistId.trim()) {
      throw new Error('Playlist ID cannot be empty')
    }

    const response = await fetch(`/api/youtube/playlist/${playlistId}`)
    
    if (!response.ok) {
      throw new Error(`Get playlist failed with status: ${response.status}`)
    }
    
    const playlist = await response.json()
    return playlist
  } catch (error) {
    console.error('Get playlist error:', error)
    return null
  }
}

export async function getPlaylistVideos(playlistId: string): Promise<{ videos: Video[], error?: string }> {
  try {
    if (!playlistId.trim()) {
      return { videos: [], error: 'Playlist ID cannot be empty' }
    }

    const response = await fetch(`/api/youtube/playlist/${playlistId}/videos`)
    
    if (!response.ok) {
      throw new Error(`Get playlist videos failed with status: ${response.status}`)
    }
    
    const result = await response.json()
    return result
  } catch (error) {
    console.error('Get playlist videos error:', error)
    return { 
      videos: [], 
      error: error instanceof Error ? error.message : 'Failed to get playlist videos' 
    }
  }
}

export function formatViewCount(count: number | string | undefined | null): string {
  if (count === undefined || count === null) return '0 views'
  
  const numCount = typeof count === 'string' ? parseInt(count) : count
  
  if (isNaN(numCount) || numCount < 0) return '0 views'
  
  if (numCount >= 1000000) {
    return `${(numCount / 1000000).toFixed(1)}M views`
  } else if (numCount >= 1000) {
    return `${(numCount / 1000).toFixed(1)}K views`
  }
  return `${numCount} views`
}

export function formatDuration(duration: string | number | undefined): string {
  if (!duration) return '0:00'
  
  // If it's already in the correct format (MM:SS or HH:MM:SS), return it
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

export function formatPublishedAt(date: string): string {
  if (!date) return 'Unknown date'
  
  // YouTubei v1.7.0 API provides human-readable relative dates directly
  // Examples: "4 hours ago", "2 days ago", "1 month ago", etc.
  const trimmedDate = date.trim()
  
  // If the date is already in a human-readable relative format, return it as-is
  const relativePatterns = [
    /^\d+ seconds? ago$/,
    /^\d+ minutes? ago$/,
    /^\d+ hours? ago$/,
    /^\d+ days? ago$/,
    /^\d+ weeks? ago$/,
    /^\d+ months? ago$/,
    /^\d+ years? ago$/,
    /^Today$/,
    /^Yesterday$/,
    /^Just now$/,
    /^Live$/  // Handle live videos
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
    
    const diff = now.getTime() - published.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    if (days < 365) return `${Math.floor(days / 30)} months ago`
    return `${Math.floor(days / 365)} years ago`
  } catch (error) {
    console.error('Date formatting error:', error)
    return 'Unknown date'
  }
}