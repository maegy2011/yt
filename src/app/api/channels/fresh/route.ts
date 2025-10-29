import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '15')
    const hours = parseInt(searchParams.get('hours') || '24') // Content from last N hours

    // Get all favorite channels
    const channels = await db.favoriteChannel.findMany({
      orderBy: { addedAt: 'desc' }
    })
    
    if (channels.length === 0) {
      return NextResponse.json({ videos: [], channels: [] })
    }

    // Import youtubei here to avoid module loading issues
    const { Client } = await import('youtubei')
    const youtube = new Client()
    
    const allVideos: any[] = []
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000)
    
    for (const channel of channels) {
      try {
        const channelData = await youtube.getChannel(channel.channelId)
        
        if (channelData.videos && channelData.videos.length > 0) {
          // Filter videos published within the time window
          const freshVideos = channelData.videos
            .filter((video: any) => {
              if (!video.publishedAt) return false
              const publishTime = new Date(video.publishedAt)
              return publishTime > cutoffTime
            })
            .slice(0, 3) // Get up to 3 fresh videos per channel
            .map((video: any) => ({
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
                id: channel.channelId,
                name: channel.name,
                thumbnail: channel.thumbnail
              },
              // Add freshness indicators
              isFresh: true,
              freshnessHours: Math.floor((Date.now() - new Date(video.publishedAt).getTime()) / (1000 * 60 * 60)),
              fromFollowedChannel: true
            }))
          
          allVideos.push(...freshVideos)
        }
      } catch (error) {
        console.error(`Error fetching fresh videos for channel ${channel.name}:`, error)
        // Continue with other channels even if one fails
      }
    }
    
    // Sort all videos by published date (most recent first)
    const sortedVideos = allVideos.sort((a, b) => {
      const dateA = new Date(a.publishedAt || 0)
      const dateB = new Date(b.publishedAt || 0)
      return dateB.getTime() - dateA.getTime()
    })
    
    // Return the most recent fresh videos
    const freshVideos = sortedVideos.slice(0, limit)
    
    // Also return channel stats
    const channelStats = channels.map(channel => ({
      id: channel.channelId,
      name: channel.name,
      thumbnail: channel.thumbnail,
      hasFreshContent: freshVideos.some(video => video.channel.id === channel.channelId)
    }))
    
    return NextResponse.json({ 
      videos: freshVideos,
      channels: channelStats,
      totalVideos: freshVideos.length,
      timeWindow: `${hours} hours`,
      lastUpdated: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error fetching fresh content from channels:', error)
    return NextResponse.json({ error: 'Failed to fetch fresh content' }, { status: 500 })
  }
}