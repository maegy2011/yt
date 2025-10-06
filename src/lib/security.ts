// Security utilities for the YouTube platform

// Constants for security
export const SECURITY_CONSTANTS = {
  MAX_QUERY_LENGTH: 200,
  MAX_LIMIT: 50,
  MAX_PAGE: 100,
  MAX_STRING_LENGTH: 500,
  MAX_CHANNEL_ID_LENGTH: 50,
  MAX_TITLE_LENGTH: 200,
  MAX_CHANNEL_NAME_LENGTH: 100,
  YOUTUBE_DOMAINS: ['youtube.com', 'www.youtube.com', 'm.youtube.com'],
  ALLOWED_CHANNEL_IDS: ['twjehdm', 'wmngovksa', 'othmanalkamees', 'alhewenytube']
}

// Security validation functions
export function isValidChannelId(channelId: string): boolean {
  if (!channelId || typeof channelId !== 'string') return false
  return SECURITY_CONSTANTS.ALLOWED_CHANNEL_IDS.includes(channelId.trim())
}

export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  
  try {
    const parsedUrl = new URL(url)
    return SECURITY_CONSTANTS.YOUTUBE_DOMAINS.includes(parsedUrl.hostname)
  } catch {
    return false
  }
}

export function sanitizeInput(input: string, maxLength: number = SECURITY_CONSTANTS.MAX_STRING_LENGTH): string {
  if (!input || typeof input !== 'string') return ''
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/["']/g, '') // Remove quotes
    .substring(0, maxLength)
    .trim()
}

export function validatePaginationParams(page: number, limit: number): { isValid: boolean; error?: string } {
  if (isNaN(page) || page < 1 || page > SECURITY_CONSTANTS.MAX_PAGE) {
    return { isValid: false, error: 'Invalid page number' }
  }
  if (isNaN(limit) || limit < 1 || limit > SECURITY_CONSTANTS.MAX_LIMIT) {
    return { isValid: false, error: 'Invalid limit number' }
  }
  return { isValid: true }
}

export function validateSearchParams(query: string, page: number, limit: number): { isValid: boolean; error?: string } {
  if (!query || query.length > SECURITY_CONSTANTS.MAX_QUERY_LENGTH) {
    return { isValid: false, error: 'Invalid query length' }
  }
  
  const paginationValidation = validatePaginationParams(page, limit)
  if (!paginationValidation.isValid) {
    return paginationValidation
  }
  
  return { isValid: true }
}

// Function to validate and sanitize video data
export function sanitizeVideoData(video: any): any {
  if (!video || typeof video !== 'object') return null
  
  return {
    id: sanitizeInput(video.id, SECURITY_CONSTANTS.MAX_CHANNEL_ID_LENGTH),
    title: sanitizeInput(video.title, SECURITY_CONSTANTS.MAX_TITLE_LENGTH),
    thumbnail: sanitizeInput(video.thumbnail, SECURITY_CONSTANTS.MAX_STRING_LENGTH),
    channelName: sanitizeInput(video.channelName, SECURITY_CONSTANTS.MAX_CHANNEL_NAME_LENGTH),
    channelLogo: video.channelLogo ? sanitizeInput(video.channelLogo, SECURITY_CONSTANTS.MAX_STRING_LENGTH) : undefined,
    publishedAt: video.publishedAt || new Date().toISOString(),
    duration: video.duration ? sanitizeInput(video.duration, 20) : undefined,
    viewCount: video.viewCount ? sanitizeInput(video.viewCount, 20) : undefined,
    description: video.description ? sanitizeInput(video.description, SECURITY_CONSTANTS.MAX_STRING_LENGTH) : undefined
  }
}

// Function to validate thumbnail URL
export function isValidThumbnailUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  
  try {
    const parsedUrl = new URL(url)
    // Check if it's a valid image URL
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
  } catch {
    return false
  }
}

// Function to generate safe random string
export function generateSafeRandomString(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Function to prevent timing attacks
export function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  
  if (a.length !== b.length) return false
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  
  return result === 0
}

// Function to validate date format
export function isValidDate(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') return false
  
  try {
    const date = new Date(dateString)
    return !isNaN(date.getTime())
  } catch {
    return false
  }
}

// Function to sanitize channel ID
export function sanitizeChannelId(channelId: string): string {
  if (!channelId || typeof channelId !== 'string') return ''
  
  return channelId
    .replace(/[^a-zA-Z0-9_-]/g, '') // Only allow alphanumeric, underscore, and hyphen
    .substring(0, SECURITY_CONSTANTS.MAX_CHANNEL_ID_LENGTH)
    .trim()
}

// Function to validate video ID format
export function isValidVideoId(videoId: string): boolean {
  if (!videoId || typeof videoId !== 'string') return false
  
  // YouTube video IDs are typically 11 characters and contain alphanumeric characters, underscores, and hyphens
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId)
}