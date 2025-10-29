import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'youtubei'
import { youtubeRateLimiters, addRandomJitter } from '@/lib/rate-limiter'

const youtube = new Client()

// Function to format subscriber count
function formatSubscriberCount(count: number | undefined): string {
  if (!count || count === 0) return 'No subscribers'
  
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M subscribers`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K subscribers`
  }
  return `${count} subscribers`
}

// Function to get the best quality channel logo/avatar
function getChannelLogo(channel: any): string | null {
  // Try different sources for channel logo in order of preference
  const sources = [
    channel.avatar?.[0]?.url, // High resolution avatar
    channel.avatar?.url, // Single avatar
    channel.thumbnail?.url, // Thumbnail
    channel.banner?.url, // Banner (as fallback)
  ].filter(Boolean)

  return sources[0] || null
}

// Function to get channel verification badge
function getVerificationBadge(channel: any): boolean {
  return channel.verified || channel.badges?.some((badge: any) => badge.type === 'VERIFIED_CHANNEL')
}

// Function to get channel stats
function getChannelStats(channel: any): any {
  const logo = getChannelLogo(channel)
  
  return {
    subscriberCount: channel.subscriberCount || 0,
    videoCount: channel.videoCount || 0,
    viewCount: channel.viewCount || 0,
    subscriberText: formatSubscriberCount(channel.subscriberCount),
    verified: getVerificationBadge(channel),
    joinDate: channel.joinDate,
    country: channel.country,
    keywords: channel.keywords || [],
    banner: channel.banner?.url || null,
    avatar: logo, // Use the best available logo
    // Provide fallback URLs
    thumbnail: logo || channel.thumbnail?.url,
    logoSources: {
      avatar: channel.avatar,
      thumbnail: channel.thumbnail,
      banner: channel.banner
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    // Await params as required by Next.js 15
    const { channelId } = await params
    
    // Apply rate limiting with random jitter to appear more human
    await youtubeRateLimiters.channel.execute(async () => {
      // Add small random delay to make requests appear more natural
      const jitter = addRandomJitter(200, 300) // 200-500ms random delay
      await new Promise(resolve => setTimeout(resolve, jitter))
    })

    const channel = await youtube.getChannel(channelId)
    
    // Extract comprehensive channel data
    const logo = getChannelLogo(channel)
    const sanitizedChannel = {
      id: channel.id,
      name: channel.name,
      description: channel.description,
      thumbnail: {
        url: logo || channel.thumbnail?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&background=6366f1&color=fff&size=128`,
        width: 128,
        height: 128
      },
      stats: getChannelStats(channel),
      // Additional channel metadata
      url: `https://www.youtube.com/channel/${channel.id}`,
      handle: channel.handle || channel.customUrl,
      // Channel sections and tabs
      sections: channel.sections || [],
      // Recent videos (if available)
      videos: Array.isArray(channel.videos) ? channel.videos.slice(0, 12).map((video: any) => ({
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail || {
          url: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`,
          width: 320,
          height: 180
        },
        duration: video.duration,
        viewCount: video.viewCount,
        publishedAt: video.publishedAt,
        isLive: video.isLive || false,
        channel: {
          id: channel.id,
          name: channel.name,
          thumbnail: {
            url: logo || channel.thumbnail?.url,
            width: 128,
            height: 128
          }
        }
      })) : [],
      // Channel metadata
      metadata: {
        channelId: channel.id,
        channelName: channel.name,
        isVerified: getVerificationBadge(channel),
        subscriberCount: channel.subscriberCount || 0,
        videoCount: channel.videoCount || 0,
        viewCount: channel.viewCount || 0,
        joinDate: channel.joinDate,
        country: channel.country,
        keywords: channel.keywords || [],
        tags: channel.tags || [],
        logoUrl: logo,
        hasCustomLogo: !!logo && !logo.includes('ui-avatars.com')
      }
    }
    
    return NextResponse.json(sanitizedChannel)
  } catch (error) {
    console.error('Get channel error:', error)
    
    // Await params as required by Next.js 15
    const { channelId } = await params
    
    // Return a graceful fallback with generated avatar
    const fallbackChannel = {
      id: channelId,
      name: 'Unknown Channel',
      description: 'Channel information temporarily unavailable',
      thumbnail: {
        url: `https://ui-avatars.com/api/?name=Channel&background=6366f1&color=fff&size=128`,
        width: 128,
        height: 128
      },
      stats: {
        subscriberCount: 0,
        videoCount: 0,
        viewCount: 0,
        subscriberText: 'No subscribers',
        verified: false,
        avatar: null
      },
      error: 'Failed to get channel',
      details: error instanceof Error ? error.message : 'Unknown error',
      channelId: channelId
    }
    
    return NextResponse.json(fallbackChannel, { status: 200 }) // Return 200 with fallback data
  }
}