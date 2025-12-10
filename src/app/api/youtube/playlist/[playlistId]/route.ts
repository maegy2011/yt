import { NextRequest, NextResponse } from 'next/server'

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
  { params }: { params: Promise<{ playlistId: string }> }
) {
  try {
    const { playlistId } = await params

    if (!playlistId) {
      return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 })
    }

    // Console statement removed

    // Use youtubei for real YouTube data
    const { Client } = await import('youtubei')
    const youtube = new Client()
    
    const playlist = await youtube.getPlaylist(playlistId)
    
    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    // Format playlist data
    const channelInfo = (playlist as any).channel ? extractChannel((playlist as any).channel) : null
    const formattedPlaylist = {
      id: playlist.id,
      title: playlist.title,
      description: (playlist as any).description || '',
      thumbnail: extractThumbnail((playlist as any).thumbnail || (playlist as any).thumbnails),
      videoCount: playlist.videoCount || 0,
      viewCount: (playlist as any).viewCount || 0,
      lastUpdatedAt: (playlist as any).lastUpdatedAt,
      channel: channelInfo
    }

    // Console statement removed
    return NextResponse.json(formattedPlaylist)
  } catch (error) {
    // Console statement removed
    return NextResponse.json({ 
      error: 'Failed to get playlist. Please try again later.' 
    }, { status: 500 })
  }
}