import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Check if any admin users exist
    const adminCount = await db.user.count({
      where: {
        role: 'admin'
      }
    })

    return NextResponse.json({
      setupComplete: adminCount > 0
    })
  } catch (error) {
    console.error('Error checking setup status:', error)
    return NextResponse.json(
      { error: 'Failed to check setup status' },
      { status: 500 }
    )
  }
}