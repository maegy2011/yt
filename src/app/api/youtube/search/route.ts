import { NextRequest, NextResponse } from 'next/server'

// Helper function to extract thumbnail URL from YouTubei v1.7.0 Thumbnails API
function extractThumbnail(thumbnails: any): { url: string; width: number; height: number } {
  try {
    if (!thumbnails) {
      return {
        url: `https://via.placeholder.com/320x180/374151/ffffff?text=No+Thumbnail`,
        width: 320,
        height: 180
      }
    }

    // Handle YouTubei v1.7.0 Thumbnails object (has .best property)
    if (thumbnails && typeof thumbnails === 'object' && thumbnails.best && typeof thumbnails.best === 'string') {
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
    console.error('Error extracting thumbnail:', error)
    return {
      url: `https://via.placeholder.com/320x180/374151/ffffff?text=Error`,
      width: 320,
      height: 180
    }
  }
}

// Helper function to extract channel information from YouTubei v1.7.0 BaseChannel
function extractChannel(channel: any): { id: string; name: string; thumbnail?: string; subscriberCount?: string; handle?: string } {
  if (!channel) {
    return {
      id: '',
      name: 'Unknown Channel'
    }
  }

  // Extract channel thumbnail using the same thumbnail extraction logic
  let channelThumbnail: string | undefined
  if (channel.thumbnails) {
    const thumbnailData = extractThumbnail(channel.thumbnails)
    channelThumbnail = thumbnailData.url
  }

  return {
    id: channel.id || '',
    name: channel.name || 'Unknown Channel',
    thumbnail: channelThumbnail,
    subscriberCount: channel.subscriberCount,
    handle: channel.handle
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const type = searchParams.get('type') || 'video'
    const continuation = searchParams.get('continuation')
    const page = searchParams.get('page') || '1'

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    console.log('Search request:', { 
      query, 
      page,
      hasContinuation: !!continuation,
      continuationLength: continuation?.length || 0
    })

    // Use youtubei for real YouTube data only
    const { Client } = await import('youtubei')
    const youtube = new Client()
    
    let results
    if (continuation) {
      // For pagination, use the continuation token properly
      try {
        console.log('Attempting continuation search with token:', continuation.substring(0, 50) + '...')
        
        // Create a new client for continuation
        const continuationClient = new Client()
        const continuationResults = await continuationClient.search(query, { 
          type: type as any,
          continuation: continuation 
        })
        
        if (continuationResults && continuationResults.items) {
          results = continuationResults
          console.log('Continuation search successful, items count:', results.items?.length || 0)
        } else {
          throw new Error('Continuation returned no results')
        }
      } catch (continuationError) {
        console.error('Continuation search failed:', continuationError)
        // When continuation fails, return empty results to stop pagination
        // This prevents showing unrelated content
        return NextResponse.json({
          items: [],
          continuation: null,
          query: query,
          page: parseInt(page),
          hasMore: false
        })
      }
    } else {
      // Initial search
      if (type === 'all') {
        // For 'all' type, perform separate searches and combine results
        console.log('Performing separate searches for videos, playlists, and channels')
        
        const [videoResults, playlistResults, channelResults] = await Promise.all([
          youtube.search(query, { type: 'video' }),
          youtube.search(query, { type: 'playlist' }),
          fetch(`${request.nextUrl.origin}/api/youtube/search-channels?query=${encodeURIComponent(query)}&limit=10`).then(r => r.json())
        ])
        
        // Combine results, taking more videos than playlists and channels for better balance
        const videoItems = videoResults.items || []
        const playlistItems = playlistResults.items || []
        const channelItems = channelResults.items || []
        
        // Take balanced amounts: 10 videos, 3 playlists, 2 channels
        const selectedVideos = videoItems.slice(0, 10)
        const selectedPlaylists = playlistItems.slice(0, 3)
        const selectedChannels = channelItems.slice(0, 2)
        
        // Interleave results: start with videos, then channels and playlists, then more videos
        const combinedItems = [
          ...selectedVideos.slice(0, 6),  // First 6 videos
          ...selectedChannels,             // 2 channels
          ...selectedPlaylists,           // 3 playlists  
          ...selectedVideos.slice(6)     // Remaining videos
        ]
        
        results = {
          items: combinedItems,
          continuation: videoResults.continuation || playlistResults.continuation
        }
        
        console.log(`Combined search completed: ${selectedVideos.length} videos, ${selectedPlaylists.length} playlists, ${selectedChannels.length} channels, total: ${combinedItems.length}`)
      } else if (type === 'playlist') {
        // For playlist search, try to get playlist results
        results = await youtube.search(query, { type: 'playlist' })
        console.log('Playlist search completed, items count:', results.items?.length || 0)
        
        // If no playlists found, try video search with playlist keywords
        if (!results.items || results.items.length === 0) {
          console.log('No playlists found, trying video search with playlist keywords')
          results = await youtube.search(query + ' playlist', { type: 'video' })
          console.log('Video search with playlist keywords completed, items count:', results.items?.length || 0)
        }
      } else if (type === 'channel') {
        // For channel search, use the search-channels API
        const channelSearchUrl = new URL(`${request.nextUrl.origin}/api/youtube/search-channels`)
        channelSearchUrl.searchParams.set('query', query)
        channelSearchUrl.searchParams.set('limit', '20')
        
        const channelResponse = await fetch(channelSearchUrl.toString())
        if (!channelResponse.ok) {
          throw new Error('Failed to search channels')
        }
        
        const channelData = await channelResponse.json()
        
        // Convert channel data to match expected format
        const channelItems = channelData.items.map((channel: any) => ({
          id: channel.channelId || channel.id,
          type: 'channel',
          title: channel.name,
          description: channel.description,
          thumbnail: channel.thumbnail,
          subscriberCount: channel.subscriberCount,
          videoCount: channel.videoCount,
          viewCount: channel.viewCount,
          channel: {
            id: channel.channelId || channel.id,
            name: channel.name,
            thumbnail: channel.thumbnail,
            subscriberCount: channel.subscriberCount,
            handle: channel.handle
          },
          isFavorite: channel.isFavorite,
          stats: channel.stats
        }))
        
        results = {
          items: channelItems,
          continuation: null // Channel search doesn't support pagination
        }
        
        console.log('Channel search completed, items count:', channelItems.length)
      } else {
        // For specific types (video, playlist), use normal search
        results = await youtube.search(query, { type: type as any })
        console.log('Initial search completed, items count:', results.items?.length || 0)
      }
    }
    
    // Extract video, playlist, and channel data
    const videoItems = results.items?.map((item: any, index: number) => {
      // Handle channel items
      if (item.type === 'channel') {
        return item // Already in correct format
      }
      
      // Check if this is a playlist by ID pattern (starts with PL) or has videoCount
      const isPlaylistById = item.id && typeof item.id === 'string' && item.id.startsWith('PL')
      const isPlaylistByVideoCount = item.videoCount !== undefined && !item.duration
      
      if (isPlaylistById || isPlaylistByVideoCount) {
        // This is a playlist
        const channelInfo = extractChannel(item.channel)
        
        return {
          id: item.id,
          type: 'playlist',
          title: item.title,
          description: item.description,
          thumbnail: extractThumbnail(item.thumbnails || item.thumbnail),
          videoCount: item.videoCount || 0,
          viewCount: item.viewCount || 0,
          lastUpdatedAt: item.lastUpdatedAt,
          channel: channelInfo
        }
      }
      // Check if this looks like a video (has id, title, and basic video properties)
      else if (item.id && item.title && (item.thumbnails || item.thumbnail || item.duration !== undefined || item.viewCount !== undefined)) {
        // Format duration properly
        let formattedDuration = item.duration
        if (item.duration) {
          // Handle various duration formats from YouTube API
          if (typeof item.duration === 'string') {
            // If it's already in MM:SS or HH:MM:SS format, keep it
            if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(item.duration)) {
              formattedDuration = item.duration
            }
            // If it's in ISO 8601 format (PT4M13S), convert it
            else if (item.duration.startsWith('PT')) {
              const match = item.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
              if (match) {
                const hours = parseInt(match[1] || '0')
                const minutes = parseInt(match[2] || '0')
                const seconds = parseInt(match[3] || '0')
                
                if (hours > 0) {
                  formattedDuration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                } else {
                  formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`
                }
              }
            }
            // If it's a number of seconds, convert it
            else if (/^\d+$/.test(item.duration)) {
              const totalSeconds = parseInt(item.duration)
              const minutes = Math.floor(totalSeconds / 60)
              const seconds = totalSeconds % 60
              formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`
            }
          }
          // If it's a number, convert it
          else if (typeof item.duration === 'number') {
            const minutes = Math.floor(item.duration / 60)
            const seconds = Math.floor(item.duration % 60)
            formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`
          }
        }
        
        const channelInfo = extractChannel(item.channel)
        
        return {
          id: item.id,
          type: 'video',
          title: item.title,
          description: item.description,
          thumbnail: extractThumbnail(item.thumbnails || item.thumbnail),
          duration: formattedDuration,
          viewCount: item.viewCount,
          publishedAt: item.uploadDate, // YouTubei v1.7.0 API: uploadDate provides human-readable relative dates
          isLive: item.isLive || false,
          channel: channelInfo
        }
      }
      // Check if this looks like a playlist (has id, title, videoCount but no duration)
      else if (item.id && item.title && (item.videoCount !== undefined || item.type === 'playlist')) {
        const channelInfo = extractChannel(item.channel)
        
        return {
          id: item.id,
          type: 'playlist',
          title: item.title,
          description: item.description,
          thumbnail: extractThumbnail(item.thumbnails || item.thumbnail),
          videoCount: item.videoCount || 0,
          viewCount: item.viewCount || 0,
          lastUpdatedAt: item.lastUpdatedAt,
          channel: channelInfo
        }
      }
      return null
    }).filter(Boolean) || []
    
    console.log('Items processed:', videoItems.length)
    console.log('Continuation token available:', !!results.continuation)
    
    // Return real data only, even if empty
    const response = {
      items: videoItems,
      continuation: results.continuation || null,
      query: query, // Include the original query for reference
      page: parseInt(page),
      hasMore: !!results.continuation
    }
    
    console.log('Final response items count:', response.items.length)
    console.log('First item channel data:', response.items[0]?.channel)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('YouTube search error:', error)
    const { searchParams } = new URL(request.url)
    return NextResponse.json({ 
      error: 'Failed to search YouTube. Please try again later.',
      items: [],
      continuation: null,
      query: searchParams.get('query') || '',
      page: 1,
      hasMore: false
    }, { status: 500 })
  }
}