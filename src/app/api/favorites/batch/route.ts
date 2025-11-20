import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeVideoId, isValidYouTubeVideoId } from '@/lib/youtube-utils'

// Batch delete favorite videos
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoIds } = body

    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return NextResponse.json({ error: 'Video IDs array required' }, { status: 400 })
    }

    // Validate and sanitize all video IDs
    const sanitizedIds = videoIds
      .map(id => sanitizeVideoId(id))
      .filter(id => id !== null) as string[]

    if (sanitizedIds.length === 0) {
      return NextResponse.json({ error: 'No valid video IDs provided' }, { status: 400 })
    }

    // Delete videos
    const result = await db.favoriteVideo.deleteMany({
      where: {
        videoId: {
          in: sanitizedIds
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.count,
      message: `Deleted ${result.count} favorite videos`
    })
  } catch (error) {
    console.error('Failed to batch delete favorite videos:', error)
    return NextResponse.json({ error: 'Failed to delete favorite videos' }, { status: 500 })
  }
}

// Batch update favorite videos
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { videos } = body

    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      return NextResponse.json({ error: 'Videos array required' }, { status: 400 })
    }

    const updatedVideos: any[] = []
    const errors: any[] = []

    for (const video of videos) {
      try {
        const sanitizedVideoId = sanitizeVideoId(video.videoId)
        
        if (!sanitizedVideoId) {
          errors.push({ videoId: video.videoId, error: 'Invalid video ID' })
          continue
        }

        const existing = await db.favoriteVideo.findUnique({
          where: { videoId: sanitizedVideoId }
        })

        if (existing) {
          const updated = await db.favoriteVideo.update({
            where: { videoId: sanitizedVideoId },
            data: {
              title: video.title || existing.title,
              channelName: video.channelName || existing.channelName,
              thumbnail: video.thumbnail || existing.thumbnail,
              duration: video.duration || existing.duration,
              viewCount: video.viewCount || existing.viewCount,
              updatedAt: new Date()
            }
          })
          updatedVideos.push(updated)
        } else {
          errors.push({ videoId: sanitizedVideoId, error: 'Video not found' })
        }
      } catch (error) {
        errors.push({ videoId: video.videoId, error: 'Update failed' })
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount: updatedVideos.length,
      errorCount: errors.length,
      updatedVideos,
      errors
    })
  } catch (error) {
    console.error('Failed to batch update favorite videos:', error)
    return NextResponse.json({ error: 'Failed to update favorite videos' }, { status: 500 })
  }
}