import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'youtubei'
import { isValidYouTubeVideoId, sanitizeVideoId } from '@/lib/youtube-utils'

const youtube = new Client()

// Helper function to extract thumbnail URL from YouTubei v1.8.0 Thumbnails API
function extractThumbnail(thumbnails: any): { url: string; width: number; height: number } {
  if (!thumbnails) {
    return {
      url: `https://via.placeholder.com/320x180/374151/ffffff?text=No+Thumbnail`,
      width: 320,
      height: 180
    }
  }

  // Handle YouTubei v1.8.0 Thumbnails object (has .best property)
  if (thumbnails.best && typeof thumbnails.best === 'string') {
    return {
      url: thumbnails.best,
      width: 1280,
      height: 720
    }
  }

  // Handle YouTubei v1.8.0 Thumbnails array
  if (Array.isArray(thumbnails) && thumbnails.length > 0) {
    // Use the best thumbnail (highest resolution) - usually the last one
    const bestThumbnail = thumbnails[thumbnails.length - 1]
    if (bestThumbnail && bestThumbnail.url) {
      return {
        url: bestThumbnail.url,
        width: bestThumbnail.width || 1280,
        height: bestThumbnail.height || 720
      }
    }
  }

  // Handle single thumbnail object
  if (thumbnails.url) {
    return {
      url: thumbnails.url,
      width: thumbnails.width || 320,
      height: thumbnails.height || 180
    }
  }

  // Handle string URL
  if (typeof thumbnails === 'string') {
    return {
      url: thumbnails,
      width: 320,
      height: 180
    }
  }

  // Fallback
  return {
    url: `https://via.placeholder.com/320x180/374151/ffffff?text=No+Thumbnail`,
    width: 320,
    height: 180
  }
}

// Helper function to extract channel information from YouTubei v1.8.0 BaseChannel
function extractChannel(channel: any): { id: string; name: string; thumbnail?: string; subscriberCount?: string; handle?: string } {
  if (!channel) {
    return {
      id: '',
      name: 'Unknown Channel'
    }
  }

  // Extract channel thumbnail using the same thumbnail extraction logic
  let channelThumbnail: string | undefined
  if (channel.thumbnails) {
    const thumbnailData = extractThumbnail(channel.thumbnails)
    channelThumbnail = thumbnailData.url
  }

  return {
    id: channel.id || '',
    name: channel.name || 'Unknown Channel',
    thumbnail: channelThumbnail,
    subscriberCount: channel.subscriberCount,
    handle: channel.handle
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params
    
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
    
    // Extract channel information
    const channelInfo = extractChannel(video.channel)
    
    // Extract only the necessary data to avoid circular references
    const sanitizedVideo = {
      id: video.id || sanitizedVideoId,
      title: video.title || 'Unknown Video',
      description: video.description || '',
      thumbnail: extractThumbnail((video as any).thumbnails || (video as any).thumbnail),
      duration: (video as any).duration || null,
      viewCount: video.viewCount || 0,
      publishedAt: (video as any).uploadDate || null, // YouTubei v1.8.0 API: uploadDate provides human-readable relative dates
      isLive: (video as any).isLive || false,
      channel: channelInfo
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