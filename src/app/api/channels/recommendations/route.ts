import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const strategy = searchParams.get('strategy') || 'similar' // similar, trending, popular, related
    const excludeFollowed = searchParams.get('excludeFollowed') === 'true'

    console.log('Channel recommendations request:', { limit, strategy, excludeFollowed })

    // Get favorite channels for analysis
    const favoriteChannels = await db.favoriteChannel.findMany({
      orderBy: { createdAt: 'desc' }
    })

    if (favoriteChannels.length === 0) {
      return NextResponse.json({
        recommendations: [],
        message: 'No favorite channels found for recommendations',
        strategy: 'none'
      })
    }

    let recommendations: any[] = []

    switch (strategy) {
      case 'similar':
        recommendations = await getSimilarChannels(favoriteChannels, limit, excludeFollowed)
        break
      case 'trending':
        recommendations = await getTrendingChannels(limit, excludeFollowed)
        break
      case 'popular':
        recommendations = await getPopularChannels(limit, excludeFollowed)
        break
      case 'related':
        recommendations = await getRelatedChannels(favoriteChannels, limit, excludeFollowed)
        break
      default:
        recommendations = await getSimilarChannels(favoriteChannels, limit, excludeFollowed)
    }

    return NextResponse.json({
      recommendations,
      strategy,
      basedOnChannels: favoriteChannels.length,
      metadata: {
        generatedAt: new Date().toISOString(),
        limit,
        excludeFollowed,
        totalFavorites: favoriteChannels.length
      }
    })
  } catch (error) {
    console.error('Channel recommendations error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch channel recommendations',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    }, { status: 500 })
  }
}

async function getSimilarChannels(favoriteChannels: any[], limit: number, excludeFollowed: boolean) {
  try {
    const { Client } = await import('youtubei')
    const youtube = new Client()
    
    const allRecommendations: any[] = []
    const followedChannelIds = new Set(favoriteChannels.map(fc => fc.channelId))

    // Analyze favorite channels to find patterns
    const channelCategories = new Map()
    const avgSubscriberCount = favoriteChannels.reduce((sum, ch) => sum + (ch.subscriberCount || 0), 0) / favoriteChannels.length

    // Get related channels from each favorite channel
    for (const favoriteChannel of favoriteChannels.slice(0, 5)) { // Limit to prevent too many API calls
      try {
        const channelData = await youtube.getChannel(favoriteChannel.channelId)
        
        if (channelData && 'relatedChannels' in channelData && channelData.relatedChannels && Array.isArray(channelData.relatedChannels) && channelData.relatedChannels.length > 0) {
          const relatedChannels = channelData.relatedChannels
            .filter((rc: any) => !excludeFollowed || !followedChannelIds.has(rc.id))
            .slice(0, 3) // Take top 3 related channels per favorite
            .map((rc: any) => ({
              id: rc.id,
              channelId: rc.id,
              name: rc.name,
              thumbnail: rc.thumbnail?.url || rc.thumbnail,
              subscriberCount: rc.subscriberCount || 0,
              videoCount: rc.videoCount || 0,
              reason: `Related to ${favoriteChannel.name}`,
              similarityScore: calculateSimilarity(favoriteChannel, rc),
              category: 'related',
              metadata: {
                recommendedAt: new Date().toISOString(),
                basedOnChannel: favoriteChannel.name,
                basedOnChannelId: favoriteChannel.channelId
              }
            }))

          allRecommendations.push(...relatedChannels)
        }
      } catch (error) {
        console.error(`Failed to get related channels for ${favoriteChannel.channelId}:`, error)
      }
    }

    // Sort by similarity score and subscriber count
    allRecommendations.sort((a, b) => {
      const scoreA = a.similarityScore * 0.7 + Math.log10(Math.max(a.subscriberCount, 1)) * 0.3
      const scoreB = b.similarityScore * 0.7 + Math.log10(Math.max(b.subscriberCount, 1)) * 0.3
      return scoreB - scoreA
    })

    return allRecommendations.slice(0, limit)
  } catch (error) {
    console.error('Similar channels error:', error)
    return []
  }
}

async function getTrendingChannels(limit: number, excludeFollowed: boolean) {
  try {
    // Use trending topics to find channels
    const trendingTopics = ['technology', 'science', 'music', 'gaming', 'education', 'entertainment']
    const { Client } = await import('youtubei')
    const youtube = new Client()
    
    const allRecommendations: any[] = []
    const followedChannelIds = excludeFollowed ? 
      new Set((await db.favoriteChannel.findMany()).map(fc => fc.channelId)) : 
      new Set()

    // Search for trending content in different categories
    for (const topic of trendingTopics.slice(0, 3)) { // Limit API calls
      try {
        const results = await youtube.search(`${topic} channels`, { type: 'channel' })
        
        if (results.items) {
          const channels = results.items
            .filter((item: any) => 
              item.id && 
              item.name && 
              item.subscriberCount > 10000 && // Only channels with decent following
              (!excludeFollowed || !followedChannelIds.has(item.id))
            )
            .slice(0, 2) // Take top 2 per topic
            .map((item: any) => ({
              id: item.id,
              channelId: item.id,
              name: item.name,
              thumbnail: item.thumbnail?.url || item.thumbnail,
              subscriberCount: item.subscriberCount || 0,
              videoCount: item.videoCount || 0,
              description: item.description,
              reason: `Trending in ${topic}`,
              trendingScore: calculateTrendingScore(item),
              category: 'trending',
              metadata: {
                recommendedAt: new Date().toISOString(),
                topic: topic
              }
            }))

          allRecommendations.push(...channels)
        }
      } catch (error) {
        console.error(`Failed to search trending channels for ${topic}:`, error)
      }
    }

    // Sort by trending score
    allRecommendations.sort((a, b) => b.trendingScore - a.trendingScore)

    return allRecommendations.slice(0, limit)
  } catch (error) {
    console.error('Trending channels error:', error)
    return []
  }
}

async function getPopularChannels(limit: number, excludeFollowed: boolean) {
  try {
    // Search for popular channels across different categories
    const searchQueries = [
      'popular tech channels',
      'popular music channels', 
      'popular educational channels',
      'popular gaming channels'
    ]
    
    const { Client } = await import('youtubei')
    const youtube = new Client()
    
    const allRecommendations: any[] = []
    const followedChannelIds = excludeFollowed ? 
      new Set((await db.favoriteChannel.findMany()).map(fc => fc.channelId)) : 
      new Set()

    for (const query of searchQueries.slice(0, 3)) { // Limit API calls
      try {
        const results = await youtube.search(query, { type: 'channel' })
        
        if (results.items) {
          const channels = results.items
            .filter((item: any) => 
              item.id && 
              item.name && 
              item.subscriberCount > 100000 && // Only popular channels
              (!excludeFollowed || !followedChannelIds.has(item.id))
            )
            .slice(0, 2)
            .map((item: any) => ({
              id: item.id,
              channelId: item.id,
              name: item.name,
              thumbnail: item.thumbnail?.url || item.thumbnail,
              subscriberCount: item.subscriberCount || 0,
              videoCount: item.videoCount || 0,
              description: item.description,
              reason: `Popular channel in ${query.split(' ').pop()}`,
              popularityScore: Math.log10(item.subscriberCount || 1),
              category: 'popular',
              metadata: {
                recommendedAt: new Date().toISOString(),
                searchQuery: query
              }
            }))

          allRecommendations.push(...channels)
        }
      } catch (error) {
        console.error(`Failed to search popular channels for ${query}:`, error)
      }
    }

    // Sort by subscriber count
    allRecommendations.sort((a, b) => b.subscriberCount - a.subscriberCount)

    return allRecommendations.slice(0, limit)
  } catch (error) {
    console.error('Popular channels error:', error)
    return []
  }
}

async function getRelatedChannels(favoriteChannels: any[], limit: number, excludeFollowed: boolean) {
  try {
    // Combine strategies for more diverse recommendations
    const similarChannels = await getSimilarChannels(favoriteChannels, Math.ceil(limit / 2), excludeFollowed)
    const trendingChannels = await getTrendingChannels(Math.ceil(limit / 2), excludeFollowed)
    
    const combined = [...similarChannels, ...trendingChannels]
    
    // Remove duplicates and sort by combined score
    const uniqueChannels = combined.filter((channel, index, self) => 
      index === self.findIndex(c => c.channelId === channel.channelId)
    )
    
    uniqueChannels.sort((a, b) => {
      const scoreA = (a.similarityScore || a.trendingScore || 0) + Math.log10(Math.max(a.subscriberCount, 1))
      const scoreB = (b.similarityScore || b.trendingScore || 0) + Math.log10(Math.max(b.subscriberCount, 1))
      return scoreB - scoreA
    })

    return uniqueChannels.slice(0, limit)
  } catch (error) {
    console.error('Related channels error:', error)
    return []
  }
}

// Helper functions
function calculateSimilarity(favoriteChannel: any, candidateChannel: any): number {
  let score = 0
  
  // Subscriber count similarity (prefer similar sizes)
  const subDiff = Math.abs((favoriteChannel.subscriberCount || 0) - (candidateChannel.subscriberCount || 0))
  const avgSubs = ((favoriteChannel.subscriberCount || 0) + (candidateChannel.subscriberCount || 0)) / 2
  const subSimilarity = avgSubs > 0 ? 1 - (subDiff / avgSubs) : 0
  score += subSimilarity * 0.4
  
  // Video count similarity
  const videoDiff = Math.abs((favoriteChannel.videoCount || 0) - (candidateChannel.videoCount || 0))
  const avgVideos = ((favoriteChannel.videoCount || 0) + (candidateChannel.videoCount || 0)) / 2
  const videoSimilarity = avgVideos > 0 ? 1 - (videoDiff / avgVideos) : 0
  score += videoSimilarity * 0.3
  
  // Base score for being related
  score += 0.3
  
  return Math.min(score, 1)
}

function calculateTrendingScore(channel: any): number {
  let score = 0
  
  // Subscriber count factor (logarithmic)
  score += Math.log10(Math.max(channel.subscriberCount || 1, 1)) * 0.4
  
  // Video count factor (indicates activity)
  score += Math.log10(Math.max(channel.videoCount || 1, 1)) * 0.3
  
  // Random factor for diversity
  score += Math.random() * 0.3
  
  return score
}