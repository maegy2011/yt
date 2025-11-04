import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper function to extract thumbnail URL from YouTubei v1.7.0 Thumbnails API
function extractThumbnail(thumbnails: any): { url: string; width: number; height: number } {
  if (!thumbnails) {
    return {
      url: `https://via.placeholder.com/320x180/374151/ffffff?text=No+Thumbnail`,
      width: 320,
      height: 180
    }
  }

  // Handle YouTubei v1.7.0 Thumbnails object (has .best property)
  if (thumbnails.best && typeof thumbnails.best === 'string') {
    return {
      url: thumbnails.best,
      width: 1280,
      height: 720
    }
  }

  // Handle YouTubei v1.7.0 Thumbnails array
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
  if (thumbnails.url) {
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
}

// Helper function to clean circular references from channel data
function cleanChannelData(channel: any): any {
  if (!channel) return null
  
  const cleaned = { ...channel }
  
  // Remove circular references
  if (cleaned.videos) {
    cleaned.videos = {
      items: cleaned.videos.items || [],
      continuation: cleaned.videos.continuation || null
    }
  }
  
  if (cleaned.playlists) {
    cleaned.playlists = {
      items: cleaned.playlists.items || [],
      continuation: cleaned.playlists.continuation || null
    }
  }
  
  if (cleaned.shorts) {
    cleaned.shorts = {
      items: cleaned.shorts.items || [],
      continuation: cleaned.shorts.continuation || null
    }
  }
  
  if (cleaned.live) {
    cleaned.live = {
      items: cleaned.live.items || [],
      continuation: cleaned.live.continuation || null
    }
  }
  
  // Remove client references
  delete cleaned.client
  
  return cleaned
}

// Helper function to extract channel information from YouTubei v1.7.0 BaseChannel/Channel
function extractChannelData(channel: any): any {
  if (!channel) {
    return null
  }

  const baseData = {
    id: channel.id,
    name: channel.name,
    description: channel.description || '',
    handle: channel.handle,
    thumbnail: extractThumbnail(channel.thumbnails),
    subscriberCount: channel.subscriberCount,
    videoCount: channel.videoCount,
    viewCount: channel.viewCount,
    // Channel-specific properties from YouTubei v1.7.0
    banner: channel.banner ? extractThumbnail(channel.banner) : undefined,
    mobileBanner: channel.mobileBanner ? extractThumbnail(channel.mobileBanner) : undefined,
    tvBanner: channel.tvBanner ? extractThumbnail(channel.tvBanner) : undefined,
    url: channel.url,
    shelves: channel.shelves || []
  }
  
  // Clean circular references
  return cleanChannelData(baseData)
}

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
        // Validate that this looks like a channel using YouTubei v1.7.0 structure
        return item.id && item.name && (item.thumbnails || item.subscriberCount !== undefined)
      })
      .map((item: any) => {
        const channelId = item.id
        const isFavorite = favoriteChannelIds.has(channelId)
        
        // Extract enhanced channel data using YouTubei v1.7.0 properties
        const channelData = extractChannelData(item)
        
        if (!channelData) return null
        
        const enhancedChannelData = {
          ...channelData,
          channelId: channelId,
          isFavorite,
          type: 'channel',
          // Enhanced stats
          stats: {
            subscribers: channelData.subscriberCount || 0,
            totalVideos: channelData.videoCount || 0,
            totalViews: channelData.viewCount || 0,
            avgViewsPerVideo: (channelData.videoCount && channelData.viewCount) ? 
              Math.round(channelData.viewCount / channelData.videoCount) : 0
          },
          metadata: {
            searchedAt: new Date().toISOString(),
            query: query,
            hasShelves: channelData.shelves && channelData.shelves.length > 0,
            hasLive: !!channelData.live,
            hasPlaylists: !!channelData.playlists,
            hasShorts: !!channelData.shorts
          }
        }

        // Add additional enhanced stats if requested
        if (includeStats) {
          enhancedChannelData.enhancedStats = {
            subscriberRank: channelData.subscriberCount ? Math.log10(parseInt(channelData.subscriberCount.replace(/[^\d]/g, '')) || 1) : 0,
            activityScore: (channelData.videoCount || 0) * 0.3 + (channelData.viewCount || 0) * 0.000001,
            engagementRatio: channelData.subscriberCount && channelData.viewCount ? 
              (parseInt(channelData.viewCount.replace(/[^\d]/g, '')) || 0) / (parseInt(channelData.subscriberCount.replace(/[^\d]/g, '')) || 1) : 0,
            contentVariety: {
              hasVideos: !!channelData.videos,
              hasShorts: !!channelData.shorts,
              hasLive: !!channelData.live,
              hasPlaylists: !!channelData.playlists,
              shelvesCount: channelData.shelves?.length || 0
            }
          }
        }

        return enhancedChannelData
      })
      .filter(Boolean) // Remove any null entries

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