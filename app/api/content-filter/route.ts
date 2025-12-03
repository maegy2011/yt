import { NextRequest, NextResponse } from 'next/server'
import { contentFilter } from '@/lib/content-filter-engine'
import { sanitizeVideoId } from '@/lib/youtube-utils'

/**
 * Professional Content Filtering API
 * 
 * Provides high-performance content filtering with:
 * - Multi-layered filtering (blacklist, whitelist, patterns)
 * - Intelligent caching
 * - Performance monitoring
 * - Category-based organization
 * - Priority-based conflict resolution
 */

export async function POST(request: NextRequest) {
  const startTime = performance.now()
  
  try {
    const body = await request.json()
    const { items, options = {} } = body

    // Validate request
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        error: 'Invalid request: items must be a non-empty array'
      }, { status: 400 })
    }

    // Validate and sanitize items
    const sanitizedItems = items.map(item => {
      let sanitizedId = item.itemId
      
      // Sanitize ID based on type
      switch (item.type) {
        case 'video':
          sanitizedId = sanitizeVideoId(item.itemId)
          break
        case 'channel':
        case 'playlist':
        default:
          sanitizedId = item.itemId
      }

      return {
        id: item.id || sanitizedId,
        itemId: sanitizedId,
        type: item.type,
        title: item.title || '',
        channelName: item.channelName || '',
        description: item.description || '',
        tags: Array.isArray(item.tags) ? item.tags : []
      }
    }).filter(item => item.itemId && item.title) // Filter out invalid items

    if (sanitizedItems.length === 0) {
      return NextResponse.json({
        error: 'No valid items to filter'
      }, { status: 400 })
    }

    // Filter items in parallel for better performance
    const filterPromises = sanitizedItems.map(async (item) => {
      try {
        const result = await contentFilter.filterContent(item)
        return {
          id: item.id,
          itemId: item.itemId,
          ...result
        }
      } catch (error) {
        console.error(`Filter error for item ${item.itemId}:`, error)
        return {
          id: item.id,
          itemId: item.itemId,
          allowed: true,
          blocked: false,
          whitelisted: false,
          reason: 'Filtering error - allowed by default',
          confidence: 0,
          cached: false,
          responseTime: 0,
          error: true
        }
      }
    })

    const results = await Promise.all(filterPromises)
    
    // Calculate statistics
    const stats = {
      total: results.length,
      allowed: results.filter(r => r.allowed && !r.blocked && !r.whitelisted).length,
      blocked: results.filter(r => r.blocked).length,
      whitelisted: results.filter(r => r.whitelisted).length,
      cached: results.filter(r => r.cached).length,
      avgResponseTime: results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length,
      errors: results.filter(r => r.error).length
    }

    // Get filter engine metrics
    const engineMetrics = contentFilter.getMetrics()
    const cacheStats = contentFilter.getCacheStats()

    const totalTime = performance.now() - startTime

    return NextResponse.json({
      success: true,
      results,
      stats,
      metrics: {
        engine: engineMetrics,
        cache: cacheStats,
        processingTime: totalTime,
        itemsPerSecond: Math.round(results.length / (totalTime / 1000))
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Content filter API error:', error)
    
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * Batch filter endpoint for large datasets
 */
export async function PUT(request: NextRequest) {
  const startTime = performance.now()
  
  try {
    const body = await request.json()
    const { items, batchSize = 100, options = {} } = body

    // Validate request
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        error: 'Invalid request: items must be a non-empty array'
      }, { status: 400 })
    }

    // Process in batches for better performance
    const batches: any[] = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }

    const allResults: any[] = []
    let totalProcessingTime = 0

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      const batchStartTime = performance.now()
      
        // Process batch
      const batchResults = await Promise.all(
        batch.map(async (item: any) => {
          try {
            const result = await contentFilter.filterContent({
              id: item.id || item.itemId,
              itemId: item.itemId,
              type: item.type,
              title: item.title || '',
              channelName: item.channelName || '',
              description: item.description || '',
              tags: Array.isArray(item.tags) ? item.tags : []
            })
            
            return {
              id: item.id || item.itemId,
              itemId: item.itemId,
              ...result
            }
          } catch (error) {
            console.error(`Batch filter error for item ${item.itemId}:`, error)
            return {
              id: item.id || item.itemId,
              itemId: item.itemId,
              allowed: true,
              blocked: false,
              whitelisted: false,
              reason: 'Filtering error - allowed by default',
              confidence: 0,
              cached: false,
              responseTime: 0,
              error: true
            }
          }
        })
      )
      
      allResults.push(...batchResults)
      totalProcessingTime += performance.now() - batchStartTime
      
      // Small delay between batches to prevent overwhelming
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }

    // Calculate statistics
    const stats = {
      total: allResults.length,
      allowed: allResults.filter(r => r.allowed && !r.blocked && !r.whitelisted).length,
      blocked: allResults.filter(r => r.blocked).length,
      whitelisted: allResults.filter(r => r.whitelisted).length,
      cached: allResults.filter(r => r.cached).length,
      avgResponseTime: allResults.reduce((sum, r) => sum + (r.responseTime || 0), 0) / allResults.length,
      errors: allResults.filter(r => r.error).length
    }

    const totalTime = performance.now() - startTime

    return NextResponse.json({
      success: true,
      results: allResults,
      stats,
      batchInfo: {
        totalBatches: batches.length,
        batchSize,
        totalProcessingTime,
        avgBatchTime: totalProcessingTime / batches.length
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Batch content filter API error:', error)
    
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * Get filter engine metrics and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeDetails = searchParams.get('details') === 'true'
    
    const metrics = contentFilter.getMetrics()
    const cacheStats = contentFilter.getCacheStats()

    let detailedStats: any = null
    if (includeDetails) {
      // Get detailed statistics from database
      detailedStats = await getDetailedStatistics()
    }

    return NextResponse.json({
      success: true,
      metrics,
      cache: cacheStats,
      detailed: detailedStats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Filter metrics API error:', error)
    
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * Clear filter cache
 */
export async function DELETE(request: NextRequest) {
  try {
    contentFilter.clearCache()
    
    return NextResponse.json({
      success: true,
      message: 'Filter cache cleared successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Clear cache API error:', error)
    
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * Get detailed statistics from database
 */
async function getDetailedStatistics() {
  try {
    const db = await import('@/lib/db').then(m => m.db)
    
    const [
      totalBlacklisted,
      activeBlacklisted,
      totalWhitelisted,
      activeWhitelisted,
      totalPatterns,
      activePatterns,
      totalCategories,
      activeCategories
    ] = await Promise.all([
      db.blacklistedItem.count(),
      db.blacklistedItem.count({ where: { isActive: true } }),
      db.whitelistedItem.count(),
      db.whitelistedItem.count({ where: { isActive: true } }),
      db.blacklistPattern.count(),
      db.blacklistPattern.count({ where: { isActive: true } }),
      db.blacklistCategory.count(),
      db.blacklistCategory.count({ where: { isActive: true } })
    ])

    // Get category breakdown
    const categories = await db.blacklistCategory.findMany({
      where: { isActive: true },
      include: {
        items: {
          select: { id: true }
        },
        patterns: {
          select: { id: true }
        }
      }
    })

    const categoryBreakdown = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      itemCount: cat.items.length,
      patternCount: cat.patterns.length
    }))

    // Get recent activity
    const recentActivity = await db.blacklistAuditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        action: true,
        itemType: true,
        itemId: true,
        createdAt: true
      }
    })

    return {
      overview: {
        totalBlacklisted,
        activeBlacklisted,
        totalWhitelisted,
        activeWhitelisted,
        totalPatterns,
        activePatterns,
        totalCategories,
        activeCategories
      },
      categories: categoryBreakdown,
      recentActivity
    }

  } catch (error) {
    console.error('Detailed statistics error:', error)
    return null
  }
}