import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

// Enhanced filtering with pattern matching and performance optimizations
interface FilterRequest {
  items: any[]
  enablePatternMatching?: boolean
  enableChannelBlocking?: boolean
  enablePriorityFiltering?: boolean
  cacheKey?: string
}

interface FilterResult {
  filteredItems: any[]
  blockedCount: number
  whitelistCount: number
  patternMatches: number
  channelBlocks: number
  processingTime: number
  cacheHit?: boolean
}

// Cache for frequently accessed blacklist data
const blacklistCache = new Map<string, { data: any[]; timestamp: number }>()
const whitelistCache = new Map<string, { data: any[]; timestamp: number }>()
const patternCache = new Map<string, { data: any[]; timestamp: number }>()

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Helper function to create MD5 hash
function createMD5Hash(input: string): string {
  return createHash('md5').update(input).digest('hex')
}

// Check cache validity
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION
}

// Get cached data or fetch from database
async function getCachedBlacklist(forceRefresh = false): Promise<any[]> {
  const cacheKey = 'blacklist_all'
  const cached = blacklistCache.get(cacheKey)
  
  if (!forceRefresh && cached && isCacheValid(cached.timestamp)) {
    return cached.data
  }

  try {
    const items = await db.blacklistedItem.findMany({
      orderBy: [
        { priority: 'desc' },
        { addedAt: 'desc' }
      ]
    })

    blacklistCache.set(cacheKey, { data: items, timestamp: Date.now() })
    return items
  } catch (error) {
    console.error('Failed to fetch blacklist:', error)
    return []
  }
}

async function getCachedWhitelist(forceRefresh = false): Promise<any[]> {
  const cacheKey = 'whitelist_all'
  const cached = whitelistCache.get(cacheKey)
  
  if (!forceRefresh && cached && isCacheValid(cached.timestamp)) {
    return cached.data
  }

  try {
    const items = await db.whitelistedItem.findMany({
      orderBy: [
        { priority: 'desc' },
        { addedAt: 'desc' }
      ]
    })

    whitelistCache.set(cacheKey, { data: items, timestamp: Date.now() })
    return items
  } catch (error) {
    console.error('Failed to fetch whitelist:', error)
    return []
  }
}

async function getCachedPatterns(forceRefresh = false): Promise<any[]> {
  const cacheKey = 'patterns_active'
  const cached = patternCache.get(cacheKey)
  
  if (!forceRefresh && cached && isCacheValid(cached.timestamp)) {
    return cached.data
  }

  try {
    const patterns = await db.blacklistPattern.findMany({
      where: { isActive: true },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    patternCache.set(cacheKey, { data: patterns, timestamp: Date.now() })
    return patterns
  } catch (error) {
    console.error('Failed to fetch patterns:', error)
    return []
  }
}

// Pattern matching functions
function matchesPattern(text: string, pattern: any): boolean {
  if (!text || !pattern) return false

  const textLower = text.toLowerCase()
  const patternLower = pattern.pattern.toLowerCase()

  switch (pattern.patternType) {
    case 'keyword':
      return textLower.includes(patternLower)
    
    case 'wildcard':
      // Convert wildcard pattern to regex
      const wildcardPattern = patternLower
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.')
      const regex = new RegExp(wildcardPattern, 'i')
      return regex.test(textLower)
    
    case 'regex':
      try {
        const regex = new RegExp(pattern.pattern, 'i')
        return regex.test(text)
      } catch (error) {
        console.warn('Invalid regex pattern:', pattern.pattern)
        return false
      }
    
    default:
      return textLower.includes(patternLower)
  }
}

// Optimized filtering function
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body: FilterRequest = await request.json()
    const { 
      items, 
      enablePatternMatching = true,
      enableChannelBlocking = true,
      enablePriorityFiltering = true,
      cacheKey 
    } = body

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items array' }, { status: 400 })
    }

    // Check if result is cached
    if (cacheKey) {
      const resultCacheKey = `filter_${cacheKey}_${items.length}`
      // Note: In production, use a proper cache like Redis
    }

    // Fetch blacklist data
    const [blacklisted, whitelisted, patterns] = await Promise.all([
      getCachedBlacklist(),
      getCachedWhitelist(),
      enablePatternMatching ? getCachedPatterns() : Promise.resolve([])
    ])

    // Create lookup maps for O(1) performance
    const blacklistMap = new Map()
    const whitelistMap = new Map()
    const channelBlockMap = new Map()
    const channelWhitelistMap = new Map()

    // Populate blacklist lookup maps
    blacklisted.forEach(item => {
      blacklistMap.set(item.itemId, item)
      if (item.isChannelBlock && item.channelHash) {
        channelBlockMap.set(item.channelHash, item)
      }
    })

    // Populate whitelist lookup maps
    whitelisted.forEach(item => {
      whitelistMap.set(item.itemId, item)
      if (item.isChannelWhitelist && item.channelHash) {
        channelWhitelistMap.set(item.channelHash, item)
      }
    })

    const filteredItems: any[] = []
    let blockedCount = 0
    let whitelistCount = 0
    let patternMatches = 0
    let channelBlocks = 0

    // Filter each item
    for (const item of items) {
      let isBlocked = false
      let isWhitelisted = false
      let blockedByPattern = false
      let blockedByChannel = false

      const itemType = 'videoId' in item ? 'video' : 
                      'playlistId' in item ? 'playlist' : 
                      'channelId' in item ? 'channel' : 'unknown'
      
      const itemId = itemType === 'video' ? item.videoId : 
                    itemType === 'playlist' ? item.playlistId : 
                    itemType === 'channel' ? item.channelId : null

      if (!itemId) {
        filteredItems.push(item)
        continue
      }

      // Check whitelist first (whitelist takes precedence)
      if (whitelistMap.has(itemId)) {
        isWhitelisted = true
        whitelistCount++
      }

      // Check channel whitelist
      if (enableChannelBlocking && !isWhitelisted) {
        const channelHash = createMD5Hash(item.channelId || itemId)
        if (channelWhitelistMap.has(channelHash)) {
          isWhitelisted = true
          whitelistCount++
        }
      }

      // Check blacklist if not whitelisted
      if (!isWhitelisted) {
        // Direct item blacklist
        if (blacklistMap.has(itemId)) {
          isBlocked = true
          blockedCount++
        }

        // Channel blocking
        if (enableChannelBlocking && !isBlocked) {
          const channelHash = createMD5Hash(item.channelId || itemId)
          if (channelBlockMap.has(channelHash)) {
            isBlocked = true
            blockedByChannel = true
            channelBlocks++
          }
        }

        // Pattern matching
        if (enablePatternMatching && !isBlocked) {
          for (const pattern of patterns) {
            let text = ''
            
            switch (pattern.type) {
              case 'title':
                text = item.title || ''
                break
              case 'channel':
                text = item.channelName || ''
                break
              case 'description':
                text = item.description || ''
                break
              case 'tags':
                text = (item.tags || []).join(' ')
                break
            }

            if (matchesPattern(text, pattern)) {
              isBlocked = true
              blockedByPattern = true
              patternMatches++
              
              // Update pattern match count
              try {
                await db.blacklistPattern.update({
                  where: { id: pattern.id },
                  data: {
                    matchCount: { increment: 1 },
                    lastMatched: new Date()
                  }
                })
              } catch (error) {
                console.warn('Failed to update pattern metrics:', error)
                // Ignore metric update errors to not break filtering
              }
              
              break // Stop at first pattern match
            }
          }
        }
      }

      // Include item if not blocked
      if (!isBlocked) {
        filteredItems.push(item)
      }
    }

    const processingTime = Date.now() - startTime

    // Update metrics
    try {
      const today = new Date().toISOString().split('T')[0]
      await db.blacklistMetrics.upsert({
        where: { date: new Date(today) },
        update: {
          filterHits: { increment: 1 },
          avgFilterTime: {
            set: (current) => {
              const currentAvg = current || 0
              return (currentAvg + processingTime) / 2
            }
          }
        },
        create: {
          date: new Date(today),
          filterHits: 1,
          avgFilterTime: processingTime
        }
      })
    } catch (error) {
      // Ignore metric update errors
    }

    const result: FilterResult = {
      filteredItems,
      blockedCount,
      whitelistCount,
      patternMatches,
      channelBlocks,
      processingTime
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Enhanced filtering failed:', error)
    return NextResponse.json({ 
      error: 'Filtering failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// Get blacklist statistics and performance metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeMetrics = searchParams.get('includeMetrics') === 'true'

    const [blacklistCount, whitelistCount, patternCount] = await Promise.all([
      db.blacklistedItem.count(),
      db.whitelistedItem.count(),
      db.blacklistPattern.count({ where: { isActive: true } })
    ])

    const result: any = {
      blacklistCount,
      whitelistCount,
      activePatternCount: patternCount,
      cacheStatus: {
        blacklistCache: blacklistCache.size,
        whitelistCache: whitelistCache.size,
        patternCache: patternCache.size
      }
    }

    if (includeMetrics) {
      const metrics = await db.blacklistMetrics.findMany({
        orderBy: { date: 'desc' },
        take: 30 // Last 30 days
      })

      result.metrics = metrics
      result.performanceSummary = {
        avgProcessingTime: metrics.reduce((sum, m) => sum + m.avgFilterTime, 0) / metrics.length,
        totalFilterHits: metrics.reduce((sum, m) => sum + m.filterHits, 0),
        cacheHitRate: metrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / metrics.length
      }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Failed to get blacklist stats:', error)
    return NextResponse.json({ 
      error: 'Failed to get statistics', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// Clear cache
export async function DELETE(request: NextRequest) {
  try {
    blacklistCache.clear()
    whitelistCache.clear()
    patternCache.clear()

    return NextResponse.json({ 
      success: true, 
      message: 'Cache cleared successfully' 
    })
  } catch (error) {
    console.error('Failed to clear cache:', error)
    return NextResponse.json({ 
      error: 'Failed to clear cache', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}