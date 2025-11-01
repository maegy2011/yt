import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeVideoId, isValidYouTubeVideoId } from '@/lib/youtube-utils'

export async function GET() {
  try {
    const watchedVideos = await db.watchedVideo.findMany({
      orderBy: { watchedAt: 'desc' }
    })
    
    // Filter out any entries with invalid video IDs
    const validVideos = watchedVideos.filter(video => 
      video.videoId && isValidYouTubeVideoId(video.videoId)
    )
    
    // Clean up invalid entries from database
    const invalidVideos = watchedVideos.filter(video => 
      !video.videoId || !isValidYouTubeVideoId(video.videoId)
    )
    
    if (invalidVideos.length > 0) {
      console.log(`Cleaning up ${invalidVideos.length} invalid watched video entries`)
      await Promise.all(
        invalidVideos.map(video => 
          db.watchedVideo.delete({ where: { id: video.id } })
        )
      )
    }
    
    return NextResponse.json(validVideos)
  } catch (error) {
    console.error('Failed to fetch watched videos:', error)
    return NextResponse.json({ error: 'Failed to fetch watched videos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoId, title, channelName, thumbnail, duration, viewCount } = body

    // Validate and sanitize the video ID
    const sanitizedVideoId = sanitizeVideoId(videoId)
    
    if (!sanitizedVideoId) {
      console.error('Invalid video ID provided:', videoId)
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
    }

    // Check if video already exists
    const existing = await db.watchedVideo.findUnique({
      where: { videoId: sanitizedVideoId }
    })

    if (existing) {
      // Update the existing record with latest data and timestamp
      const updatedVideo = await db.watchedVideo.update({
        where: { videoId: sanitizedVideoId },
        data: {
          title: title || existing.title,
          channelName: channelName || existing.channelName,
          thumbnail: thumbnail || existing.thumbnail,
          duration: duration || existing.duration,
          viewCount: viewCount || existing.viewCount,
          watchedAt: new Date(), // Update watchedAt to current time
          updatedAt: new Date()
        }
      })
      return NextResponse.json(updatedVideo)
    }

    // Create new record with validated data
    const watchedVideo = await db.watchedVideo.create({
      data: {
        videoId: sanitizedVideoId,
        title: title || 'Unknown Video',
        channelName: channelName || 'Unknown Channel',
        thumbnail: thumbnail || '',
        duration,
        viewCount
      }
    })

    return NextResponse.json(watchedVideo)
  } catch (error) {
    console.error('Failed to add watched video:', error)
    return NextResponse.json({ error: 'Failed to add watched video' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 })
    }

    await db.watchedVideo.delete({
      where: { videoId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete watched video' }, { status: 500 })
  }
}