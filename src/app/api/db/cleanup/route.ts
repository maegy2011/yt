import { NextRequest, NextResponse } from 'next/server'
import { fullDatabaseCleanup, getDatabaseStats } from '@/lib/db-cleanup'

export async function GET() {
  try {
    const stats = await getDatabaseStats()
    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Failed to get database stats:', error)
    return NextResponse.json(
      { error: 'Failed to get database stats' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      daysToKeep = 30,
      removeArchived = true,
      removeDuplicates = true,
      vacuum = true
    } = body

    const result = await fullDatabaseCleanup({
      daysToKeep,
      removeArchived,
      removeDuplicates,
      vacuum
    })

    return NextResponse.json({
      success: true,
      message: 'Database cleanup completed successfully',
      ...result
    })
  } catch (error) {
    console.error('Database cleanup failed:', error)
    return NextResponse.json(
      { error: 'Database cleanup failed' },
      { status: 500 }
    )
  }
}