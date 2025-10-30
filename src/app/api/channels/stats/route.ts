import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const channelId = searchParams.get('channelId')
    const includeComparison = searchParams.get('includeComparison') === 'true'
    const timeframe = searchParams.get('timeframe') || 'all' // all, month, week

    console.log('Channel stats request:', { channelId, includeComparison, timeframe })

    if (channelId) {
      // Get stats for specific channel
      return await getSingleChannelStats(channelId, includeComparison, timeframe)
    } else {
      // Get overall channel statistics
      return await getAllChannelsStats(includeComparison, timeframe)
    }
  } catch (error) {
    console.error('Channel stats error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch channel statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

async function getSingleChannelStats(channelId: string, includeComparison: boolean, timeframe: string) {
  try {
    // Get channel from favorites
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

    if (!channelData) {
      return NextResponse.json({ error: 'Channel data not available' }, { status: 404 })
    }

    // Calculate statistics
    const stats = {
      channelId: channelId,
      name: channelData.name,
      thumbnail: channelData.thumbnail?.url || channelData.thumbnail,
      subscriberCount: channelData.subscriberCount || 0,
      videoCount: channelData.videoCount || 0,
      viewCount: channelData.viewCount || 0,
      addedToFavorites: favoriteChannel.addedAt,
      daysInFavorites: Math.floor((Date.now() - new Date(favoriteChannel.addedAt).getTime()) / (1000 * 60 * 60 * 24)),
      stats: {
        subscribers: channelData.subscriberCount || 0,
        totalVideos: channelData.videoCount || 0,
        totalViews: channelData.viewCount || 0,
        avgViewsPerVideo: (channelData.videoCount && channelData.viewCount) ? 
          Math.round(channelData.viewCount / channelData.videoCount) : 0,
        subscriberGrowthRate: 0, // Would need historical data
        viewGrowthRate: 0, // Would need historical data
        uploadFrequency: 0, // Would need video dates analysis
        engagementScore: 0 // Would need likes/comments data
      },
      metadata: {
        isVerified: channelData.verified || false,
        country: channelData.country,
        joinedDate: channelData.joinedDate,
        lastUpdated: new Date().toISOString()
      }
    }

    // Add comparison data if requested
    if (includeComparison) {
      const allChannels = await db.favoriteChannel.findMany()
      const avgSubscribers = allChannels.reduce((sum, ch) => sum + (ch.subscriberCount || 0), 0) / allChannels.length
      const avgVideos = allChannels.reduce((sum, ch) => sum + (ch.videoCount || 0), 0) / allChannels.length
      
      stats.comparison = {
        subscriberRank: allChannels.filter(ch => (ch.subscriberCount || 0) > (channelData.subscriberCount || 0)).length + 1,
        totalChannelsCompared: allChannels.length,
        subscriberPercentile: Math.round((1 - (stats.stats.subscribers - avgSubscribers) / Math.max(avgSubscribers, 1)) * 100),
        videoPercentile: Math.round((1 - (stats.stats.totalVideos - avgVideos) / Math.max(avgVideos, 1)) * 100),
        aboveAverageSubscribers: stats.stats.subscribers > avgSubscribers,
        aboveAverageVideos: stats.stats.totalVideos > avgVideos
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Single channel stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch channel statistics' }, { status: 500 })
  }
}

async function getAllChannelsStats(includeComparison: boolean, timeframe: string) {
  try {
    // Get all favorite channels
    const favoriteChannels = await db.favoriteChannel.findMany({
      orderBy: { addedAt: 'desc' }
    })

    if (favoriteChannels.length === 0) {
      return NextResponse.json({
        summary: {
          totalChannels: 0,
          totalSubscribers: 0,
          totalVideos: 0,
          totalViews: 0,
          avgSubscribers: 0,
          avgVideos: 0,
          avgViews: 0
        },
        channels: [],
        metadata: {
          generatedAt: new Date().toISOString(),
          timeframe,
          includeComparison
        }
      })
    }

    // Get detailed data for each channel
    const { Client } = await import('youtubei')
    const youtube = new Client()
    
    const channelDetails = []
    let totalSubscribers = 0
    let totalVideos = 0
    let totalViews = 0

    for (const favoriteChannel of favoriteChannels) {
      try {
        const channelData = await youtube.getChannel(favoriteChannel.channelId)
        
        if (channelData) {
          const subscribers = channelData.subscriberCount || 0
          const videos = channelData.videoCount || 0
          const views = channelData.viewCount || 0
          
          totalSubscribers += subscribers
          totalVideos += videos
          totalViews += views

          const channelDetail = {
            id: favoriteChannel.id,
            channelId: favoriteChannel.channelId,
            name: channelData.name,
            thumbnail: channelData.thumbnail?.url || channelData.thumbnail,
            subscriberCount: subscribers,
            videoCount: videos,
            viewCount: views,
            addedAt: favoriteChannel.addedAt,
            isVerified: channelData.verified || false,
            stats: {
              avgViewsPerVideo: videos ? Math.round(views / videos) : 0,
              daysInFavorites: Math.floor((Date.now() - new Date(favoriteChannel.addedAt).getTime()) / (1000 * 60 * 60 * 24))
            }
          }

          channelDetails.push(channelDetail)
        }
      } catch (error) {
        console.error(`Failed to fetch details for channel ${favoriteChannel.channelId}:`, error)
        // Add basic data even if detailed fetch fails
        channelDetails.push({
          id: favoriteChannel.id,
          channelId: favoriteChannel.channelId,
          name: favoriteChannel.name,
          thumbnail: favoriteChannel.thumbnail,
          subscriberCount: favoriteChannel.subscriberCount || 0,
          videoCount: 0,
          viewCount: 0,
          addedAt: favoriteChannel.addedAt,
          isVerified: false,
          stats: {
            avgViewsPerVideo: 0,
            daysInFavorites: Math.floor((Date.now() - new Date(favoriteChannel.addedAt).getTime()) / (1000 * 60 * 60 * 24))
          },
          error: 'Failed to fetch detailed data'
        })
      }
    }

    // Sort by subscriber count
    channelDetails.sort((a, b) => b.subscriberCount - a.subscriberCount)

    // Calculate summary statistics
    const avgSubscribers = favoriteChannels.length > 0 ? Math.round(totalSubscribers / favoriteChannels.length) : 0
    const avgVideos = favoriteChannels.length > 0 ? Math.round(totalVideos / favoriteChannels.length) : 0
    const avgViews = favoriteChannels.length > 0 ? Math.round(totalViews / favoriteChannels.length) : 0

    const summary = {
      totalChannels: favoriteChannels.length,
      totalSubscribers,
      totalVideos,
      totalViews,
      avgSubscribers,
      avgVideos,
      avgViews,
      topChannel: channelDetails[0] || null,
      newestChannel: favoriteChannels.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())[0],
      oldestChannel: favoriteChannels.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime())[0]
    }

    // Add distribution data
    const distribution = {
      subscriberRanges: {
        under1k: channelDetails.filter(ch => ch.subscriberCount < 1000).length,
        k1to10k: channelDetails.filter(ch => ch.subscriberCount >= 1000 && ch.subscriberCount < 10000).length,
        k10to100k: channelDetails.filter(ch => ch.subscriberCount >= 10000 && ch.subscriberCount < 100000).length,
        k100to1m: channelDetails.filter(ch => ch.subscriberCount >= 100000 && ch.subscriberCount < 1000000).length,
        over1m: channelDetails.filter(ch => ch.subscriberCount >= 1000000).length
      },
      verifiedChannels: channelDetails.filter(ch => ch.isVerified).length,
      totalActiveChannels: channelDetails.filter(ch => !ch.error).length
    }

    return NextResponse.json({
      summary,
      distribution,
      channels: channelDetails,
      metadata: {
        generatedAt: new Date().toISOString(),
        timeframe,
        includeComparison,
        totalProcessed: favoriteChannels.length,
        successfulFetches: channelDetails.filter(ch => !ch.error).length
      }
    })
  } catch (error) {
    console.error('All channels stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch channel statistics' }, { status: 500 })
  }
}