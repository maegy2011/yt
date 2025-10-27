import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Get all watched videos ordered by creation date
    const allWatchedVideos = await db.watchedVideo.findMany({
      orderBy: { createdAt: 'asc' }
    })

    // Group by videoId to find duplicates
    const videoMap = new Map<string, any[]>()
    allWatchedVideos.forEach(video => {
      const videoId = video.videoId
      if (!videoMap.has(videoId)) {
        videoMap.set(videoId, [])
      }
      videoMap.get(videoId)!.push(video)
    })

    let duplicatesRemoved = 0
    let videosUpdated = 0

    // Process each group
    for (const [videoId, videos] of videoMap.entries()) {
      if (videos.length > 1) {
        // Keep the most recently watched one (based on watchedAt or createdAt)
        const sortedVideos = videos.sort((a, b) => {
          const dateA = new Date(a.watchedAt || a.createdAt).getTime()
          const dateB = new Date(b.watchedAt || b.createdAt).getTime()
          return dateB - dateA // Most recent first
        })

        const keepVideo = sortedVideos[0]
        const duplicatesToDelete = sortedVideos.slice(1)

        // Delete duplicates
        for (const duplicate of duplicatesToDelete) {
          await db.watchedVideo.delete({
            where: { id: duplicate.id }
          })
          duplicatesRemoved++
        }

        // Update the kept video with the latest data if needed
        const latestData = sortedVideos.reduce((latest, current) => {
          const latestDate = new Date(latest.updatedAt).getTime()
          const currentDate = new Date(current.updatedAt).getTime()
          return currentDate > latestDate ? current : latest
        })

        if (latestData.id !== keepVideo.id) {
          await db.watchedVideo.update({
            where: { id: keepVideo.id },
            data: {
              title: latestData.title,
              channelName: latestData.channelName,
              thumbnail: latestData.thumbnail,
              duration: latestData.duration,
              viewCount: latestData.viewCount,
              watchedAt: new Date(latestData.watchedAt || latestData.createdAt)
            }
          })
          videosUpdated++
        }
      } else {
        // Ensure single videos have proper watchedAt
        const video = videos[0]
        if (!video.watchedAt) {
          await db.watchedVideo.update({
            where: { id: video.id },
            data: {
              watchedAt: video.createdAt
            }
          })
          videosUpdated++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup completed. Removed ${duplicatesRemoved} duplicates, updated ${videosUpdated} videos.`,
      totalVideos: videoMap.size,
      duplicatesRemoved,
      videosUpdated
    })
  } catch (error) {
    console.error('Error cleaning up watched videos:', error)
    return NextResponse.json({ error: 'Failed to cleanup watched videos' }, { status: 500 })
  }
}