import { NextRequest, NextResponse } from 'next/server'
import { youtubeRateLimiters, addRandomJitter } from '@/lib/rate-limiter'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const query = searchParams.get('query') || ''
    
    // Await params as required by Next.js 15
    const { channelId } = await params

    // Apply rate limiting for channel content requests
    await youtubeRateLimiters.channel.execute(async () => {
      const jitter = addRandomJitter(300, 500) // 300-800ms random delay
      await new Promise(resolve => setTimeout(resolve, jitter))
    })

    // Get channel information first
    const channelResponse = await fetch(`http://localhost:3000/api/youtube/channel/${channelId}`)
    if (!channelResponse.ok) {
      throw new Error(`Failed to fetch channel: ${channelResponse.status}`)
    }
    
    const channelData = await channelResponse.json()
    
    // Search for videos from this channel
    const searchQuery = query || channelData.name
    const searchResponse = await fetch(
      `http://localhost:3000/api/youtube/search?query=${encodeURIComponent(searchQuery)}&type=video&limit=${limit}`
    )
    
    if (!searchResponse.ok) {
      throw new Error(`Failed to search channel videos: ${searchResponse.status}`)
    }
    
    const searchData = await searchResponse.json()
    
    // Filter videos to only include those from this specific channel
    const channelVideos = searchData.items?.filter((video: any) => 
      video.channel?.id === channelId || 
      video.channel?.name === channelData.name
    ) || []

    return NextResponse.json({
      channel: {
        id: channelData.id,
        name: channelData.name,
        thumbnail: channelData.thumbnail,
        logoUrl: channelData.metadata?.logoUrl,
        hasCustomLogo: channelData.metadata?.hasCustomLogo,
        subscriberCount: channelData.metadata?.subscriberCount,
        verified: channelData.metadata?.isVerified
      },
      videos: channelVideos,
      totalVideos: channelVideos.length,
      query: searchQuery
    })

  } catch (error) {
    console.error('Channel content fetch error:', error)
    return NextResponse.json({
      error: 'Failed to fetch channel content',
      details: error instanceof Error ? error.message : 'Unknown error',
      channelId: channelId,
      videos: []
    }, { status: 500 })
  }
}