import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get all favorite channels
    const channels = await db.favoriteChannel.findMany({
      orderBy: { addedAt: 'desc' }
    })
    
    if (channels.length === 0) {
      return NextResponse.json({ videos: [] })
    }

    // Get recent videos from each channel using YouTube API
    const { Client } = await import('youtubei')
    const youtube = new Client()
    
    const allVideos = []
    
    for (const channel of channels) {
      try {
        const channelData = await youtube.getChannel(channel.channelId)
        
        if (channelData.videos && channelData.videos.length > 0) {
          // Get the 5 most recent videos from each channel
          const recentVideos = channelData.videos.slice(0, 5).map((video: any) => ({
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
            // Add a flag to indicate this is from a followed channel
            fromFollowedChannel: true
          }))
          
          allVideos.push(...recentVideos)
        }
      } catch (error) {
        console.error(`Error fetching videos for channel ${channel.name}:`, error)
        // Continue with other channels even if one fails
      }
    }
    
    // Sort all videos by published date (most recent first)
    const sortedVideos = allVideos.sort((a, b) => {
      const dateA = new Date(a.publishedAt || 0)
      const dateB = new Date(b.publishedAt || 0)
      return dateB.getTime() - dateA.getTime()
    })
    
    // Return the 20 most recent videos
    const recentVideos = sortedVideos.slice(0, 20)
    
    return NextResponse.json({ videos: recentVideos })
    
  } catch (error) {
    console.error('Error fetching recent videos from channels:', error)
    return NextResponse.json({ error: 'Failed to fetch recent videos' }, { status: 500 })
  }
}