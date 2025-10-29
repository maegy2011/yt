import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { daysToKeep = 30, dryRun = false } = body

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    let cleanupResults = {
      oldWatchedVideos: 0,
      archivedNotes: 0,
      orphanedFavorites: 0,
      duplicateChannels: 0,
      totalRemoved: 0
    }

    if (!dryRun) {
      // 1. Clean up old watched videos (older than specified days)
      const oldWatchedVideos = await db.watchedVideo.deleteMany({
        where: {
          watchedAt: {
            lt: cutoffDate
          }
        }
      })
      cleanupResults.oldWatchedVideos = oldWatchedVideos.count

      // 2. Clean up archived notes older than specified days
      const archivedNotes = await db.videoNote.deleteMany({
        where: {
          isArchived: true,
          updatedAt: {
            lt: cutoffDate
          }
        }
      })
      cleanupResults.archivedNotes = archivedNotes.count

      // 3. Remove orphaned favorite videos (videos that are no longer in watched)
      const allFavoriteVideos = await db.favoriteVideo.findMany()
      let orphanedFavoritesRemoved = 0

      for (const favorite of allFavoriteVideos) {
        const watchedExists = await db.watchedVideo.findUnique({
          where: { videoId: favorite.videoId }
        })
        
        if (!watchedExists) {
          await db.favoriteVideo.delete({
            where: { id: favorite.id }
          })
          orphanedFavoritesRemoved++
        }
      }
      cleanupResults.orphanedFavorites = orphanedFavoritesRemoved

      // 4. Remove duplicate channels
      const allChannels = await db.favoriteChannel.findMany()
      const channelMap = new Map<string, any[]>()
      
      allChannels.forEach(channel => {
        const channelId = channel.channelId
        if (!channelMap.has(channelId)) {
          channelMap.set(channelId, [])
        }
        channelMap.get(channelId)!.push(channel)
      })

      let duplicateChannelsRemoved = 0
      for (const [channelId, channels] of channelMap.entries()) {
        if (channels.length > 1) {
          // Keep the most recently added one
          const sortedChannels = channels.sort((a, b) => 
            new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
          )
          const duplicatesToDelete = sortedChannels.slice(1)
          
          for (const duplicate of duplicatesToDelete) {
            await db.favoriteChannel.delete({
              where: { id: duplicate.id }
            })
            duplicateChannelsRemoved++
          }
        }
      }
      cleanupResults.duplicateChannels = duplicateChannelsRemoved

      cleanupResults.totalRemoved = cleanupResults.oldWatchedVideos + 
                                  cleanupResults.archivedNotes + 
                                  cleanupResults.orphanedFavorites + 
                                  cleanupResults.duplicateChannels
    } else {
      // Dry run - just count what would be removed
      const oldWatchedVideosCount = await db.watchedVideo.count({
        where: {
          watchedAt: {
            lt: cutoffDate
          }
        }
      })
      cleanupResults.oldWatchedVideos = oldWatchedVideosCount

      const archivedNotesCount = await db.videoNote.count({
        where: {
          isArchived: true,
          updatedAt: {
            lt: cutoffDate
          }
        }
      })
      cleanupResults.archivedNotes = archivedNotesCount

      const allFavoriteVideos = await db.favoriteVideo.findMany()
      let orphanedFavoritesCount = 0

      for (const favorite of allFavoriteVideos) {
        const watchedExists = await db.watchedVideo.findUnique({
          where: { videoId: favorite.videoId }
        })
        
        if (!watchedExists) {
          orphanedFavoritesCount++
        }
      }
      cleanupResults.orphanedFavorites = orphanedFavoritesCount

      const allChannels = await db.favoriteChannel.findMany()
      const channelMap = new Map<string, any[]>()
      
      allChannels.forEach(channel => {
        const channelId = channel.channelId
        if (!channelMap.has(channelId)) {
          channelMap.set(channelId, [])
        }
        channelMap.get(channelId)!.push(channel)
      })

      let duplicateChannelsCount = 0
      for (const [channelId, channels] of channelMap.entries()) {
        if (channels.length > 1) {
          duplicateChannelsCount += channels.length - 1
        }
      }
      cleanupResults.duplicateChannels = duplicateChannelsCount

      cleanupResults.totalRemoved = cleanupResults.oldWatchedVideos + 
                                  cleanupResults.archivedNotes + 
                                  cleanupResults.orphanedFavorites + 
                                  cleanupResults.duplicateChannels
    }

    return NextResponse.json({
      success: true,
      message: dryRun 
        ? `Dry run completed. Would remove ${cleanupResults.totalRemoved} records older than ${daysToKeep} days.`
        : `Database cleanup completed. Removed ${cleanupResults.totalRemoved} records older than ${daysToKeep} days.`,
      cutoffDate: cutoffDate.toISOString(),
      daysToKeep,
      dryRun,
      results: cleanupResults
    })

  } catch (error) {
    console.error('Database cleanup error:', error)
    return NextResponse.json({ 
      error: 'Failed to cleanup database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get current database statistics
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

    // Get oldest records
    const [
      oldestWatched,
      newestWatched,
      oldestNote,
      newestNote
    ] = await Promise.all([
      db.watchedVideo.findFirst({ orderBy: { watchedAt: 'asc' } }),
      db.watchedVideo.findFirst({ orderBy: { watchedAt: 'desc' } }),
      db.videoNote.findFirst({ orderBy: { createdAt: 'asc' } }),
      db.videoNote.findFirst({ orderBy: { createdAt: 'desc' } })
    ])

    return NextResponse.json({
      success: true,
      statistics: {
        watchedVideos: watchedCount,
        favoriteVideos: favoriteVideosCount,
        favoriteChannels: favoriteChannelsCount,
        totalNotes: notesCount,
        archivedNotes: archivedNotesCount,
        activeNotes: notesCount - archivedNotesCount
      },
      dateRanges: {
        watchedVideos: {
          oldest: oldestWatched?.watchedAt || oldestWatched?.createdAt,
          newest: newestWatched?.watchedAt || newestWatched?.createdAt
        },
        notes: {
          oldest: oldestNote?.createdAt,
          newest: newestNote?.createdAt
        }
      }
    })

  } catch (error) {
    console.error('Database statistics error:', error)
    return NextResponse.json({ 
      error: 'Failed to get database statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}