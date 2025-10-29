// Rate limiting utilities to avoid YouTube API blocking
interface RateLimiterOptions {
  maxRequests: number
  windowMs: number
  delayMs?: number
}

class RateLimiter {
  private requests: number[] = []
  private options: RateLimiterOptions
  private queue: Array<() => Promise<any>> = []
  private processing = false

  constructor(options: RateLimiterOptions) {
    this.options = {
      delayMs: 100, // Default delay between requests
      ...options
    }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      
      this.processQueue()
    })
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return
    
    this.processing = true
    
    while (this.queue.length > 0) {
      const now = Date.now()
      
      // Remove old requests outside the window
      this.requests = this.requests.filter(time => now - time < this.options.windowMs)
      
      // Check if we can make a request
      if (this.requests.length < this.options.maxRequests) {
        this.requests.push(now)
        
        const fn = this.queue.shift()
        if (fn) {
          await fn()
        }
      } else {
        // Wait until we can make a request
        const oldestRequest = this.requests[0]
        const waitTime = this.options.windowMs - (now - oldestRequest)
        
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
      
      // Add delay between requests to be extra safe
      if (this.options.delayMs && this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.options.delayMs))
      }
    }
    
    this.processing = false
  }

  getStats() {
    const now = Date.now()
    const recentRequests = this.requests.filter(time => now - time < this.options.windowMs)
    return {
      currentRequests: recentRequests.length,
      maxRequests: this.options.maxRequests,
      queueLength: this.queue.length,
      processing: this.processing
    }
  }
}

// Create rate limiters for different YouTube API operations
export const youtubeRateLimiters = {
  // Safe rate limit for channel data fetching
  channel: new RateLimiter({
    maxRequests: 5, // 5 requests per window
    windowMs: 60000, // 1 minute window
    delayMs: 1000 // 1 second delay between requests
  }),
  
  // More conservative rate limit for video data
  video: new RateLimiter({
    maxRequests: 10, // 10 requests per window
    windowMs: 60000, // 1 minute window
    delayMs: 500 // 0.5 second delay between requests
  }),
  
  // Very conservative rate limit for search
  search: new RateLimiter({
    maxRequests: 3, // 3 requests per window
    windowMs: 60000, // 1 minute window
    delayMs: 2000 // 2 seconds delay between requests
  })
}

// Utility function to add random jitter to requests
export function addRandomJitter(baseDelay: number, maxJitter: number = 1000): number {
  return baseDelay + Math.random() * maxJitter
}

// Cache utility to reduce API calls
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set(key: string, data: any, ttlMs: number = 300000) { // 5 minutes default TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  clear() {
    this.cache.clear()
  }

  size() {
    return this.cache.size
  }
}

export const youtubeCache = new SimpleCache()

// Utility to get real YouTube channel logo with fallback
export async function getChannelLogo(channelId: string, fallbackUrl?: string): Promise<string> {
  const cacheKey = `channel-logo-${channelId}`
  
  // Check cache first
  const cached = youtubeCache.get(cacheKey)
  if (cached) return cached

  try {
    // Use rate limiter for YouTube API calls
    const channelData = await youtubeRateLimiters.channel.execute(async () => {
      const response = await fetch(`/api/youtube/channel/${channelId}`)
      if (!response.ok) throw new Error(`Failed to fetch channel: ${response.status}`)
      return response.json()
    })

    // Extract the best quality logo from the response
    const logoUrl = 
      channelData.stats?.avatar || 
      channelData.thumbnail?.url || 
      channelData.avatar?.[0]?.url ||
      fallbackUrl ||
      `https://img.youtube.com/vi/${channelId}/mqdefault.jpg` // Fallback to video thumbnail

    // Cache the result
    youtubeCache.set(cacheKey, logoUrl, 1800000) // 30 minutes cache for logos
    
    return logoUrl
  } catch (error) {
    console.warn(`Failed to fetch channel logo for ${channelId}:`, error)
    
    // Return fallback URL or generate a default one
    const fallback = fallbackUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(channelId)}&background=6366f1&color=fff&size=128`
    
    // Cache the fallback for a shorter time
    youtubeCache.set(cacheKey, fallback, 300000) // 5 minutes cache for fallbacks
    
    return fallback
  }
}

// Utility to batch process channel logos
export async function batchGetChannelLogos(
  channelIds: string[], 
  maxConcurrent: number = 3
): Promise<Map<string, string>> {
  const results = new Map<string, string>()
  
  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < channelIds.length; i += maxConcurrent) {
    const batch = channelIds.slice(i, i + maxConcurrent)
    
    const promises = batch.map(async (channelId) => {
      const logoUrl = await getChannelLogo(channelId)
      return { channelId, logoUrl }
    })
    
    const batchResults = await Promise.allSettled(promises)
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.set(result.value.channelId, result.value.logoUrl)
      } else {
        console.warn(`Failed to get logo for ${batch[index]}:`, result.reason)
      }
    })
    
    // Add delay between batches
    if (i + maxConcurrent < channelIds.length) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  return results
}