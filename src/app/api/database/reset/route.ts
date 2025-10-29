import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { confirm = false, type = 'all', backup = false } = body

    if (!confirm) {
      return NextResponse.json({
        error: 'Confirmation required. Set confirm: true to proceed with database reset.',
        warning: 'This will permanently delete all data. Use with caution.',
        availableTypes: ['all', 'watched', 'favorites', 'channels', 'notes'],
        example: { "confirm": true, "type": "all" }
      }, { status: 400 })
    }

    // Validate type parameter
    const validTypes = ['all', 'watched', 'favorites', 'channels', 'notes']
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        error: `Invalid type: ${type}. Valid types are: ${validTypes.join(', ')}`,
        validTypes
      }, { status: 400 })
    }

    // Get current statistics before reset
    const beforeStats = await getDatabaseStats()

    let resetResults = {
      watchedVideos: 0,
      favoriteVideos: 0,
      favoriteChannels: 0,
      videoNotes: 0,
      totalDeleted: 0
    }

    // Perform the reset operations
    try {
      if (type === 'all' || type === 'watched') {
        const watchedResult = await db.watchedVideo.deleteMany({})
        resetResults.watchedVideos = watchedResult.count
      }

      if (type === 'all' || type === 'favorites') {
        const favoriteVideosResult = await db.favoriteVideo.deleteMany({})
        resetResults.favoriteVideos = favoriteVideosResult.count
      }

      if (type === 'all' || type === 'channels') {
        const favoriteChannelsResult = await db.favoriteChannel.deleteMany({})
        resetResults.favoriteChannels = favoriteChannelsResult.count
      }

      if (type === 'all' || type === 'notes') {
        const videoNotesResult = await db.videoNote.deleteMany({})
        resetResults.videoNotes = videoNotesResult.count
      }

      resetResults.totalDeleted = resetResults.watchedVideos + 
                                 resetResults.favoriteVideos + 
                                 resetResults.favoriteChannels + 
                                 resetResults.videoNotes

    } catch (dbError) {
      console.error('Database operation error:', dbError)
      return NextResponse.json({
        error: 'Database operation failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error',
        type,
        beforeStats
      }, { status: 500 })
    }

    // Get statistics after reset
    const afterStats = await getDatabaseStats()

    return NextResponse.json({
      success: true,
      message: `Database reset completed. Deleted ${resetResults.totalDeleted} records.`,
      type,
      timestamp: new Date().toISOString(),
      beforeStats,
      afterStats,
      results: resetResults
    })

  } catch (error) {
    console.error('Database reset error:', error)
    return NextResponse.json({ 
      error: 'Failed to reset database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const stats = await getDatabaseStats()
    
    return NextResponse.json({
      success: true,
      message: 'Database reset endpoint available. Use POST to reset data.',
      availableOperations: {
        reset: {
          method: 'POST',
          description: 'Reset database data',
          parameters: {
            confirm: 'boolean (required) - Set to true to proceed',
            type: 'string (optional) - Type of reset: all, watched, favorites, channels, notes',
            backup: 'boolean (optional) - Create backup before reset (future feature)'
          },
          example: { "confirm": true, "type": "all" }
        }
      },
      currentStats: stats,
      warning: 'Reset operations are permanent and cannot be undone.'
    })

  } catch (error) {
    console.error('Database reset info error:', error)
    return NextResponse.json({ 
      error: 'Failed to get reset information',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function getDatabaseStats() {
  const [
    watchedCount,
    favoriteVideosCount,
    favoriteChannelsCount,
    notesCount,
    archivedNotesCount
  ] = await Promise.all([
    db.watchedVideo.count(),
    db.favoriteVideo.count(),
    db.favoriteChannel.count(),
    db.videoNote.count(),
    db.videoNote.count({ where: { isArchived: true } })
  ])

  return {
    watchedVideos: watchedCount,
    favoriteVideos: favoriteVideosCount,
    favoriteChannels: favoriteChannelsCount,
    totalNotes: notesCount,
    archivedNotes: archivedNotesCount,
    activeNotes: notesCount - archivedNotesCount
  }
}