import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    console.log('Starting clear all data operation...')
    
    // Delete all data from all tables
    const watchedVideosCount = await db.watchedVideo.deleteMany()
    const favoriteChannelsCount = await db.favoriteChannel.deleteMany()
    const favoriteVideosCount = await db.favoriteVideo.deleteMany()
    const videoNotesCount = await db.videoNote.deleteMany()
    
    const totalDeleted = watchedVideosCount.count + favoriteChannelsCount.count + favoriteVideosCount.count + videoNotesCount.count
    
    console.log('Database cleanup completed:', {
      watchedVideos: watchedVideosCount.count,
      favoriteChannels: favoriteChannelsCount.count,
      favoriteVideos: favoriteVideosCount.count,
      videoNotes: videoNotesCount.count,
      total: totalDeleted
    })
    
    return NextResponse.json({
      success: true,
      message: 'All data cleared successfully',
      deleted: {
        watchedVideos: watchedVideosCount.count,
        favoriteChannels: favoriteChannelsCount.count,
        favoriteVideos: favoriteVideosCount.count,
        videoNotes: videoNotesCount.count,
        total: totalDeleted
      },
      localStorageCleared: true // Client will handle this
    })
  } catch (error) {
    console.error('Clear all data failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to clear all data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get current data statistics
    const watchedVideosCount = await db.watchedVideo.count()
    const favoriteChannelsCount = await db.favoriteChannel.count()
    const favoriteVideosCount = await db.favoriteVideo.count()
    const videoNotesCount = await db.videoNote.count()
    
    const total = watchedVideosCount + favoriteChannelsCount + favoriteVideosCount + videoNotesCount
    
    return NextResponse.json({
      statistics: {
        watchedVideos: watchedVideosCount,
        favoriteChannels: favoriteChannelsCount,
        favoriteVideos: favoriteVideosCount,
        videoNotes: videoNotesCount,
        total: total
      },
      hasData: total > 0
    })
  } catch (error) {
    console.error('Failed to get data statistics:', error)
    return NextResponse.json({
      error: 'Failed to get data statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}