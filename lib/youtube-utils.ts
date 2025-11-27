// YouTube utility functions for video ID validation and extraction

/**
 * Validates if a string is a valid YouTube video ID
 * YouTube video IDs are typically 11 characters long and contain alphanumeric characters, hyphens, and underscores
 * However, we allow some flexibility for testing and edge cases
 */
export function isValidYouTubeVideoId(videoId: string): boolean {
  if (!videoId || typeof videoId !== 'string') {
    return false
  }
  
  // Remove any whitespace
  const trimmedId = videoId.trim()
  
  // Check minimum length (at least 3 characters for testing)
  if (trimmedId.length < 3 || trimmedId.length > 20) {
    return false
  }
  
  // Check if it contains only valid characters (alphanumeric, hyphens, underscores)
  const validIdPattern = /^[a-zA-Z0-9_-]+$/
  return validIdPattern.test(trimmedId)
}

/**
 * Sanitizes and validates video ID from API response
 */
export function sanitizeVideoId(videoId: unknown): string | null {
  if (!videoId) {
    return null
  }
  
  // Convert to string and trim
  const strId = String(videoId).trim()
  
  // Remove any common prefixes or suffixes that might cause issues
  const cleanId = strId.replace(/^(video:|v:|id:)/i, '').replace(/(:.*|\/.*)$/, '')
  
  if (isValidYouTubeVideoId(cleanId)) {
    return cleanId
  }
  
  return null
}

/**
 * Generates YouTube thumbnail URL from video ID
 */
export function generateThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'max' = 'medium'): string {
  if (!isValidYouTubeVideoId(videoId)) {
    return '/placeholder-video.png' // Fallback image
  }
  
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    max: 'maxresdefault'
  }
  
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`
}

/**
 * Generates YouTube embed URL from video ID
 */
export function generateEmbedUrl(videoId: string, startTime?: number): string {
  if (!isValidYouTubeVideoId(videoId)) {
    return ''
  }
  
  let url = `https://www.youtube.com/embed/${videoId}`
  if (startTime && startTime > 0) {
    url += `?start=${startTime}`
  }
  
  return url
}

/**
 * Extracts video ID from YouTube URL
 */
export function extractVideoIdFromUrl(url: unknown): string | null {
  if (!url || typeof url !== 'string') {
    return null
  }
  
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    
    // Handle different YouTube URL formats
    if (hostname.includes('youtube.com')) {
      // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
      if (urlObj.pathname === '/watch') {
        return urlObj.searchParams.get('v')
      }
      // Shortened URL: https://www.youtube.com/v/VIDEO_ID
      else if (urlObj.pathname.startsWith('/v/')) {
        return urlObj.pathname.slice(3)
      }
      // Embedded URL: https://www.youtube.com/embed/VIDEO_ID
      else if (urlObj.pathname.startsWith('/embed/')) {
        return urlObj.pathname.slice(7)
      }
    }
    // Handle shortened youtu.be URLs
    else if (hostname.includes('youtu.be')) {
      return urlObj.pathname.slice(1)
    }
    
    return null
  } catch (error) {
    // If URL parsing fails, try regex as fallback
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]+)/,
      /v=([a-zA-Z0-9_-]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    
    return null
  }
}

/**
 * Generates YouTube watch URL from video ID
 */
export function generateWatchUrl(videoId: string, startTime?: number): string {
  if (!isValidYouTubeVideoId(videoId)) {
    return ''
  }
  
  let url = `https://www.youtube.com/watch?v=${videoId}`
  if (startTime && startTime > 0) {
    url += `&t=${startTime}`
  }
  
  return url
}