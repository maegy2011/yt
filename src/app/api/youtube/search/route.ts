import { NextRequest, NextResponse } from 'next/server'

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
      results = await youtube.search(query, { type: type as any })
      console.log('Initial search completed, items count:', results.items?.length || 0)
    }
    
    // Extract video data - handle all items as videos since we're searching for videos
    const videoItems = results.items?.map((item: any, index: number) => {
      // Check if this looks like a video (has id, title, and basic video properties)
      if (item.id && item.title && (item.thumbnail || item.duration !== undefined)) {
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
        
        return {
          id: item.id,
          type: 'video',
          title: item.title,
          description: item.description,
          thumbnail: item.thumbnail || {
            url: `https://img.youtube.com/vi/${item.id}/mqdefault.jpg`,
            width: 320,
            height: 180
          },
          duration: formattedDuration,
          viewCount: item.viewCount,
          publishedAt: item.publishedAt,
          isLive: item.isLive || false,
          channel: {
            id: item.channel?.id,
            name: item.channel?.name || item.channel || 'Unknown Channel',
            thumbnail: item.channel?.thumbnail
          }
        }
      }
      return null
    }).filter(Boolean) || []
    
    console.log('Video items processed:', videoItems.length)
    console.log('Continuation token available:', !!results.continuation)
    
    // Return real data only, even if empty
    const response = {
      items: videoItems,
      continuation: results.continuation || null,
      query: query, // Include the original query for reference
      page: parseInt(page),
      hasMore: !!results.continuation
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('YouTube search error:', error)
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