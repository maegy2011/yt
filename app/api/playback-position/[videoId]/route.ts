import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/playback-position/[videoId] - Get playback position for a video
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params

    const playbackPosition = await db.videoPlaybackPosition.findUnique({
      where: { videoId }
    })

    if (!playbackPosition) {
      return NextResponse.json({ 
        currentTime: 0, 
        duration: 0,
        exists: false 
      })
    }

    // Convert Date objects to strings for JSON serialization
    const formattedPosition = {
      ...playbackPosition,
      lastWatched: playbackPosition.lastWatched.toISOString(),
      createdAt: playbackPosition.createdAt.toISOString(),
      updatedAt: playbackPosition.updatedAt.toISOString()
    }

    return NextResponse.json({
      ...formattedPosition,
      exists: true
    })
  } catch (error) {
    // Console statement removed
    return NextResponse.json(
      { error: 'Failed to fetch playback position' },
      { status: 500 }
    )
  }
}

// PUT /api/playback-position/[videoId] - Update playback position for a video
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params
    const body = await request.json()
    const { title, channelName, thumbnail, duration, currentTime } = body

    if (!title || !channelName || duration === undefined || currentTime === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: title, channelName, duration, currentTime' },
        { status: 400 }
      )
    }

    const playbackPosition = await db.videoPlaybackPosition.upsert({
      where: { videoId },
      update: {
        title,
        channelName,
        thumbnail,
        duration,
        currentTime,
        lastWatched: new Date(),
        updatedAt: new Date()
      },
      create: {
        videoId,
        title,
        channelName,
        thumbnail,
        duration,
        currentTime,
        lastWatched: new Date()
      }
    })

    // Convert Date objects to strings for JSON serialization
    const formattedPosition = {
      ...playbackPosition,
      lastWatched: playbackPosition.lastWatched.toISOString(),
      createdAt: playbackPosition.createdAt.toISOString(),
      updatedAt: playbackPosition.updatedAt.toISOString()
    }

    return NextResponse.json(formattedPosition)
  } catch (error) {
    // Console statement removed
    return NextResponse.json(
      { error: 'Failed to update playback position' },
      { status: 500 }
    )
  }
}

// DELETE /api/playback-position/[videoId] - Delete playback position for a video
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params

    const playbackPosition = await db.videoPlaybackPosition.delete({
      where: { videoId }
    })

    return NextResponse.json({ message: 'Playback position deleted successfully' })
  } catch (error) {
    // Console statement removed
    return NextResponse.json(
      { error: 'Failed to delete playback position' },
      { status: 500 }
    )
  }
}