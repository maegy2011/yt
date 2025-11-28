import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'youtubei'

const youtube = new Client()

// Helper function to extract avatar URL from YouTubei v1.8.0 Thumbnails API
function extractAvatar(thumbnails: any): string {
  try {
    if (!thumbnails) {
      return 'https://www.gstatic.com/youtube/img/avatars/avatar_default.png'
    }

    // Handle YouTubei v1.8.0 Thumbnails array - find the best square avatar
    if (Array.isArray(thumbnails) && thumbnails.length > 0) {
      // Look for square thumbnails (avatars) - typically 88x88 or similar
      const squareThumbnails = thumbnails.filter((thumb: any) => {
        const width = thumb.width || 0
        const height = thumb.height || 0
        // Look for roughly square images with reasonable size
        return Math.abs(width - height) <= 10 && width >= 48
      })
      
      if (squareThumbnails.length > 0) {
        // Use the largest square thumbnail
        const bestAvatar = squareThumbnails.reduce((best: any, current: any) => {
          return (current.width || 0) > (best.width || 0) ? current : best
        })
        return bestAvatar.url
      }
      
      // Fallback to the last thumbnail (usually highest resolution)
      const lastThumbnail = thumbnails[thumbnails.length - 1]
      if (lastThumbnail && lastThumbnail.url) {
        return lastThumbnail.url
      }
    }

    // Handle single thumbnail object
    if (thumbnails && thumbnails.url) {
      return thumbnails.url
    }

    // Handle string URL
    if (typeof thumbnails === 'string') {
      return thumbnails
    }

    // Fallback to default avatar
    return 'https://www.gstatic.com/youtube/img/avatars/avatar_default.png'
  } catch (error) {
    // Console statement removed
    return 'https://www.gstatic.com/youtube/img/avatars/avatar_default.png'
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const channelId = params.channelId
    // Console statement removed

    // Get channel data from YouTube
    const channel = await youtube.getChannel(channelId)
    
    if (!channel) {
      return NextResponse.json({ 
        error: 'Channel not found',
        avatarUrl: 'https://www.gstatic.com/youtube/img/avatars/avatar_default.png'
      }, { status: 404 })
    }

    // Extract the avatar URL
    const avatarUrl = extractAvatar(channel.thumbnails)

    // Console removed - Channel avatar fetched successfully

    return NextResponse.json({
      channelId,
      avatarUrl,
      success: true
    })
  } catch (error) {
    // Console statement removed
    
    // Return fallback avatar on error
    return NextResponse.json({ 
      error: 'Failed to fetch channel avatar',
      avatarUrl: 'https://www.gstatic.com/youtube/img/avatars/avatar_default.png',
      success: false
    }, { status: 500 })
  }
}