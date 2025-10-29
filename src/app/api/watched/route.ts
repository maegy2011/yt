import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const watchedVideos = await db.watchedVideo.findMany({
      orderBy: { watchedAt: 'desc' }
    })
    return NextResponse.json(watchedVideos)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch watched videos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoId, title, channelName, thumbnail, duration, viewCount } = body

    const existing = await db.watchedVideo.findUnique({
      where: { videoId }
    })

    if (existing) {
      // Delete the existing record to keep only the latest
      await db.watchedVideo.delete({
        where: { videoId }
      })
    }

    // Create new record with latest data
    const watchedVideo = await db.watchedVideo.create({
      data: {
        videoId,
        title,
        channelName,
        thumbnail,
        duration,
        viewCount
      }
    })

    return NextResponse.json(watchedVideo)
  } catch (error) {
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