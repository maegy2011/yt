import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'youtubei'
import { db } from '@/lib/db'

const youtube = new Client()

export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const channelId = params.channelId
    const searchParams = request.nextUrl.searchParams
    const includeVideos = searchParams.get('includeVideos') === 'true'
    const maxVideos = parseInt(searchParams.get('maxVideos') || '10')

    console.log('Fetching channel data:', { channelId, includeVideos, maxVideos })

    // Get channel data from YouTube
    const channel = await youtube.getChannel(channelId)
    
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // Extract comprehensive channel data
    const sanitizedChannel = {
      id: channel.id,
      channelId: channel.id,
      name: channel.name,
      description: channel.description,
      thumbnail: channel.thumbnail?.url || channel.thumbnail,
      banner: channel.banner?.url || channel.banner,
      subscriberCount: channel.subscriberCount || 0,
      videoCount: channel.videoCount || 0,
      viewCount: channel.viewCount || 0,
      joinedDate: channel.joinedDate,
      country: channel.country,
      keywords: channel.keywords || [],
      tags: channel.tags || [],
      isVerified: channel.verified || false,
      isFamilyFriendly: channel.familyFriendly || false,
      relatedChannels: channel.relatedChannels?.map((rc: any) => ({
        channelId: rc.id,
        name: rc.name,
        thumbnail: rc.thumbnail?.url || rc.thumbnail,
        subscriberCount: rc.subscriberCount || 0
      })) || [],
      // Channel links and social media
      links: channel.links || [],
      // Channel statistics
      stats: {
        subscribers: channel.subscriberCount || 0,
        totalViews: channel.viewCount || 0,
        totalVideos: channel.videoCount || 0,
        avgViewsPerVideo: channel.videoCount && channel.viewCount ? 
          Math.round(channel.viewCount / channel.videoCount) : 0
      },
      // Channel metadata
      metadata: {
        fetchedAt: new Date().toISOString(),
        hasVideos: !!(channel.videos && channel.videos.length > 0),
        lastUpdated: new Date().toISOString()
      }
    }

    // Include recent videos if requested
    if (includeVideos && channel.videos) {
      const videos = channel.videos.slice(0, maxVideos).map((video: any) => ({
        id: video.id,
        videoId: video.id,
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail?.url || `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`,
        duration: video.duration,
        viewCount: video.viewCount || 0,
        publishedAt: video.publishedAt,
        isLive: video.isLive || false,
        isUpcoming: video.isUpcoming || false,
        upcomingDate: video.upcomingDate,
        stats: {
          views: video.viewCount || 0,
          likes: video.likeCount || 0,
          comments: video.commentCount || 0
        }
      }))
      
      sanitizedChannel.videos = videos
    }

    // Check if channel is in favorites
    const favoriteChannel = await db.favoriteChannel.findUnique({
      where: { channelId }
    })

    sanitizedChannel.isFavorite = !!favoriteChannel
    if (favoriteChannel) {
      sanitizedChannel.addedAt = favoriteChannel.addedAt
    }

    console.log('Channel data fetched successfully:', {
      channelId: sanitizedChannel.id,
      name: sanitizedChannel.name,
      subscriberCount: sanitizedChannel.subscriberCount,
      videoCount: sanitizedChannel.videoCount,
      hasVideos: sanitizedChannel.metadata.hasVideos
    })

    return NextResponse.json(sanitizedChannel)
  } catch (error) {
    console.error('Get channel error:', error)
    
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