import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'youtubei'

const youtube = new Client()

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const video = await youtube.getVideo(params.videoId)
    
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }
    
    // Extract only the necessary data to avoid circular references
    const sanitizedVideo = {
      id: video.id || '',
      title: video.title || '',
      description: video.description || '',
      thumbnail: video.thumbnail || video.thumbnails?.[0] || null,
      duration: video.duration || null,
      viewCount: video.viewCount || 0,
      publishedAt: video.publishedAt || null,
      isLive: video.isLive || false,
      channel: {
        id: video.channel?.id || '',
        name: video.channel?.name || '',
        thumbnail: video.channel?.thumbnail || video.channel?.thumbnails?.[0] || null
      }
    }
    
    return NextResponse.json(sanitizedVideo)
  } catch (error) {
    console.error('Get video error:', error)
    return NextResponse.json({ 
      error: 'Failed to get video',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}