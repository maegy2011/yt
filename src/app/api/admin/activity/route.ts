import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Check if user is admin
    await requireAdmin()

    // Get recent activity
    const activities = await db.auditLog.findMany({
      include: {
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 50 // Last 50 activities
    })

    return NextResponse.json({
      activities: activities.map(activity => ({
        id: activity.id,
        action: activity.action,
        target_type: activity.target_type,
        target_id: activity.target_id,
        created_at: activity.created_at.toISOString(),
        user: activity.user ? {
          email: activity.user.email
        } : undefined
      }))
    })
  } catch (error) {
    console.error('Error fetching admin activity:', error)
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}