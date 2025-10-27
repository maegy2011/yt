import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const watchedVideos = await db.watchedVideo.findMany({
      orderBy: { watchedAt: 'desc' }
    })
    
    // Sanitize data to prevent JSON serialization issues
    const sanitizedVideos = watchedVideos.map(video => ({
      ...video,
      title: video.title || '',
      channelName: video.channelName || '',
      thumbnail: video.thumbnail || '',
      duration: video.duration || '',
      viewCount: video.viewCount || 0
    }))
    
    return NextResponse.json(sanitizedVideos)
  } catch (error) {
    console.error('Error fetching watched videos:', error)
    return NextResponse.json({ error: 'Failed to fetch watched videos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoId, title, channelName, thumbnail, duration, viewCount } = body

    if (!videoId || !title || !channelName) {
      return NextResponse.json({ error: 'Missing required fields: videoId, title, channelName' }, { status: 400 })
    }

    // Sanitize input data
    const sanitizedData = {
      videoId: String(videoId).trim(),
      title: String(title).trim(),
      channelName: String(channelName).trim(),
      thumbnail: thumbnail ? String(thumbnail).trim() : '',
      duration: duration ? String(duration).trim() : '',
      viewCount: viewCount ? Number(viewCount) : 0
    }

    const existing = await db.watchedVideo.findUnique({
      where: { videoId: sanitizedData.videoId }
    })

    if (existing) {
      // Update the existing watched video with new timestamp and data
      const updatedVideo = await db.watchedVideo.update({
        where: { videoId: sanitizedData.videoId },
        data: {
          ...sanitizedData,
          watchedAt: new Date() // Update watchedAt to current time
        }
      })
      return NextResponse.json(updatedVideo)
    }

    const watchedVideo = await db.watchedVideo.create({
      data: {
        ...sanitizedData,
        watchedAt: new Date() // Explicitly set watchedAt
      }
    })

    return NextResponse.json(watchedVideo)
  } catch (error) {
    console.error('Error adding watched video:', error)
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