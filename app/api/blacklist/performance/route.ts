import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Performance monitoring and optimization endpoints
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeDetails = searchParams.get('includeDetails') === 'true'
    const timeRange = searchParams.get('timeRange') || '30' // days

    // Get current statistics
    const [blacklistCount, whitelistCount, patternCount, batchCount] = await Promise.all([
      db.blacklistedItem.count(),
      db.whitelistedItem.count(),
      db.blacklistPattern.count({ where: { isActive: true } }),
      db.blacklistBatch.count()
    ])

    // Get performance metrics for the specified time range
    const metrics = await db.blacklistMetrics.findMany({
      where: {
        date: {
          gte: new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { date: 'desc' },
      take: parseInt(timeRange)
    })

    // Calculate performance summary
    const totalFilterHits = metrics.reduce((sum, m) => sum + m.filterHits, 0)
    const avgProcessingTime = metrics.length > 0 ? 
      metrics.reduce((sum, m) => sum + m.avgFilterTime, 0) / metrics.length : 0
    const avgCacheHitRate = metrics.length > 0 ? 
      metrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / metrics.length : 0

    // Get type distribution
    const [blacklistByType, whitelistByType] = await Promise.all([
      db.blacklistedItem.groupBy({
        by: ['type'],
        _count: { id: true }
      }),
      db.whitelistedItem.groupBy({
        by: ['type'],
        _count: { id: true }
      })
    ])

    // Get batch statistics
    const batchStats = await db.blacklistBatch.groupBy({
      by: ['status'],
      _count: { id: true }
    })

    // Get pattern performance
    const topPatterns = await db.blacklistPattern.findMany({
      where: { isActive: true },
      orderBy: { matchCount: 'desc' },
      take: 10
    })

    // Get recent activity
    const recentBatches = await db.blacklistBatch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    const result: any = {
      summary: {
        totalBlacklisted: blacklistCount,
        totalWhitelisted: whitelistCount,
        activePatterns: patternCount,
        totalBatches: batchCount,
        totalFilterHits,
        avgProcessingTime: Math.round(avgProcessingTime * 100) / 100,
        avgCacheHitRate: Math.round(avgCacheHitRate * 100) / 100
      },
      distribution: {
        blacklist: blacklistByType.reduce((acc, item) => {
          acc[item.type] = item._count.id
          return acc
        }, {} as Record<string, number>),
        whitelist: whitelistByType.reduce((acc, item) => {
          acc[item.type] = item._count.id
          return acc
        }, {} as Record<string, number>)
      },
      batchStats: batchStats.reduce((acc, item) => {
        acc[item.status] = item._count.id
        return acc
      }, {} as Record<string, number>),
      topPatterns,
      recentBatches,
      timeRange: `${timeRange} days`
    }

    if (includeDetails) {
      result.detailedMetrics = metrics
      result.performanceTrend = calculatePerformanceTrend(metrics)
    }

    return NextResponse.json(result)

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to get performance metrics', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// Calculate performance trends
function calculatePerformanceTrend(metrics: any[]) {
  if (metrics.length < 2) return null

  const sorted = metrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const recent = sorted.slice(-7) // Last 7 days
  const previous = sorted.slice(-14, -7) // Previous 7 days

  if (previous.length === 0) return null

  const recentAvg = recent.reduce((sum, m) => sum + m.avgFilterTime, 0) / recent.length
  const previousAvg = previous.reduce((sum, m) => sum + m.avgFilterTime, 0) / previous.length

  const recentHits = recent.reduce((sum, m) => sum + m.filterHits, 0)
  const previousHits = previous.reduce((sum, m) => sum + m.filterHits, 0)

  return {
    processingTimeTrend: recentAvg > previousAvg ? 'increasing' : 'decreasing',
    processingTimeChange: Math.round(((recentAvg - previousAvg) / previousAvg) * 100),
    filterHitsTrend: recentHits > previousHits ? 'increasing' : 'decreasing',
    filterHitsChange: Math.round(((recentHits - previousHits) / previousHits) * 100)
  }
}

// Performance optimization recommendations
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'optimize-cache':
        // Clear cache and preload frequently accessed data
        const response = await fetch('/api/blacklist/filter', { method: 'DELETE' })
        if (response.ok) {
          return NextResponse.json({ 
            success: true, 
            message: 'Cache cleared and optimized' 
          })
        } else {
          return NextResponse.json({ 
            error: 'Failed to clear cache' 
          }, { status: 500 })
        }

      case 'cleanup-old-batches':
        // Remove old completed batches (older than 30 days)
        const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const result = await db.blacklistBatch.deleteMany({
          where: {
            status: { in: ['completed', 'completed_with_errors'] },
            createdAt: { lt: cutoffDate }
          }
        })
        return NextResponse.json({ 
          success: true, 
          message: `Cleaned up ${result.count} old batches` 
        })

      case 'update-metrics':
        // Force update performance metrics
        const today = new Date().toISOString().split('T')[0]
        const currentBlacklistCount = await db.blacklistedItem.count()
        await db.blacklistMetrics.upsert({
          where: { date: new Date(today) },
          update: {
            totalItems: currentBlacklistCount,
            filterHits: { increment: 1 }
          },
          create: {
            date: new Date(today),
            totalItems: currentBlacklistCount,
            filterHits: 1
          }
        })
        return NextResponse.json({ 
          success: true, 
          message: 'Metrics updated' 
        })

      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ 
      error: 'Performance optimization failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}