import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST() {
  try {
    const db = getDb()
    
    // Delete all watched videos
    await db.watchedVideo.deleteMany({})
    
    return NextResponse.json({ success: true, message: 'Watched history cleared' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear watched history' }, { status: 500 })
  }
}