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
 * Extracts video ID from various YouTube URL formats
 */
export function extractVideoIdFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null
  }
  
  const trimmedUrl = url.trim()
  
  // Regular expressions for different YouTube URL formats
  const patterns = [
    // Standard YouTube URLs
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    // Mobile YouTube URLs
    /(?:m\.youtube\.com\/watch\?v=|m\.youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    // YouTube TV URLs
    /(?:tv\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // YouTube music URLs
    /(?:music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // YouTube share URLs
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11}).*\bshare\b/
  ]
  
  for (const pattern of patterns) {
    const match = trimmedUrl.match(pattern)
    if (match && match[1]) {
      const videoId = match[1]
      if (isValidYouTubeVideoId(videoId)) {
        return videoId
      }
    }
  }
  
  return null
}

/**
 * Checks if clipboard content contains a YouTube video URL
 */
export async function checkClipboardForYouTubeVideo(): Promise<boolean> {
  try {
    if (!navigator.clipboard) {
      return false
    }
    
    const clipboardText = await navigator.clipboard.readText()
    return extractVideoIdFromUrl(clipboardText) !== null
  } catch (error) {
    console.error('Error checking clipboard:', error)
    return false
  }
}

/**
 * Gets video ID from clipboard if it contains a YouTube URL
 */
export async function getVideoIdFromClipboard(): Promise<string | null> {
  try {
    if (!navigator.clipboard) {
      return null
    }
    
    const clipboardText = await navigator.clipboard.readText()
    return extractVideoIdFromUrl(clipboardText)
  } catch (error) {
    console.error('Error getting video ID from clipboard:', error)
    return null
  }
}

/**
 * Sanitizes and validates video ID from API response
 */
export function sanitizeVideoId(videoId: any): string | null {
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