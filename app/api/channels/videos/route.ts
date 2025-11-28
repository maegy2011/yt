import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const channelId = searchParams.get('channelId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') || 'publishedAt' // publishedAt, viewCount, title
    const order = searchParams.get('order') || 'desc' // desc, asc
    const dateRange = searchParams.get('dateRange') || 'all' // all, week, month, year
    const includeStats = searchParams.get('includeStats') === 'true'

    console.log('Enhanced channel videos request:', { 
      channelId, 
      limit, 
      offset, 
      sortBy, 
      order, 
      dateRange, 
      includeStats 
    })

    if (channelId) {
      // Get videos from specific channel
      return await getChannelVideos(channelId, limit, offset, sortBy, order, dateRange, includeStats)
    } else {
      // Get videos from all favorite channels (original behavior)
      return await getAllFavoriteChannelsVideos(limit, offset, sortBy, order, dateRange, includeStats)
    }
  } catch (error) {
    console.error('Failed to fetch channel videos:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch channel videos',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    }, { status: 500 })
  }
}

async function getChannelVideos(
  channelId: string, 
  limit: number, 
  offset: number, 
  sortBy: string, 
  order: string, 
  dateRange: string,
  includeStats: boolean
) {
  try {
    // Check if channel is in favorites
    const favoriteChannel = await db.favoriteChannel.findUnique({
      where: { channelId }
    })

    if (!favoriteChannel) {
      return NextResponse.json({ error: 'Channel not found in favorites' }, { status: 404 })
    }

    // Get channel data from YouTube API
    const { Client } = await import('youtubei')
    const youtube = new Client()
    const channelData = await youtube.getChannel(channelId)

    if (!channelData || !channelData.videos) {
      return NextResponse.json({
        items: [],
        total: 0,
        channelId,
        message: 'No videos found for this channel'
      })
    }

    // Process videos
    let videos = (channelData as any).videos?.map((video: any) => ({
      id: video.id,
      videoId: video.id,
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail?.url || `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`,
      duration: video.duration,
      viewCount: video.viewCount || 0,
      publishedAt: video.publishedAt,
      channelId: channelData.id,
      channelName: channelData.name,
      channelThumbnail: (channelData as any).thumbnail?.url || (channelData as any).thumbnail || (channelData as any).thumbnails?.[0]?.url,
      isLive: video.isLive || false,
      isUpcoming: video.isUpcoming || false,
      upcomingDate: video.upcomingDate,
      stats: {
        views: video.viewCount || 0,
        likes: video.likeCount || 0,
        comments: video.commentCount || 0
      }
    }))

    // Apply date range filter
    if (dateRange !== 'all') {
      const now = new Date()
      let cutoffDate: Date

      switch (dateRange) {
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          cutoffDate = new Date(0)
      }

      videos = videos.filter(video => {
        const publishDate = new Date(video.publishedAt)
        return publishDate >= cutoffDate
      })
    }

    // Sort videos
    videos.sort((a: any, b: any) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'viewCount':
          aValue = a.viewCount || 0
          bValue = b.viewCount || 0
          break
        case 'title':
          aValue = a.title?.toLowerCase() || ''
          bValue = b.title?.toLowerCase() || ''
          break
        case 'duration':
          aValue = a.duration ? parseDuration(a.duration) : 0
          bValue = b.duration ? parseDuration(b.duration) : 0
          break
        case 'publishedAt':
        default:
          aValue = new Date(a.publishedAt || 0).getTime()
          bValue = new Date(b.publishedAt || 0).getTime()
          break
      }

      if (order === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // Apply pagination
    const total = videos.length
    const paginatedVideos = videos.slice(offset, offset + limit)

    // Add enhanced stats if requested
    if (includeStats) {
      paginatedVideos.forEach((video: any) => {
        video.enhancedStats = {
          viewRank: videos.filter(v => (v.viewCount || 0) > (video.viewCount || 0)).length + 1,
          engagementScore: (video.stats.likes + video.stats.comments) / Math.max(video.viewCount, 1) * 1000,
          publishDaysAgo: Math.floor((Date.now() - new Date(video.publishedAt).getTime()) / (1000 * 60 * 60 * 24))
        }
      })
    }

    return NextResponse.json({
      items: paginatedVideos,
      total,
      channelId,
      channelName: channelData.name,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total,
        nextPage: offset + limit < total ? offset + limit : null
      },
      filters: {
        sortBy,
        order,
        dateRange,
        includeStats
      },
      stats: {
        totalVideos: total,
        avgViews: videos.length > 0 ? Math.round(videos.reduce((sum, v) => sum + (v.viewCount || 0), 0) / videos.length) : 0,
        totalViews: videos.reduce((sum, v) => sum + (v.viewCount || 0), 0),
        dateRange: dateRange
      },
      metadata: {
        fetchedAt: new Date().toISOString(),
        channelSubscriberCount: channelData.subscriberCount || 0
      }
    })
  } catch (error) {
    console.error('Single channel videos error:', error)
    return NextResponse.json({ error: 'Failed to fetch channel videos' }, { status: 500 })
  }
}

async function getAllFavoriteChannelsVideos(
  limit: number, 
  offset: number, 
  sortBy: string, 
  order: string, 
  dateRange: string,
  includeStats: boolean
) {
  try {
    // Get all favorite channels
    const favoriteChannels = await db.favoriteChannel.findMany({
      orderBy: { addedAt: 'desc' }
    })

    if (favoriteChannels.length === 0) {
      return NextResponse.json({ 
        items: [], 
        total: 0,
        message: 'No favorite channels found' 
      })
    }

    // Get videos from each channel using YouTube API
    const { Client } = await import('youtubei')
    const youtube = new Client()
    
    const allVideos: any[] = []
    
    for (const channel of favoriteChannels) {
      try {
        const channelData = await youtube.getChannel(channel.channelId)
        const videos = (channelData as any).videos || []
        
        const channelVideos = videos.map((video: any) => ({
          id: video.id,
          videoId: video.id,
          title: video.title,
          description: video.description,
          thumbnail: video.thumbnail?.url || `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`,
          duration: video.duration,
          viewCount: video.viewCount || 0,
          publishedAt: video.publishedAt,
          channelId: channel.channelId,
          channelName: channel.name,
          channelThumbnail: channel.thumbnail,
          isLive: video.isLive || false,
          isUpcoming: video.isUpcoming || false,
          upcomingDate: video.upcomingDate,
          stats: {
            views: video.viewCount || 0,
            likes: video.likeCount || 0,
            comments: video.commentCount || 0
          }
        }))
        
        allVideos.push(...channelVideos)
      } catch (error) {
        console.error(`Failed to fetch videos for channel ${channel.name}:`, error)
        // Continue with other channels even if one fails
      }
    }

    // Apply date range filter
    let filteredVideos = allVideos
    if (dateRange !== 'all') {
      const now = new Date()
      let cutoffDate: Date

      switch (dateRange) {
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          cutoffDate = new Date(0)
      }

      filteredVideos = allVideos.filter(video => {
        const publishDate = new Date(video.publishedAt)
        return publishDate >= cutoffDate
      })
    }

    // Sort videos
    filteredVideos.sort((a: any, b: any) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'viewCount':
          aValue = a.viewCount || 0
          bValue = b.viewCount || 0
          break
        case 'title':
          aValue = a.title?.toLowerCase() || ''
          bValue = b.title?.toLowerCase() || ''
          break
        case 'channelName':
          aValue = a.channelName?.toLowerCase() || ''
          bValue = b.channelName?.toLowerCase() || ''
          break
        case 'duration':
          aValue = a.duration ? parseDuration(a.duration) : 0
          bValue = b.duration ? parseDuration(b.duration) : 0
          break
        case 'publishedAt':
        default:
          aValue = new Date(a.publishedAt || 0).getTime()
          bValue = new Date(b.publishedAt || 0).getTime()
          break
      }

      if (order === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // Apply pagination
    const total = filteredVideos.length
    const paginatedVideos = filteredVideos.slice(offset, offset + limit)

    // Add enhanced stats if requested
    if (includeStats) {
      paginatedVideos.forEach((video: any) => {
        video.enhancedStats = {
          viewRank: filteredVideos.filter(v => (v.viewCount || 0) > (video.viewCount || 0)).length + 1,
          engagementScore: (video.stats.likes + video.stats.comments) / Math.max(video.viewCount, 1) * 1000,
          publishDaysAgo: Math.floor((Date.now() - new Date(video.publishedAt).getTime()) / (1000 * 60 * 60 * 24))
        }
      })
    }

    return NextResponse.json({
      items: paginatedVideos,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total,
        nextPage: offset + limit < total ? offset + limit : null
      },
      filters: {
        sortBy,
        order,
        dateRange,
        includeStats
      },
      stats: {
        totalChannels: favoriteChannels.length,
        totalVideos: total,
        avgViews: total > 0 ? Math.round(filteredVideos.reduce((sum, v) => sum + (v.viewCount || 0), 0) / total) : 0,
        totalViews: filteredVideos.reduce((sum, v) => sum + (v.viewCount || 0), 0),
        videosPerChannel: Math.round(total / favoriteChannels.length)
      },
      metadata: {
        fetchedAt: new Date().toISOString(),
        channelsProcessed: favoriteChannels.length
      }
    })
  } catch (error) {
    console.error('All channels videos error:', error)
    return NextResponse.json({ error: 'Failed to fetch channel videos' }, { status: 500 })
  }
}

// Helper function to parse duration string (e.g., "4:32" -> 272 seconds)
function parseDuration(duration: string): number {
  if (!duration) return 0
  
  const parts = duration.split(':')
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1])
  } else if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
  }
  
  return 0
}