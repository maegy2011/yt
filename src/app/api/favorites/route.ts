import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeVideoId, isValidYouTubeVideoId } from '@/lib/youtube-utils'

export async function GET() {
  try {
    const favorites = await db.favoriteVideo.findMany({
      orderBy: { addedAt: 'desc' }
    })
    
    // Filter out any entries with invalid video IDs
    const validFavorites = favorites.filter(favorite => 
      favorite.videoId && isValidYouTubeVideoId(favorite.videoId)
    )
    
    // Clean up invalid entries from database
    const invalidFavorites = favorites.filter(favorite => 
      !favorite.videoId || !isValidYouTubeVideoId(favorite.videoId)
    )
    
    if (invalidFavorites.length > 0) {
      console.log(`Cleaning up ${invalidFavorites.length} invalid favorite entries`)
      await Promise.all(
        invalidFavorites.map(favorite => 
          db.favoriteVideo.delete({ where: { id: favorite.id } })
        )
      )
    }
    
    return NextResponse.json(validFavorites)
  } catch (error) {
    console.error('Failed to fetch favorites:', error)
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoId, title, channelName, thumbnail, duration, viewCount } = body

    // Validate and sanitize the video ID
    const sanitizedVideoId = sanitizeVideoId(videoId)
    
    if (!sanitizedVideoId) {
      console.error('Invalid video ID provided:', videoId)
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
    }

    const existing = await db.favoriteVideo.findUnique({
      where: { videoId: sanitizedVideoId }
    })

    if (existing) {
      return NextResponse.json({ error: 'Already exists' }, { status: 409 })
    }

    const favorite = await db.favoriteVideo.create({
      data: {
        videoId: sanitizedVideoId,
        title: title || 'Unknown Video',
        channelName: channelName || 'Unknown Channel',
        thumbnail: thumbnail || '',
        duration,
        viewCount
      }
    })

    return NextResponse.json(favorite)
  } catch (error) {
    console.error('Failed to add favorite:', error)
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
  }
}