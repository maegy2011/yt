import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Delete all watched videos
    await db.watchedVideo.deleteMany({})
    
    return NextResponse.json({ success: true, message: 'Watched history cleared' })
  } catch (error) {
    console.error('Failed to clear watched history:', error)
    return NextResponse.json({ error: 'Failed to clear watched history' }, { status: 500 })
  }
}