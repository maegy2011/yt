import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { EnhancedPatternMatcher, AdvancedPattern } from '@/lib/enhanced-pattern-matcher'

// Enhanced filtering with pattern matching and performance optimizations
interface FilterRequest {
  items: any[]
  enablePatternMatching?: boolean
  enableChannelBlocking?: boolean
  enablePriorityFiltering?: boolean
  enableFuzzyMatching?: boolean
  enableSemanticMatching?: boolean
  cacheKey?: string
  patternThreshold?: number
}

interface FilterResult {
  filteredItems: any[]
  blockedCount: number
  whitelistCount: number
  patternMatches: number
  channelBlocks: number
  fuzzyMatches: number
  semanticMatches: number
  processingTime: number
  cacheHit?: boolean
  patternPerformance?: Array<{ patternId: string; avgTime: number; matchRate: number }>
}

// Cache for frequently accessed blacklist data
const blacklistCache = new Map<string, { data: any[]; expiry: number }>()
const whitelistCache = new Map<string, { data: any[]; expiry: number }>()
const patternCache = new Map<string, { data: any[]; expiry: number }>()

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Check cache validity and clean expired entries
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION
}

function cleanExpiredCache(cache: Map<string, { data: any[]; expiry: number }>): void {
  const now = Date.now()
  for (const [key, value] of cache.entries()) {
    if (now > value.expiry) {
      cache.delete(key)
    }
  }
}

// Get cached data or fetch from database
async function getCachedBlacklist(forceRefresh = false): Promise<any[]> {
  const cacheKey = 'blacklist_all'
  const cached = blacklistCache.get(cacheKey)
  
  // Clean expired entries
  cleanExpiredCache(blacklistCache)
  
  if (!forceRefresh && cached && isCacheValid(cached.expiry)) {
    return cached.data
  }

  try {
    const items = await db.blacklistedItem.findMany({
      orderBy: [
        { priority: 'desc' },
        { addedAt: 'desc' }
      ]
    })

    blacklistCache.set(cacheKey, { data: items, expiry: Date.now() + CACHE_DURATION })
    return items
  } catch (error) {
    // Failed to fetch blacklist
    return []
  }
}

async function getCachedWhitelist(forceRefresh = false): Promise<any[]> {
  const cacheKey = 'whitelist_all'
  const cached = whitelistCache.get(cacheKey)
  
  // Clean expired entries
  cleanExpiredCache(whitelistCache)
  
  if (!forceRefresh && cached && isCacheValid(cached.expiry)) {
    return cached.data
  }

  try {
    const items = await db.whitelistedItem.findMany({
      orderBy: [
        { priority: 'desc' },
        { addedAt: 'desc' }
      ]
    })

    whitelistCache.set(cacheKey, { data: items, expiry: Date.now() + CACHE_DURATION })
    return items
  } catch (error) {
    // Failed to fetch whitelist
    return []
  }
}

async function getCachedPatterns(forceRefresh = false): Promise<any[]> {
  const cacheKey = 'patterns_active'
  const cached = patternCache.get(cacheKey)
  
  // Clean expired entries
  cleanExpiredCache(patternCache)
  
  if (!forceRefresh && cached && isCacheValid(cached.expiry)) {
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

    patternCache.set(cacheKey, { data: patterns, expiry: Date.now() + CACHE_DURATION })
    return patterns
  } catch (error) {
    // Failed to fetch patterns
    return []
  }
}

// Pattern matching functions with validation
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
        // Validate regex pattern before using
        const regex = new RegExp(pattern.pattern, 'i')
        return regex.test(text)
      } catch (error) {
        // Invalid regex pattern - skip this pattern
        console.warn(`Invalid regex pattern: ${pattern.pattern}`)
        return false
      }
    
    default:
      return textLower.includes(patternLower)
  }
}

// Validate regex pattern before saving
function validateRegexPattern(pattern: string): boolean {
  try {
    new RegExp(pattern)
    return true
  } catch {
    return false
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
      if (item.isChannelBlock && item.channelName) {
        channelBlockMap.set(item.channelName.toLowerCase(), item)
      }
    })

    // Populate whitelist lookup maps
    whitelisted.forEach(item => {
      whitelistMap.set(item.itemId, item)
      if (item.isChannelWhitelist && item.channelName) {
        channelWhitelistMap.set(item.channelName.toLowerCase(), item)
      }
    })

    const filteredItems: any[] = []
    let blockedCount = 0
    let whitelistCount = 0
    let patternMatches = 0
    let channelBlocks = 0
    let fuzzyMatches = 0
    let semanticMatches = 0

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
        const channelName = item.channelName?.toLowerCase() || item.channelId?.toLowerCase()
        if (channelName && channelWhitelistMap.has(channelName)) {
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
          const channelName = item.channelName?.toLowerCase() || item.channelId?.toLowerCase()
          if (channelName && channelBlockMap.has(channelName)) {
            isBlocked = true
            blockedByChannel = true
            channelBlocks++
          }
        }

        // Enhanced pattern matching
        if (enablePatternMatching && !isBlocked) {
          // Convert database patterns to advanced patterns
          const advancedPatterns: AdvancedPattern[] = patterns.map(p => ({
            id: p.id,
            pattern: p.pattern,
            type: p.patternType as any,
            weight: p.priority / 100, // Convert priority to weight
            context: p.type as any,
            isEnabled: p.isActive,
            matchThreshold: 0.8 // Default threshold
          }))

          // Test all pattern contexts
          const contexts = ['title', 'channel', 'description', 'tags']
          
          for (const context of contexts) {
            let text = ''
            
            switch (context) {
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

            if (!text) continue

            // Use enhanced pattern matching
            const matchResult = EnhancedPatternMatcher.matchPatterns(
              text, 
              advancedPatterns, 
              context
            )

            if (matchResult.matched) {
              isBlocked = true
              blockedByPattern = true
              patternMatches++

              // Track match types
              if (matchResult.pattern?.type === 'fuzzy') {
                fuzzyMatches++
              } else if (matchResult.pattern?.type === 'semantic') {
                semanticMatches++
              }

              // Update pattern match count and performance
              try {
                await db.blacklistPattern.update({
                  where: { id: matchResult.pattern!.id },
                  data: {
                    matchCount: { increment: 1 },
                    lastMatched: new Date()
                  }
                })
              } catch (error) {
                // Failed to update pattern metrics
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
          increment: processingTime / 2,
          set: undefined
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
      fuzzyMatches: fuzzyMatches || 0,
      semanticMatches: semanticMatches || 0,
      processingTime
    }

    return NextResponse.json(result)

  } catch (error) {
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
    return NextResponse.json({ 
      error: 'Failed to clear cache', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}