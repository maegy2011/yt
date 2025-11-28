import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'youtubei'
import { db } from '@/lib/db'

const youtube = new Client()

// Helper function to extract thumbnail URL from YouTubei v1.8.0 Thumbnails API
function extractThumbnail(thumbnails: any): { url: string; width: number; height: number } {
  try {
    if (!thumbnails) {
      return {
        url: `https://via.placeholder.com/320x180/374151/ffffff?text=No+Thumbnail`,
        width: 320,
        height: 180
      }
    }

    // Handle YouTubei v1.8.0 Thumbnails object (has .best property)
    if (thumbnails && typeof thumbnails === 'object' && thumbnails.best && typeof thumbnails.best === 'string') {
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
    if (thumbnails && thumbnails.url) {
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
  } catch (error) {
    // Console statement removed
    return {
      url: `https://via.placeholder.com/320x180/374151/ffffff?text=Error`,
      width: 320,
      height: 180
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const channelId = params.channelId
    const searchParams = request.nextUrl.searchParams
    const includeVideos = searchParams.get('includeVideos') === 'true'
    const maxVideos = parseInt(searchParams.get('maxVideos') || '10')

    // Console statement removed

    // Get channel data from YouTube
    const channel = await youtube.getChannel(channelId)
    
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // Extract comprehensive channel data using YouTubei v1.8.0 properties
    let sanitizedChannel: any = {
      id: channel.id,
      channelId: channel.id,
      name: channel.name,
      description: channel.description,
      handle: channel.handle,
      thumbnail: extractThumbnail(channel.thumbnails),
      banner: channel.banner ? extractThumbnail(channel.banner) : undefined,
      mobileBanner: channel.mobileBanner ? extractThumbnail(channel.mobileBanner) : undefined,
      tvBanner: channel.tvBanner ? extractThumbnail(channel.tvBanner) : undefined,
      subscriberCount: channel.subscriberCount || 0,
      videoCount: channel.videoCount || 0,
      viewCount: (channel as any).viewCount || 0,
      joinedDate: (channel as any).joinedDate,
      country: (channel as any).country,
      keywords: (channel as any).keywords || [],
      tags: (channel as any).tags || [],
      isVerified: (channel as any).verified || false,
      isFamilyFriendly: (channel as any).familyFriendly || false,
      url: channel.url,
      relatedChannels: (channel as any).relatedChannels?.map((rc: any) => ({
        channelId: rc.id,
        name: rc.name,
        thumbnail: rc.thumbnails ? extractThumbnail(rc.thumbnails).url : rc.thumbnail,
        subscriberCount: rc.subscriberCount || 0
      })) || [],
      // Channel links and social media
      links: (channel as any).links || [],
      // Channel statistics
      stats: {
        subscribers: channel.subscriberCount || 0,
        totalViews: (channel as any).viewCount || 0,
        totalVideos: channel.videoCount || 0,
        avgViewsPerVideo: channel.videoCount && (channel as any).viewCount ? 
          Math.round(Number((channel as any).viewCount) / Number(channel.videoCount)) : 0
      },
      // Channel metadata
      metadata: {
        fetchedAt: new Date().toISOString(),
        hasVideos: !!(channel.videos && channel.videos.items && channel.videos.items.length > 0),
        hasPlaylists: !!(channel.playlists && channel.playlists.items && channel.playlists.items.length > 0),
        hasShorts: !!(channel.shorts && channel.shorts.items && channel.shorts.items.length > 0),
        hasLive: !!(channel.live && channel.live.items && channel.live.items.length > 0),
        shelvesCount: channel.shelves ? channel.shelves.length : 0,
        lastUpdated: new Date().toISOString()
      }
    }

    // Include recent videos if requested
    if (includeVideos && channel.videos) {
      // Load videos if not already loaded
      if (channel.videos.items.length === 0) {
        await channel.videos.next()
      }
      
      const channelVideos = channel.videos.items.slice(0, maxVideos).map((video: any) => ({
        id: video.id,
        videoId: video.id,
        title: video.title,
        description: video.description,
        thumbnail: extractThumbnail(video.thumbnails),
        duration: video.duration,
        viewCount: video.viewCount || 0,
        publishedAt: video.uploadDate, // YouTubei v1.8.0 API: uploadDate provides human-readable relative dates
        isLive: video.isLive || false,
        isUpcoming: video.isUpcoming || false,
        upcomingDate: video.upcomingDate,
        stats: {
          views: video.viewCount || 0,
          likes: video.likeCount || 0,
          comments: video.commentCount || 0
        }
      }))
      
      sanitizedChannel.videos = channelVideos
    }

    // Check if channel is in favorites
    const favoriteChannel = await db.favoriteChannel.findUnique({
      where: { channelId }
    })

    // Add favorite status
    sanitizedChannel.isFavorite = !!favoriteChannel
    if (favoriteChannel) {
      sanitizedChannel.addedAt = favoriteChannel.addedAt
    }

    // Console removed - Channel data fetched successfully

    return NextResponse.json(sanitizedChannel)
  } catch (error) {
    // Console statement removed
    
    // Return more specific error messages
    if (error instanceof Error && (error.message?.includes('Not found') || error.message?.includes('404'))) {
      return NextResponse.json({ error: 'Channel not found or does not exist' }, { status: 404 })
    }
    
    if (error instanceof Error && (error.message?.includes('quota') || error.message?.includes('limit'))) {
      return NextResponse.json({ error: 'API quota exceeded. Please try again later.' }, { status: 429 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch channel data',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}