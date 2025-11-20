import { db } from '@/lib/db'

// Enhanced favorite channels module with comprehensive clearing
export class FavoriteChannelsModule {
  static async findAll() {
    try {
      return await db.favoriteChannel.findMany({
        orderBy: { addedAt: 'desc' }
      })
    } catch (error) {

      throw new Error('Failed to fetch favorite channels')
    }
  }

  static async findById(id: string) {
    try {
      return await db.favoriteChannel.findUnique({
        where: { channelId: id }
      })
    } catch (error) {
      console.error('Failed to find favorite channel:', error)
      return null
    }
  }

  static async create(data: {
    channelId: string
    name: string
    thumbnail: string
    subscriberCount?: string
    videoCount?: string
    viewCount?: string
  }) {
    try {
      return await db.favoriteChannel.create({
        data: {
          ...data,
          addedAt: new Date(),
          updatedAt: new Date()
        }
      })
    } catch (error) {

      throw new Error('Failed to create favorite channel')
    }
  }

  static async update(id: string, data: Partial<{
    name?: string
    thumbnail?: string
    subscriberCount?: string
    videoCount?: string
    viewCount?: string
  }>) {
    try {
      return await db.favoriteChannel.update({
        where: { channelId: id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      })
    } catch (error) {

      throw new Error('Failed to update favorite channel')
    }
  }

  static async delete(id: string) {
    try {
      return await db.favoriteChannel.delete({
        where: { channelId: id }
      })
    } catch (error) {

      throw new Error('Failed to delete favorite channel')
    }
  }

  static async deleteMany(ids?: string[]) {
    try {
      if (ids && ids.length > 0) {
        return await db.favoriteChannel.deleteMany({
          where: { channelId: { in: ids } }
        })
      } else {
        return await db.favoriteChannel.deleteMany()
      }
    } catch (error) {

      throw new Error('Failed to delete favorite channels')
    }
  }

  static async deleteAll() {
    try {
      return await db.favoriteChannel.deleteMany()
    } catch (error) {

      throw new Error('Failed to delete all favorite channels')
    }
  }

  static async count() {
    try {
      return await db.favoriteChannel.count()
    } catch (error) {

      return 0
    }
  }
}

// Enhanced favorite videos module with comprehensive clearing
export class FavoriteVideosModule {
  static async findAll() {
    try {
      return await db.favoriteVideo.findMany({
        orderBy: { addedAt: 'desc' }
      })
    } catch (error) {

      throw new Error('Failed to fetch favorite videos')
    }
  }

  static async findById(id: string) {
    try {
      return await db.favoriteVideo.findUnique({
        where: { videoId: id }
      })
    } catch (error) {
      console.error('Failed to find favorite video:', error)
      return null
    }
  }

  static async create(data: {
    videoId: string
    title: string
    channelName: string
    thumbnail: string
    duration?: string
    viewCount?: string
    publishedAt?: string
    description?: string
  }) {
    try {
      return await db.favoriteVideo.create({
        data: {
          ...data,
          addedAt: new Date(),
          updatedAt: new Date()
        }
      })
    } catch (error) {

      throw new Error('Failed to create favorite video')
    }
  }

  static async update(id: string, data: Partial<{
    title?: string
    channelName?: string
    thumbnail?: string
    duration?: string
    viewCount?: string
    publishedAt?: string
    description?: string
  }>) {
    try {
      return await db.favoriteVideo.update({
        where: { videoId: id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      })
    } catch (error) {

      throw new Error('Failed to update favorite video')
    }
  }

  static async delete(id: string) {
    try {
      return await db.favoriteVideo.delete({
        where: { videoId: id }
      })
    } catch (error) {

      throw new Error('Failed to delete favorite video')
    }
  }

  static async deleteMany(ids?: string[]) {
    try {
      if (ids && ids.length > 0) {
        return await db.favoriteVideo.deleteMany({
          where: { videoId: { in: ids } }
        })
      } else {
        return await db.favoriteVideo.deleteMany()
      }
    } catch (error) {

      throw new Error('Failed to delete favorite videos')
    }
  }

  static async deleteAll() {
    try {
      return await db.favoriteVideo.deleteMany()
    } catch (error) {

      throw new Error('Failed to delete all favorite videos')
    }
  }

  static async count() {
    try {
      return await db.favoriteVideo.count()
    } catch (error) {

      return 0
    }
  }
}

// Enhanced video notes module with comprehensive clearing
export class VideoNotesModule {
  static async findAll(videoId?: string) {
    try {
      const where = videoId ? { videoId } : {}
      return await db.videoNote.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {

      throw new Error('Failed to fetch video notes')
    }
  }

  static async findById(id: string) {
    try {
      return await db.videoNote.findUnique({
        where: { id }
      })
    } catch (error) {
      console.error('Failed to find video note:', error)
      return null
    }
  }

  static async create(data: {
    videoId: string
    title: string
    channelName: string
    thumbnail: string
    note: string
    fontSize?: number
    startTime?: number
    endTime?: number
    isClip?: boolean
    notebookId?: string
  }) {
    try {
      return await db.videoNote.create({
        data: {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    } catch (error) {

      throw new Error('Failed to create video note')
    }
  }

  static async update(id: string, data: Partial<{
    title?: string
    note?: string
    fontSize?: number
    startTime?: number
    endTime?: number
    isClip?: boolean
    notebookId?: string
  }>) {
    try {
      return await db.videoNote.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      })
    } catch (error) {

      throw new Error('Failed to update video note')
    }
  }

  static async delete(id: string) {
    try {
      return await db.videoNote.delete({
        where: { id }
      })
    } catch (error) {

      throw new Error('Failed to delete video note')
    }
  }

  static async deleteMany(ids?: string[]) {
    try {
      if (ids && ids.length > 0) {
        return await db.videoNote.deleteMany({
          where: { id: { in: ids } }
        })
      } else {
        return await db.videoNote.deleteMany()
      }
    } catch (error) {

      throw new Error('Failed to delete video notes')
    }
  }

  static async deleteAll() {
    try {
      return await db.videoNote.deleteMany()
    } catch (error) {

      throw new Error('Failed to delete all video notes')
    }
  }

  static async count() {
    try {
      return await db.videoNote.count()
    } catch (error) {

      return 0
    }
  }
}

// Enhanced watched videos module with comprehensive clearing
export class WatchedVideosModule {
  static async findAll() {
    try {
      return await db.watchedVideo.findMany({
        orderBy: { watchedAt: 'desc' }
      })
    } catch (error) {

      throw new Error('Failed to fetch watched videos')
    }
  }

  static async findById(id: string) {
    try {
      return await db.watchedVideo.findUnique({
        where: { videoId: id }
      })
    } catch (error) {
      console.error('Failed to find watched video:', error)
      return null
    }
  }

  static async create(data: {
    videoId: string
    title: string
    channelName: string
    thumbnail: string
    duration?: string
    viewCount?: string
    watchedAt?: Date
  }) {
    try {
      return await db.watchedVideo.create({
        data: {
          ...data,
          watchedAt: data.watchedAt || new Date(),
          updatedAt: new Date()
        }
      })
    } catch (error) {

      throw new Error('Failed to create watched video')
    }
  }

  static async update(id: string, data: Partial<{
    title?: string
    channelName?: string
    thumbnail?: string
    duration?: string
    viewCount?: string
    watchedAt?: Date
  }>) {
    try {
      return await db.watchedVideo.update({
        where: { videoId: id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      })
    } catch (error) {

      throw new Error('Failed to update watched video')
    }
  }

  static async delete(id: string) {
    try {
      return await db.watchedVideo.delete({
        where: { videoId: id }
      })
    } catch (error) {

      throw new Error('Failed to delete watched video')
    }
  }

  static async deleteMany(ids?: string[]) {
    try {
      if (ids && ids.length > 0) {
        return await db.watchedVideo.deleteMany({
          where: { videoId: { in: ids } }
        })
      } else {
        return await db.watchedVideo.deleteMany()
      }
    } catch (error) {

      throw new Error('Failed to delete watched videos')
    }
  }

  static async deleteAll() {
    try {
      return await db.watchedVideo.deleteMany()
    } catch (error) {

      throw new Error('Failed to delete all watched videos')
    }
  }

  static async count() {
    try {
      return await db.watchedVideo.count()
    } catch (error) {

      return 0
    }
  }
}

// Enhanced notebooks module with comprehensive clearing
export class NotebooksModule {
  static async findAll() {
    try {
      return await db.notebook.findMany({
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {

      throw new Error('Failed to fetch notebooks')
    }
  }

  static async findById(id: string) {
    try {
      return await db.notebook.findUnique({
        where: { id }
      })
    } catch (error) {
      console.error('Failed to find notebook:', error)
      return null
    }
  }

  static async create(data: {
    title: string
    description?: string
    color?: string
    isPublic?: boolean
    tags?: string
  }) {
    try {
      return await db.notebook.create({
        data: {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    } catch (error) {

      throw new Error('Failed to create notebook')
    }
  }

  static async update(id: string, data: Partial<{
    title?: string
    description?: string
    color?: string
    isPublic?: boolean
    tags?: string
  }>) {
    try {
      return await db.notebook.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      })
    } catch (error) {

      throw new Error('Failed to update notebook')
    }
  }

  static async delete(id: string) {
    try {
      return await db.notebook.delete({
        where: { id }
      })
    } catch (error) {

      throw new Error('Failed to delete notebook')
    }
  }

  static async deleteMany(ids?: string[]) {
    try {
      if (ids && ids.length > 0) {
        return await db.notebook.deleteMany({
          where: { id: { in: ids } }
        })
      } else {
        return await db.notebook.deleteMany()
      }
    } catch (error) {

      throw new Error('Failed to delete notebooks')
    }
  }

  static async deleteAll() {
    try {
      return await db.notebook.deleteMany()
    } catch (error) {

      throw new Error('Failed to delete all notebooks')
    }
  }

  static async count() {
    try {
      return await db.notebook.count()
    } catch (error) {

      return 0
    }
  }
}

// Enhanced playback positions module with comprehensive clearing
export class PlaybackPositionsModule {
  static async findAll() {
    try {
      return await db.videoPlaybackPosition?.findMany({
        orderBy: { lastWatched: 'desc' }
      }) || []
    } catch (error) {

      return []
    }
  }

  static async findById(videoId: string) {
    try {
      return await db.videoPlaybackPosition?.findUnique({
        where: { videoId }
      }) || null
    } catch (error) {
      console.error('Failed to find playback position:', error)
      return null
    }
  }

  static async create(data: {
    videoId: string
    title: string
    channelName: string
    thumbnail: string
    duration: number
    currentTime: number
  }) {
    try {
      return await db.videoPlaybackPosition?.create({
        data: {
          ...data,
          lastWatched: new Date(),
          updatedAt: new Date()
        }
      }) || null
    } catch (error) {

      throw new Error('Failed to create playback position')
    }
  }

  static async update(videoId: string, data: Partial<{
    title?: string
    channelName?: string
    thumbnail?: string
    duration?: number
    currentTime?: number
  }>) {
    try {
      return await db.videoPlaybackPosition?.update({
        where: { videoId },
        data: {
          ...data,
          lastWatched: new Date(),
          updatedAt: new Date()
        }
      }) || null
    } catch (error) {

      throw new Error('Failed to update playback position')
    }
  }

  static async delete(videoId: string) {
    try {
      return await db.videoPlaybackPosition?.delete({
        where: { videoId }
      }) || null
    } catch (error) {

      throw new Error('Failed to delete playback position')
    }
  }

  static async deleteMany(videoIds?: string[]) {
    try {
      if (videoIds && videoIds.length > 0) {
        return await db.videoPlaybackPosition?.deleteMany({
          where: { videoId: { in: videoIds } }
        }) || { count: 0 }
      } else {
        return await db.videoPlaybackPosition?.deleteMany() || { count: 0 }
      }
    } catch (error) {

      throw new Error('Failed to delete playback positions')
    }
  }

  static async deleteAll() {
    try {
      return await db.videoPlaybackPosition?.deleteMany() || { count: 0 }
    } catch (error) {

      throw new Error('Failed to delete all playback positions')
    }
  }

  static async count() {
    try {
      return await db.videoPlaybackPosition?.count() || 0
    } catch (error) {

      return 0
    }
  }
}

// Comprehensive data management module
export class DataManager {
  static async getStatistics() {
    try {
      const [
        favoriteChannels,
        favoriteVideos,
        videoNotes,
        watchedVideos,
        notebooks,
        playbackPositions
      ] = await Promise.all([
        FavoriteChannelsModule.count(),
        FavoriteVideosModule.count(),
        VideoNotesModule.count(),
        WatchedVideosModule.count(),
        NotebooksModule.count(),
        PlaybackPositionsModule.count()
      ])

      return {
        favoriteChannels,
        favoriteVideos,
        videoNotes,
        watchedVideos,
        notebooks,
        playbackPositions,
        total: favoriteChannels + favoriteVideos + videoNotes + watchedVideos + notebooks + playbackPositions
      }
    } catch (error) {

      throw new Error('Failed to get data statistics')
    }
  }

  static async clearAll() {
    try {
      const [
        favoriteChannels,
        favoriteVideos,
        videoNotes,
        watchedVideos,
        notebooks,
        playbackPositions
      ] = await Promise.all([
        FavoriteChannelsModule.deleteAll(),
        FavoriteVideosModule.deleteAll(),
        VideoNotesModule.deleteAll(),
        WatchedVideosModule.deleteAll(),
        NotebooksModule.deleteAll(),
        PlaybackPositionsModule.deleteAll()
      ])

      return {
        success: true,
        deleted: {
          favoriteChannels: favoriteChannels.count,
          favoriteVideos: favoriteVideos.count,
          videoNotes: videoNotes.count,
          watchedVideos: watchedVideos.count,
          notebooks: notebooks.count,
          playbackPositions: playbackPositions.count,
          total: favoriteChannels.count + favoriteVideos.count + videoNotes.count + watchedVideos.count + notebooks.count + playbackPositions.count
        }
      }
    } catch (error) {

      throw new Error('Failed to clear all data')
    }
  }

  static async clearSelective(options: {
    favoriteChannels?: boolean
    favoriteVideos?: boolean
    videoNotes?: boolean
    watchedVideos?: boolean
    notebooks?: boolean
    playbackPositions?: boolean
  }) {
    try {
      const results = await Promise.allSettled([
        options.favoriteChannels ? FavoriteChannelsModule.deleteAll() : Promise.resolve({ count: 0 }),
        options.favoriteVideos ? FavoriteVideosModule.deleteAll() : Promise.resolve({ count: 0 }),
        options.videoNotes ? VideoNotesModule.deleteAll() : Promise.resolve({ count: 0 }),
        options.watchedVideos ? WatchedVideosModule.deleteAll() : Promise.resolve({ count: 0 }),
        options.notebooks ? NotebooksModule.deleteAll() : Promise.resolve({ count: 0 }),
        options.playbackPositions ? PlaybackPositionsModule.deleteAll() : Promise.resolve({ count: 0 })
      ])

      const deleted = {
        favoriteChannels: results[0].status === 'fulfilled' ? results[0].value.count : 0,
        favoriteVideos: results[1].status === 'fulfilled' ? results[1].value.count : 0,
        videoNotes: results[2].status === 'fulfilled' ? results[2].value.count : 0,
        watchedVideos: results[3].status === 'fulfilled' ? results[3].value.count : 0,
        notebooks: results[4].status === 'fulfilled' ? results[4].value.count : 0,
        playbackPositions: results[5].status === 'fulfilled' ? results[5].value.count : 0,
        total: 0
      }

      // Calculate total
      deleted.total = Object.values(deleted).reduce((sum, count) => sum + count, 0)

      return {
        success: true,
        deleted,
        totalDeleted: deleted.total
      }
    } catch (error) {

      throw new Error('Failed to clear selective data')
    }
  }

  static async clearBatch(operations: Array<{
    type: 'favoriteChannels' | 'favoriteVideos' | 'videoNotes' | 'watchedVideos' | 'notebooks' | 'playbackPositions'
    ids?: string[]
  }>) {
    try {
      const results = await Promise.allSettled(operations.map(async (op) => {
        switch (op.type) {
          case 'favoriteChannels':
            return op.ids ? FavoriteChannelsModule.deleteMany(op.ids) : FavoriteChannelsModule.deleteAll()
          case 'favoriteVideos':
            return op.ids ? FavoriteVideosModule.deleteMany(op.ids) : FavoriteVideosModule.deleteAll()
          case 'videoNotes':
            return op.ids ? VideoNotesModule.deleteMany(op.ids) : VideoNotesModule.deleteAll()
          case 'watchedVideos':
            return op.ids ? WatchedVideosModule.deleteMany(op.ids) : WatchedVideosModule.deleteAll()
          case 'notebooks':
            return op.ids ? NotebooksModule.deleteMany(op.ids) : NotebooksModule.deleteAll()
          case 'playbackPositions':
            return op.ids ? PlaybackPositionsModule.deleteMany(op.ids) : PlaybackPositionsModule.deleteAll()
          default:
            return { count: 0 }
        }
      }))

      return {
        success: true,
        results: results.map((result, index) => ({
          operation: operations[index],
          status: result.status,
          count: result.status === 'fulfilled' ? result.value.count : 0,
          error: result.status === 'rejected' ? result.reason : null
        })),
        totalDeleted: results.reduce((sum, result) => {
          const count = result.status === 'fulfilled' ? result.value.count : 0
          return sum + count
        }, 0)
      }
    } catch (error) {
      throw new Error('Failed to clear batch data')
    }
  }
}
