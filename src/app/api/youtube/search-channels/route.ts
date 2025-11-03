import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const sortBy = searchParams.get('sortBy') || 'relevance' // relevance, subscribers, videos, views
    const order = searchParams.get('order') || 'desc' // desc, asc
    const limit = parseInt(searchParams.get('limit') || '20')
    const includeStats = searchParams.get('includeStats') === 'true'

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    console.log('Enhanced channel search request:', { 
      query, 
      sortBy, 
      order, 
      limit, 
      includeStats 
    })

    // Use youtubei for real YouTube data
    const { Client } = await import('youtubei')
    const youtube = new Client()
    
    // Search for channels specifically
    const results = await youtube.search(query, { type: 'channel' })
    
    if (!results.items || results.items.length === 0) {
      return NextResponse.json({
        items: [],
        query: query,
        total: 0,
        message: 'No channels found'
      })
    }

    // Get favorite channels for comparison
    const favoriteChannels = await db.favoriteChannel.findMany()
    const favoriteChannelIds = new Set(favoriteChannels.map(fc => fc.channelId))

    // Extract and enhance channel data
    let channelItems = results.items
      .filter((item: any) => {
        // Validate that this looks like a channel
        return item.id && item.name && (item.thumbnail || item.subscriberCount !== undefined)
      })
      .map((item: any) => {
        const channelId = item.id
        const isFavorite = favoriteChannelIds.has(channelId)
        
        const channelData = {
          id: channelId,
          channelId: channelId,
          name: item.name,
          description: item.description || '',
          thumbnail: item.thumbnail?.url || item.thumbnail,
          subscriberCount: item.subscriberCount || 0,
          videoCount: item.videoCount || 0,
          viewCount: item.viewCount || 0,
          isVerified: item.verified || false,
          isFamilyFriendly: item.familyFriendly || false,
          joinedDate: item.joinedDate,
          country: item.country,
          type: 'channel',
          // Enhanced data
          isFavorite,
          stats: {
            subscribers: item.subscriberCount || 0,
            totalVideos: item.videoCount || 0,
            totalViews: item.viewCount || 0,
            avgViewsPerVideo: (item.videoCount && item.viewCount) ? 
              Math.round(item.viewCount / item.videoCount) : 0
          },
          metadata: {
            searchedAt: new Date().toISOString(),
            query: query
          }
        }

        // Add additional stats if requested
        if (includeStats) {
          (channelData as any).enhancedStats = {
            subscriberRank: item.subscriberCount ? Math.log10(item.subscriberCount) : 0,
            activityScore: (item.videoCount || 0) * 0.3 + (item.viewCount || 0) * 0.000001,
            engagementRatio: item.subscriberCount && item.viewCount ? 
              (item.viewCount / item.subscriberCount) : 0
          }
        }

        return channelData
      })

    // Sort channels based on criteria
    channelItems.sort((a: any, b: any) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'subscribers':
          aValue = a.subscriberCount || 0
          bValue = b.subscriberCount || 0
          break
        case 'videos':
          aValue = a.videoCount || 0
          bValue = b.videoCount || 0
          break
        case 'views':
          aValue = a.viewCount || 0
          bValue = b.viewCount || 0
          break
        case 'name':
          aValue = a.name?.toLowerCase() || ''
          bValue = b.name?.toLowerCase() || ''
          break
        case 'relevance':
        default:
          // For relevance, prioritize exact name matches and subscriber count
          const aExactMatch = a.name?.toLowerCase() === query.toLowerCase()
          const bExactMatch = b.name?.toLowerCase() === query.toLowerCase()
          
          if (aExactMatch && !bExactMatch) return -1
          if (!aExactMatch && bExactMatch) return 1
          
          aValue = a.subscriberCount || 0
          bValue = b.subscriberCount || 0
          break
      }
      
      if (order === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // Apply limit
    const limitedItems = channelItems.slice(0, limit)

    // Add search metadata
    const response = {
      items: limitedItems,
      query: query,
      total: channelItems.length,
      returned: limitedItems.length,
      searchParams: {
        sortBy,
        order,
        limit,
        includeStats
      },
      favorites: {
        total: favoriteChannels.length,
        inResults: limitedItems.filter((ch: any) => ch.isFavorite).length
      },
      timestamp: new Date().toISOString()
    }
    
    console.log('Enhanced channel search completed:', {
      query,
      totalFound: channelItems.length,
      returned: limitedItems.length,
      sortBy,
      order
    })
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Enhanced YouTube channel search error:', error)
    const { searchParams } = new URL(request.url)
    
    // Return more specific error messages
    if (error instanceof Error && (error.message?.includes('quota') || error.message?.includes('limit'))) {
      return NextResponse.json({ 
        error: 'API quota exceeded. Please try again later.',
        items: [],
        query: searchParams.get('query') || ''
      }, { status: 429 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to search channels. Please try again later.',
      items: [],
      query: searchParams.get('query') || '',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}