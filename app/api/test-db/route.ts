import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Test database connection and schema
    const result = await db.videoPlaybackPosition.findMany({
      take: 1
    })
    
    return NextResponse.json({ 
      message: 'Database connection successful',
      count: result.length,
      schema: 'VideoPlaybackPosition table exists'
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { 
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}