import { NextRequest, NextResponse } from 'next/server'
import { fullDatabaseCleanup, getDatabaseStats } from '@/lib/db-cleanup'

export async function POST(request: NextRequest) {
  try {
    // Only allow internal calls or cron jobs
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'cleanup-secret-key'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Run cleanup with conservative settings for automated maintenance
    const result = await fullDatabaseCleanup({
      daysToKeep: 90, // Keep 90 days of watched videos
      removeArchived: true,
      removeDuplicates: true,
      vacuum: true
    })

    // Log the cleanup results
    console.log('Scheduled database cleanup completed:', {
      timestamp: new Date().toISOString(),
      ...result.cleaned,
      finalStats: result.stats
    })

    return NextResponse.json({
      success: true,
      message: 'Scheduled database cleanup completed',
      timestamp: new Date().toISOString(),
      ...result
    })
  } catch (error) {
    console.error('Scheduled database cleanup failed:', error)
    return NextResponse.json(
      { error: 'Scheduled database cleanup failed' },
      { status: 500 }
    )
  }
}