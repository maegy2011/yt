import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'youtubei'
import { isValidYouTubeVideoId, sanitizeVideoId } from '@/lib/youtube-utils'

const youtube = new Client()

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params
    
    // Validate video ID
    if (!videoId || typeof videoId !== 'string') {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }
    
    // Sanitize video ID
    const sanitizedVideoId = sanitizeVideoId(videoId)
    
    if (!sanitizedVideoId) {
      return NextResponse.json({ error: 'Invalid video ID format' }, { status: 400 })
    }
    
    const video = await youtube.getVideo(sanitizedVideoId)
    
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }
    
    // Extract only the necessary data to avoid circular references
    const sanitizedVideo = {
      id: video.id || sanitizedVideoId,
      title: video.title || 'Unknown Video',
      description: video.description || '',
      thumbnail: video.thumbnail || video.thumbnails?.[0] || {
        url: `https://img.youtube.com/vi/${sanitizedVideoId}/mqdefault.jpg`,
        width: 320,
        height: 180
      },
      duration: video.duration || null,
      viewCount: video.viewCount || 0,
      publishedAt: video.publishedAt || null,
      isLive: video.isLive || false,
      channel: {
        id: video.channel?.id || '',
        name: video.channel?.name || 'Unknown Channel',
        thumbnail: video.channel?.thumbnail || video.channel?.thumbnails?.[0] || null
      }
    }
    
    return NextResponse.json(sanitizedVideo)
  } catch (error) {
    console.error('Get video error:', error)
    
    // Handle specific YouTube API errors
    if (error instanceof Error) {
      if (error.message.includes('private') || error.message.includes('restricted')) {
        return NextResponse.json({ error: 'Video is private or restricted' }, { status: 403 })
      }
      if (error.message.includes('not found') || error.message.includes('404')) {
        return NextResponse.json({ error: 'Video not found' }, { status: 404 })
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to get video',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}