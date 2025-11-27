import { NextRequest, NextResponse } from 'next/server'
import { YouTubeClient, YouTubeiModule, YouTubeSearchResponse, YouTubeSearchResult, YouTubeThumbnails, YouTubeChannel } from '@/types/youtube-api'

// Use dynamic import for youtubei to avoid module resolution issues
let Client: (new () => YouTubeClient) | null = null
let youtubei: YouTubeiModule | null = null

const initializeYoutubei = async (): Promise<void> => {
  try {
    const youtubeiModule = await import('youtubei') as unknown as YouTubeiModule
    youtubei = youtubeiModule
    Client = youtubeiModule.default?.Client || youtubeiModule.Client
    console.log('YouTubei initialized successfully')
  } catch (error) {
    console.error('Failed to initialize YouTubei:', error)
  }
}

// Initialize immediately
initializeYoutubei().catch(console.error)

// Helper function to extract thumbnail URL from YouTubei v1.8.0 Thumbnails API
function extractThumbnail(thumbnails: YouTubeThumbnails | string | undefined): { url: string; width: number; height: number } {
  try {
    if (!thumbnails) {
      return {
        url: `https://via.placeholder.com/320x180/374151/ffffff?text=No+Thumbnail`,
        width: 320,
        height: 180
      }
    }

    // Handle YouTubei v1.8.0 Thumbnails object (has .best property)
    if (typeof thumbnails === 'object' && thumbnails.best && typeof thumbnails.best === 'string') {
      return {
        url: thumbnails.best,
        width: 1280,
        height: 720
      }
    }

    // Handle YouTubei v1.8.0 Thumbnails array
    if (thumbnails.thumbnails && Array.isArray(thumbnails.thumbnails) && thumbnails.thumbnails.length > 0) {
      // Use best thumbnail (highest resolution) - usually the last one
      const bestThumbnail = thumbnails.thumbnails[thumbnails.thumbnails.length - 1]
      if (bestThumbnail && bestThumbnail.url) {
        return {
          url: bestThumbnail.url,
          width: bestThumbnail.width || 1280,
          height: bestThumbnail.height || 720
        }
      }
    }

    // Handle single thumbnail object
    if (typeof thumbnails === 'object' && (thumbnails as any).url) {
      const thumb = thumbnails as any
      return {
        url: thumb.url,
        width: thumb.width || 320,
        height: thumb.height || 180
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

// Helper function to extract channel information from YouTubei v1.8.0 BaseChannel
function extractChannel(channel: YouTubeChannel | undefined | null): { id: string; name: string; thumbnail?: string; subscriberCount?: string | number; handle?: string } {
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
    thumbnail: channelThumbnail || channel.thumbnail,
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
    if (!Client) {
      console.error('YouTube client not initialized, waiting...')
      // Wait a bit and retry once
      await new Promise(resolve => setTimeout(resolve, 1000))
      if (!Client) {
        return NextResponse.json({ 
          error: 'YouTube service temporarily unavailable. Please try again.',
          items: [],
          continuation: null,
          query: query,
          page: parseInt(page),
          hasMore: false
        }, { status: 503 })
      }
    }
    const youtube = new Client()
    
    let results: YouTubeSearchResponse
    if (continuation) {
      // For pagination, use the continuation token properly
      try {
        console.log('Attempting continuation search with token:', continuation.substring(0, 50) + '...')
        
        // Create a new client for continuation
        if (!Client) {
          return NextResponse.json({ error: 'YouTube client not initialized' }, { status: 500 })
        }
        const continuationClient = new Client()
        const continuationResults = await continuationClient.search(query, { 
          type: type as 'video' | 'playlist' | 'channel',
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
        const channelItems = channelData.items.map((channel: Record<string, unknown>): YouTubeSearchResult => {
          const channelRecord = channel as {
            channelId?: string
            id?: string
            name?: string
            description?: string
            thumbnail?: string
            subscriberCount?: string | number
            videoCount?: number
            viewCount?: string | number
            handle?: string
            isFavorite?: boolean
            stats?: unknown
          }
          
          return {
            id: channelRecord.channelId || channelRecord.id || '',
            type: 'channel',
            title: channelRecord.name || '',
            description: channelRecord.description,
            thumbnail: channelRecord.thumbnail,
            subscriberCount: channelRecord.subscriberCount,
            videoCount: channelRecord.videoCount,
            viewCount: channelRecord.viewCount,
            channel: {
              id: channelRecord.channelId || channelRecord.id || '',
              name: channelRecord.name || '',
              thumbnail: channelRecord.thumbnail,
              subscriberCount: channelRecord.subscriberCount,
              handle: channelRecord.handle
            },
            isFavorite: channelRecord.isFavorite,
            stats: channelRecord.stats
          }
        })
        
        results = {
          items: channelItems,
          continuation: null // Channel search doesn't support pagination
        }
        
        console.log('Channel search completed, items count:', channelItems.length)
      } else {
        // For specific types (video, playlist), use normal search
        results = await youtube.search(query, { type: type as 'video' | 'playlist' | 'channel' })
        console.log('Initial search completed, items count:', results.items?.length || 0)
      }
    }
    
    // Extract video, playlist, and channel data
    const videoItems = results.items?.map((item: YouTubeSearchResult): YouTubeSearchResult | null => {
      // Handle channel items
      if (item.type === 'channel') {
        return item // Already in correct format
      }
      
      // Type assertion for item properties
      const itemRecord = item as Record<string, unknown>
      
      // Check if this is a playlist by ID pattern (starts with PL) or has videoCount
      const itemId = typeof itemRecord.id === 'string' ? itemRecord.id : ''
      const isPlaylistById = itemId.startsWith('PL')
      const videoCount = itemRecord.videoCount as number | undefined
      const duration = itemRecord.duration as string | number | undefined
      const isPlaylistByVideoCount = videoCount !== undefined && !duration
      
      if (isPlaylistById || isPlaylistByVideoCount) {
        // This is a playlist
        const channelInfo = extractChannel(itemRecord.channel as YouTubeChannel | undefined)
        
        return {
          id: itemId,
          type: 'playlist',
          title: typeof itemRecord.title === 'string' ? itemRecord.title : '',
          description: itemRecord.description as string | undefined,
          thumbnail: extractThumbnail(itemRecord.thumbnails as YouTubeThumbnails | string | undefined),
          videoCount: videoCount || 0,
          viewCount: itemRecord.viewCount as string | number | undefined,
          lastUpdatedAt: itemRecord.lastUpdatedAt as string | undefined,
          channel: channelInfo
        }
      }
      // Check if this looks like a video (has id, title, and basic video properties)
      else if (itemRecord.id && itemRecord.title && (itemRecord.thumbnails || itemRecord.thumbnail || duration !== undefined || itemRecord.viewCount !== undefined)) {
        // Format duration properly
        let formattedDuration: string | number | undefined = duration
        if (duration) {
          // Handle various duration formats from YouTube API
          if (typeof duration === 'string') {
            // If it's already in MM:SS or HH:MM:SS format, keep it
            if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(duration)) {
              formattedDuration = duration
            }
            // If it's in ISO 8601 format (PT4M13S), convert it
            else if (duration.startsWith('PT')) {
              const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
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
            else if (/^\d+$/.test(duration)) {
              const totalSeconds = parseInt(duration)
              const minutes = Math.floor(totalSeconds / 60)
              const seconds = totalSeconds % 60
              formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`
            }
          }
          // If it's a number, convert it
          else if (typeof duration === 'number') {
            const minutes = Math.floor(duration / 60)
            const seconds = Math.floor(duration % 60)
            formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`
          }
        }
        
        const channelInfo = extractChannel(itemRecord.channel as YouTubeChannel | undefined)
        
        return {
          id: itemId,
          type: 'video',
          title: typeof itemRecord.title === 'string' ? itemRecord.title : '',
          description: itemRecord.description as string | undefined,
          thumbnail: extractThumbnail(itemRecord.thumbnails as YouTubeThumbnails | string | undefined),
          duration: formattedDuration,
          viewCount: itemRecord.viewCount as string | number | undefined,
          publishedAt: itemRecord.uploadDate as string | undefined, // YouTubei v1.8.0 API: uploadDate provides human-readable relative dates
          isLive: (itemRecord.isLive as boolean) || false,
          channel: channelInfo
        }
      }
      // Check if this looks like a playlist (has id, title, videoCount but no duration)
      else if (itemRecord.id && itemRecord.title && (videoCount !== undefined || itemRecord.type === 'playlist')) {
        const channelInfo = extractChannel(itemRecord.channel as YouTubeChannel | undefined)
        
        return {
          id: itemId,
          type: 'playlist',
          title: typeof itemRecord.title === 'string' ? itemRecord.title : '',
          description: itemRecord.description as string | undefined,
          thumbnail: extractThumbnail(itemRecord.thumbnails as YouTubeThumbnails | string | undefined),
          videoCount: videoCount || 0,
          viewCount: itemRecord.viewCount as string | number | undefined,
          lastUpdatedAt: itemRecord.lastUpdatedAt as string | undefined,
          channel: channelInfo
        }
      }
      return null
    }).filter((item): item is YouTubeSearchResult => item !== null) || []
    
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