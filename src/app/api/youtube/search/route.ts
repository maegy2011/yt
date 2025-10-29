import { NextRequest, NextResponse } from 'next/server'
import { youtubeRateLimiters, addRandomJitter } from '@/lib/rate-limiter'

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

    // Apply rate limiting for search requests (most restrictive)
    await youtubeRateLimiters.search.execute(async () => {
      // Add random jitter to appear more human
      const jitter = addRandomJitter(500, 1000) // 500-1500ms random delay
      await new Promise(resolve => setTimeout(resolve, jitter))
    })

    // Use youtubei for real YouTube data only
    const { Client } = await import('youtubei')
    const youtube = new Client()
    
    let results
    if (continuation) {
      // For pagination, use the continuation token properly
      try {
        
        // Create a new client for continuation
        const continuationClient = new Client()
        const continuationResults = await continuationClient.search(query, { 
          type: type as any,
          continuation: continuation 
        })
        
        if (continuationResults && continuationResults.items) {
          results = continuationResults
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
    }
    
    // Function to get the best quality channel logo/avatar
function getChannelLogo(item: any): string | null {
  const sources = [
    item.avatar?.[0]?.url,
    item.avatar?.url,
    item.thumbnail?.url,
    item.banner?.url,
  ].filter(Boolean)
  return sources[0] || null
}

// Function to check if channel is verified
function isChannelVerified(item: any): boolean {
  return item.verified || item.badges?.some((badge: any) => badge.type === 'VERIFIED_CHANNEL')
}

// Extract data based on type
    let searchItems
    if (type === 'channel') {
      // For channel searches, extract channel data with real logos
      searchItems = results.items?.map((item: any, index: number) => {
        // Check if this looks like a channel (has id, name, and channel-specific properties)
        if (item.id && item.name && (item.thumbnail || item.subscriberCount !== undefined)) {
          // Convert subscriber count to number if it's a string
          let subscriberCount = 0
          if (typeof item.subscriberCount === 'string') {
            // Extract numbers from string like "1.2M subscribers" or "9917"
            const match = item.subscriberCount.match(/[\d.]+/g)
            if (match) {
              const num = parseFloat(match[0])
              if (item.subscriberCount.toLowerCase().includes('k')) {
                subscriberCount = Math.round(num * 1000)
              } else if (item.subscriberCount.toLowerCase().includes('m')) {
                subscriberCount = Math.round(num * 1000000)
              } else {
                subscriberCount = Math.round(num)
              }
            }
          } else if (typeof item.subscriberCount === 'number') {
            subscriberCount = item.subscriberCount
          }

          const logoUrl = getChannelLogo(item)
          const hasCustomLogo = logoUrl && !logoUrl.includes('ui-avatars.com')

          return {
            id: item.id,
            type: 'channel',
            name: item.name,
            description: item.description,
            thumbnail: {
              url: logoUrl || item.thumbnail?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=6366f1&color=fff&size=128`,
              width: 128,
              height: 128
            },
            logoUrl: logoUrl,
            hasCustomLogo: hasCustomLogo,
            subscriberCount: subscriberCount,
            videoCount: item.videoCount || 0,
            isVerified: isChannelVerified(item)
          }
        }
        return null
      }).filter(Boolean) || []
    } else {
      // For video searches, extract video data with better channel info
      searchItems = results.items?.map((item: any, index: number) => {
        // Check if this looks like a video (has id, title, and basic video properties)
        if (item.id && item.title && (item.thumbnail || item.duration !== undefined)) {
          // Get channel logo for video
          const channelLogo = getChannelLogo(item.channel || {})
          
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
              thumbnail: {
                url: channelLogo || item.channel?.thumbnail?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.channel?.name || 'Unknown')}&background=6366f1&color=fff&size=32`,
                width: 32,
                height: 32
              },
              logoUrl: channelLogo,
              hasCustomLogo: channelLogo && !channelLogo.includes('ui-avatars.com')
            }
          }
        }
        return null
      }).filter(Boolean) || []
    }
    
    
    // Return real data only, even if empty
    const response = {
      items: searchItems,
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
      query: '',
      page: 1,
      hasMore: false
    }, { status: 500 })
  }
}