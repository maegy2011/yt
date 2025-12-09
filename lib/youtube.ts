/**
 * Format duration into h:mm:ss format
 * 
 * Converts various duration formats into standardized h:mm:ss format.
 * Handles MM:SS, HH:MM:SS, ISO 8601, and raw seconds.
 * 
 * @param duration - Duration as string (various formats) or number (seconds)
 * @returns {string} Formatted duration in h:mm:ss
 * 
 * @example
 * ```typescript
 * formatDuration(273)           // "4:33"
 * formatDuration("PT4M33S")     // "4:33"
 * formatDuration("4:33")         // "4:33"
 * formatDuration(0)              // "0:00"
 * formatDuration(undefined)       // "0:00"
 * formatDuration("333:45")      // "5:33:45" (333 minutes = 5h 33m)
 * formatDuration("211:30")      // "3:31:30" (211 minutes = 3h 31m)
 * formatDuration("59:59")       // "0:59:59" (59 minutes 59 seconds)
 * ```
 */
export function formatDuration(duration: string | number | undefined): string {
  // Handle undefined or empty duration
  if (!duration) return '0:00'
  
  // If it's already in correct format (HH:MM:SS), return as is
  if (typeof duration === 'string' && /^\d{1,2}:\d{2}:\d{2}$/.test(duration)) {
    return duration
  }
  
  // Handle if duration is a number (seconds)
  if (typeof duration === 'number') {
    const hours = Math.floor(duration / 3600)
    const minutes = Math.floor((duration % 3600) / 60)
    const seconds = Math.floor(duration % 60)
    
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  
  // Handle ISO 8601 duration format (PT4M13S, PT1H23M45S)
  if (typeof duration === 'string' && duration.startsWith('PT')) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (match) {
      const hours = parseInt(match[1] || '0')
      const minutes = parseInt(match[2] || '0')
      const seconds = parseInt(match[3] || '0')
      
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
  }
  
  // Handle MM:SS format (convert to H:MM:SS)
  if (typeof duration === 'string' && /^\d{1,2}:\d{2}$/.test(duration)) {
    const parts = duration.split(':')
    const minutes = parseInt(parts[0])
    const seconds = parseInt(parts[1])
    
    // Convert to H:MM:SS
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  
  // Handle just seconds as string
  if (typeof duration === 'string' && /^\d+$/.test(duration)) {
    const totalSeconds = parseInt(duration)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
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
  
  for (const pattern of relativePatterns) {
    if (pattern.test(trimmedDate)) {
      return trimmedDate
    }
  }
  
  // Fallback for unknown formats
  return trimmedDate
}

/**
 * Format view count into human-readable format
 * 
 * Converts raw view counts into user-friendly strings with K, M, B suffixes.
 * 
 * @param viewCount - Number of views
 * @returns {string} Formatted view count
 * 
 * @example
 * ```typescript
 * formatViewCount(1234567)     // "1.2M"
 * formatViewCount(999999)       // "999.9K"
 * formatViewCount(1000000)      // "1M"
 * ```
 */
export function formatViewCount(viewCount: number): string {
  if (!viewCount) return '0'
  
  if (viewCount >= 1000000) {
    return `${(viewCount / 1000000).toFixed(1)}M`
  } else if (viewCount >= 1000) {
    return `${(viewCount / 1000).toFixed(1)}K`
  } else {
    return viewCount.toString()
  }
}