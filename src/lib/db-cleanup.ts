import { db } from './db'

export interface DatabaseStats {
  watchedVideos: number
  favoriteChannels: number
  favoriteVideos: number
  videoNotes: number
  archivedNotes: number
  oldestRecord?: string
  newestRecord?: string
}

export async function getDatabaseStats(): Promise<DatabaseStats> {
  try {
    const [
      watchedCount,
      channelsCount,
      videosCount,
      notesCount,
      archivedCount,
      oldestResult,
      newestResult
    ] = await Promise.all([
      db.watchedVideo.count(),
      db.favoriteChannel.count(),
      db.favoriteVideo.count(),
      db.videoNote.count(),
      db.videoNote.count({ where: { isArchived: true } }),
      db.watchedVideo.aggregate({
        _min: { watchedAt: true },
        _max: { watchedAt: true }
      }),
      db.watchedVideo.aggregate({
        _min: { watchedAt: true },
        _max: { watchedAt: true }
      })
    ])

    return {
      watchedVideos: watchedCount,
      favoriteChannels: channelsCount,
      favoriteVideos: videosCount,
      videoNotes: notesCount,
      archivedNotes: archivedCount,
      oldestRecord: oldestResult._min.watchedAt?.toISOString(),
      newestRecord: newestResult._max.watchedAt?.toISOString()
    }
  } catch (error) {
    console.error('Failed to get database stats:', error)
    throw error
  }
}

export async function cleanOldWatchedVideos(daysToKeep: number = 30): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  const result = await db.watchedVideo.deleteMany({
    where: {
      watchedAt: {
        lt: cutoffDate
      }
    }
  })

  return result.count
}

export async function removeArchivedNotes(): Promise<number> {
  const result = await db.videoNote.deleteMany({
    where: {
      isArchived: true
    }
  })

  return result.count
}

export async function removeDuplicateWatchedVideos(): Promise<number> {
  // Find duplicates by videoId and keep only the newest one
  const duplicates = await db.$queryRaw`
    WITH duplicates AS (
      SELECT videoId, MAX(id) as keepId, COUNT(*) as count
      FROM WatchedVideo
      GROUP BY videoId
      HAVING count > 1
    )
    SELECT videoId, keepId
    FROM duplicates
  ` as Array<{ videoId: string; keepId: string }>

  let totalDeleted = 0

  for (const duplicate of duplicates) {
    const result = await db.watchedVideo.deleteMany({
      where: {
        videoId: duplicate.videoId,
        id: {
          not: duplicate.keepId
        }
      }
    })
    totalDeleted += result.count
  }

  return totalDeleted
}

export async function removeDuplicateFavoriteVideos(): Promise<number> {
  // Find duplicates by videoId and keep only the newest one
  const duplicates = await db.$queryRaw`
    WITH duplicates AS (
      SELECT videoId, MAX(id) as keepId, COUNT(*) as count
      FROM FavoriteVideo
      GROUP BY videoId
      HAVING count > 1
    )
    SELECT videoId, keepId
    FROM duplicates
  ` as Array<{ videoId: string; keepId: string }>

  let totalDeleted = 0

  for (const duplicate of duplicates) {
    const result = await db.favoriteVideo.deleteMany({
      where: {
        videoId: duplicate.videoId,
        id: {
          not: duplicate.keepId
        }
      }
    })
    totalDeleted += result.count
  }

  return totalDeleted
}

export async function removeDuplicateFavoriteChannels(): Promise<number> {
  // Find duplicates by channelId and keep only the newest one
  const duplicates = await db.$queryRaw`
    WITH duplicates AS (
      SELECT channelId, MAX(id) as keepId, COUNT(*) as count
      FROM FavoriteChannel
      GROUP BY channelId
      HAVING count > 1
    )
    SELECT channelId, keepId
    FROM duplicates
  ` as Array<{ channelId: string; keepId: string }>

  let totalDeleted = 0

  for (const duplicate of duplicates) {
    const result = await db.favoriteChannel.deleteMany({
      where: {
        channelId: duplicate.channelId,
        id: {
          not: duplicate.keepId
        }
      }
    })
    totalDeleted += result.count
  }

  return totalDeleted
}

export async function vacuumDatabase(): Promise<void> {
  await db.$executeRaw`VACUUM`
}

export async function analyzeDatabase(): Promise<void> {
  await db.$executeRaw`ANALYZE`
}

export async function fullDatabaseCleanup(options: {
  daysToKeep?: number
  removeArchived?: boolean
  removeDuplicates?: boolean
  vacuum?: boolean
} = {}): Promise<{
  stats: DatabaseStats
  cleaned: {
    oldWatchedVideos: number
    archivedNotes: number
    duplicateWatchedVideos: number
    duplicateFavoriteVideos: number
    duplicateFavoriteChannels: number
  }
}> {
  const {
    daysToKeep = 30,
    removeArchived = true,
    removeDuplicates = true,
    vacuum = true
  } = options

  // Get initial stats
  const initialStats = await getDatabaseStats()

  // Perform cleanup operations
  const [
    oldWatchedVideos,
    archivedNotes,
    duplicateWatchedVideos,
    duplicateFavoriteVideos,
    duplicateFavoriteChannels
  ] = await Promise.all([
    cleanOldWatchedVideos(daysToKeep),
    removeArchived ? removeArchivedNotes() : 0,
    removeDuplicates ? removeDuplicateWatchedVideos() : 0,
    removeDuplicates ? removeDuplicateFavoriteVideos() : 0,
    removeDuplicates ? removeDuplicateFavoriteChannels() : 0
  ])

  // Optimize database
  if (vacuum) {
    await vacuumDatabase()
    await analyzeDatabase()
  }

  // Get final stats
  const finalStats = await getDatabaseStats()

  return {
    stats: finalStats,
    cleaned: {
      oldWatchedVideos,
      archivedNotes,
      duplicateWatchedVideos,
      duplicateFavoriteVideos,
      duplicateFavoriteChannels
    }
  }
}