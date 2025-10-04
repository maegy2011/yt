import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Check if user is admin
    await requireAdmin()

    // Get video counts
    const [totalVideos, activeVideos] = await Promise.all([
      db.whitelistedVideo.count(),
      db.whitelistedVideo.count({ where: { is_active: true } })
    ])

    // Get channel count
    const totalChannels = await db.whitelistedChannel.count()

    // Get user count
    const totalUsers = await db.user.count()

    // Get quota usage
    const currentMonth = new Date()
    currentMonth.setDate(1) // First day of current month
    
    const quotaLogs = await db.apiQuotaLog.findMany({
      where: {
        date: {
          gte: currentMonth
        }
      }
    })

    const quotaUsed = quotaLogs.reduce((sum, log) => sum + log.used_units, 0)
    
    // Get quota total from settings
    const quotaSetting = await db.setting.findUnique({
      where: { key: 'api_quota_total' }
    })
    
    const quotaTotal = quotaSetting?.value?.value || 10000
    const quotaPercentage = (quotaUsed / quotaTotal) * 100

    return NextResponse.json({
      totalVideos,
      activeVideos,
      totalChannels,
      totalUsers,
      quotaUsed,
      quotaTotal,
      quotaPercentage
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}