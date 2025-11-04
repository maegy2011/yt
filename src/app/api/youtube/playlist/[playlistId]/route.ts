import { NextRequest, NextResponse } from 'next/server'

// Helper function to extract thumbnail URL from YouTubei v1.7.0 Thumbnails API
function extractThumbnail(thumbnails: any): { url: string; width: number; height: number } {
  if (!thumbnails) {
    return {
      url: `https://via.placeholder.com/320x180/374151/ffffff?text=No+Thumbnail`,
      width: 320,
      height: 180
    }
  }

  // Handle YouTubei v1.7.0 Thumbnails array
  if (Array.isArray(thumbnails) && thumbnails.length > 0) {
    // Use the best thumbnail (highest resolution)
    const bestThumbnail = thumbnails[thumbnails.length - 1]
    if (bestThumbnail && bestThumbnail.url) {
      return {
        url: bestThumbnail.url,
        width: bestThumbnail.width || 320,
        height: bestThumbnail.height || 180
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

// Helper function to extract channel information from YouTubei v1.7.0 BaseChannel
function extractChannel(channel: any): { id: string; name: string; thumbnail?: string; subscriberCount?: string; handle?: string } {
  if (!channel) {
    return {
      id: '',
      name: 'Unknown Channel'
    }
  }

  return {
    id: channel.id || '',
    name: channel.name || 'Unknown Channel',
    thumbnail: channel.thumbnails ? extractThumbnail(channel.thumbnails).url : undefined,
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

    console.log('Getting playlist:', playlistId)

    // Use youtubei for real YouTube data
    const { Client } = await import('youtubei')
    const youtube = new Client()
    
    const playlist = await youtube.getPlaylist(playlistId)
    
    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    // Format playlist data
    const channelInfo = extractChannel(playlist.channel)
    const formattedPlaylist = {
      id: playlist.id,
      title: playlist.title,
      description: playlist.description,
      thumbnail: extractThumbnail(playlist.thumbnails),
      videoCount: playlist.videoCount || 0,
      viewCount: playlist.viewCount || 0,
      lastUpdatedAt: playlist.lastUpdatedAt,
      channel: channelInfo
    }

    console.log('Playlist retrieved successfully:', playlistId)
    return NextResponse.json(formattedPlaylist)
  } catch (error) {
    console.error('Get playlist error:', error)
    return NextResponse.json({ 
      error: 'Failed to get playlist. Please try again later.' 
    }, { status: 500 })
  }
}