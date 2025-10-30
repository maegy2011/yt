import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'youtubei'

const youtube = new Client()

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const video = await youtube.getVideo(params.videoId)
    
    // Extract only the necessary data to avoid circular references
    const sanitizedVideo = {
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail,
      duration: video.duration,
      viewCount: video.viewCount,
      publishedAt: video.publishedAt,
      isLive: video.isLive,
      channel: {
        id: video.channel?.id,
        name: video.channel?.name,
        thumbnail: video.channel?.thumbnail
      }
    }
    
    return NextResponse.json(sanitizedVideo)
  } catch (error) {
    console.error('Get video error:', error)
    return NextResponse.json({ error: 'Failed to get video' }, { status: 500 })
  }
}