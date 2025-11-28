import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeVideoId, isValidYouTubeVideoId } from '@/lib/youtube-utils'

// Get single watched video
export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params
    const sanitizedVideoId = sanitizeVideoId(videoId)

    if (!sanitizedVideoId) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
    }

    const video = await db.watchedVideo.findUnique({
      where: { videoId: sanitizedVideoId }
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json(video)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get watched video' }, { status: 500 })
  }
}

// Update watched video
export async function PUT(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params
    const sanitizedVideoId = sanitizeVideoId(videoId)

    if (!sanitizedVideoId) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
    }

    const body = await request.json()
    const { title, channelName, thumbnail, duration, viewCount } = body

    const existing = await db.watchedVideo.findUnique({
      where: { videoId: sanitizedVideoId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const updatedVideo = await db.watchedVideo.update({
      where: { videoId: sanitizedVideoId },
      data: {
        title: title !== undefined ? title : existing.title,
        channelName: channelName !== undefined ? channelName : existing.channelName,
        thumbnail: thumbnail !== undefined ? thumbnail : existing.thumbnail,
        duration: duration !== undefined ? duration : existing.duration,
        viewCount: viewCount !== undefined ? viewCount : existing.viewCount,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedVideo)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update watched video' }, { status: 500 })
  }
}

// Delete watched video
export async function DELETE(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params
    const sanitizedVideoId = sanitizeVideoId(videoId)

    if (!sanitizedVideoId) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
    }

    const existing = await db.watchedVideo.findUnique({
      where: { videoId: sanitizedVideoId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    await db.watchedVideo.delete({
      where: { videoId: sanitizedVideoId }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Watched video deleted successfully' 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete watched video' }, { status: 500 })
  }
}