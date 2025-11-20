import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    console.log('Starting database cleanup...')
    
    // Delete all data from all tables
    const favoriteChannelsCount = await db.favoriteChannel.deleteMany()
    const favoriteVideosCount = await db.favoriteVideo.deleteMany()
    const videoNotesCount = await db.videoNote.deleteMany()
    
    console.log('Database cleanup completed:', {
      favoriteChannels: favoriteChannelsCount.count,
      favoriteVideos: favoriteVideosCount.count,
      videoNotes: videoNotesCount.count
    })
    
    return NextResponse.json({
      success: true,
      message: 'Database cleaned successfully',
      deleted: {
        favoriteChannels: favoriteChannelsCount.count,
        favoriteVideos: favoriteVideosCount.count,
        videoNotes: videoNotesCount.count
      }
    })
  } catch (error) {
    console.error('Database cleanup failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to clean database',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get current database statistics
    const favoriteChannelsCount = await db.favoriteChannel.count()
    const favoriteVideosCount = await db.favoriteVideo.count()
    const videoNotesCount = await db.videoNote.count()
    
    return NextResponse.json({
      statistics: {
        favoriteChannels: favoriteChannelsCount,
        favoriteVideos: favoriteVideosCount,
        videoNotes: videoNotesCount,
        total: favoriteChannelsCount + favoriteVideosCount + videoNotesCount
      }
    })
  } catch (error) {
    console.error('Failed to get database statistics:', error)
    return NextResponse.json({
      error: 'Failed to get database statistics',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    }, { status: 500 })
  }
}