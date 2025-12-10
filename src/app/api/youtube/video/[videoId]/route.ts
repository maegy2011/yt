import { NextRequest, NextResponse } from 'next/server'
import { YouTubeClient, YouTubeVideo, YouTubeChannel, YouTubeThumbnails } from '@/types/youtube-api'
import { isValidYouTubeVideoId, sanitizeVideoId } from '@/lib/youtube-utils'

// Use dynamic import for youtubei to avoid module resolution issues
let Client: (new () => YouTubeClient) | null = null

const initializeYoutubei = async (): Promise<void> => {
  try {
    const youtubeiModule = await import('youtubei') as any
    Client = youtubeiModule.default?.Client || youtubeiModule.Client
  } catch (error) {
    // Console statement removed
  }
}

// Initialize immediately
initializeYoutubei().catch(() => {
  // Console removed - initialization error handled
})

// Helper function to extract thumbnail URL from YouTubei v1.8.0 Thumbnails API
function extractThumbnail(thumbnails: YouTubeThumbnails | string | undefined): { url: string; width: number; height: number } {
  if (!thumbnails) {
    return {
      url: `https://via.placeholder.com/320x180/374151/ffffff?text=No+Thumbnail`,
      width: 320,
      height: 180
    }
  }

  // Handle YouTubei v1.8.0 Thumbnails object (has .best property)
  if (typeof thumbnails === 'object' && thumbnails.best && typeof thumbnails.best === 'string') {
    return {
      url: thumbnails.best,
      width: 1280,
      height: 720
    }
  }

  // Handle YouTubei v1.8.0 Thumbnails array
  if (typeof thumbnails === 'object' && Array.isArray(thumbnails) && thumbnails.length > 0) {
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
  if (typeof thumbnails === 'object' && (thumbnails as any).url) {
    const thumb = thumbnails as any
    return {
      url: thumb.url,
      width: thumb.width || 320,
      height: thumb.height || 180
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
function extractChannel(channel: YouTubeChannel | undefined | null): { id: string; name: string; thumbnail?: string; subscriberCount?: string | number; handle?: string } {
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
    
    if (!Client) {
      return NextResponse.json({ error: 'YouTube client not initialized' }, { status: 500 })
    }
    
    const youtube = new Client()
    const searchResult = await youtube.search(sanitizedVideoId, { limit: 1 })
    const video = searchResult.items?.[0]
    
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }
    
    // Extract channel information
    const channelInfo = extractChannel(video.channel)
    
    // Extract only the necessary data to avoid circular references
    const videoRecord = video as unknown as Record<string, unknown>
    const sanitizedVideo = {
      id: (videoRecord.id as string) || sanitizedVideoId,
      title: (videoRecord.title as string) || 'Unknown Video',
      description: (videoRecord.description as string) || '',
      thumbnail: extractThumbnail(videoRecord.thumbnails as YouTubeThumbnails | string | undefined).url,
      duration: videoRecord.duration as string | number | null,
      viewCount: (videoRecord.viewCount as string | number) || 0,
      publishedAt: videoRecord.uploadDate as string | null,
      isLive: ((videoRecord.isLive as boolean) || false),
      channel: channelInfo
    }
    
    return NextResponse.json(sanitizedVideo)
  } catch (error) {
    // Console statement removed
    
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