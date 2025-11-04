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

  // Handle YouTubei v1.7.0 Thumbnails object (has .best property)
  if (thumbnails.best && typeof thumbnails.best === 'string') {
    return {
      url: thumbnails.best,
      width: 1280,
      height: 720
    }
  }

  // Handle YouTubei v1.7.0 Thumbnails array
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

// Helper function to extract channel information from YouTubei v1.7.0 BaseChannel
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
    const { searchParams } = new URL(request.url)
    const loadAll = searchParams.get('loadAll') === 'true'

    if (!playlistId) {
      return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 })
    }

    console.log('Getting playlist videos:', playlistId, 'loadAll:', loadAll)

    // Use youtubei for real YouTube data
    const { Client } = await import('youtubei')
    const youtube = new Client()
    
    const playlist = await youtube.getPlaylist(playlistId)
    
    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    // Get all videos from the playlist
    if (loadAll) {
      await playlist.videos.next(0) // Load all videos
    } else {
      await playlist.videos.next() // Load first batch
    }

    const videos = playlist.videos.items || []

    // Format video data
    const formattedVideos = videos.map((video: any) => {
      // Format duration properly
      let formattedDuration = video.duration
      if (video.duration) {
        if (typeof video.duration === 'string') {
          if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(video.duration)) {
            formattedDuration = video.duration
          } else if (video.duration.startsWith('PT')) {
            const match = video.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
            if (match) {
              const hours = parseInt(match[1] || '0')
              const minutes = parseInt(match[2] || '0')
              const seconds = parseInt(match[3] || '0')
              
              if (hours > 0) {
                formattedDuration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
              } else {
                formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`
              }
            }
          } else if (/^\d+$/.test(video.duration)) {
            const totalSeconds = parseInt(video.duration)
            const minutes = Math.floor(totalSeconds / 60)
            const seconds = totalSeconds % 60
            formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`
          }
        } else if (typeof video.duration === 'number') {
          const minutes = Math.floor(video.duration / 60)
          const seconds = Math.floor(video.duration % 60)
          formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`
        }
      }

      const channelInfo = extractChannel(video.channel)

      return {
        id: video.id,
        type: 'video',
        title: video.title,
        description: video.description,
        thumbnail: extractThumbnail(video.thumbnails),
        duration: formattedDuration,
        viewCount: video.viewCount,
        publishedAt: video.uploadDate, // YouTubei v1.7.0 API: uploadDate provides human-readable relative dates
        isLive: video.isLive || false,
        channel: channelInfo
      }
    })

    console.log(`Retrieved ${formattedVideos.length} videos from playlist:`, playlistId)
    
    return NextResponse.json({
      videos: formattedVideos,
      totalVideos: playlist.videoCount,
      hasMore: !!playlist.videos.continuation
    })
  } catch (error) {
    console.error('Get playlist videos error:', error)
    return NextResponse.json({ 
      error: 'Failed to get playlist videos. Please try again later.',
      videos: []
    }, { status: 500 })
  }
}