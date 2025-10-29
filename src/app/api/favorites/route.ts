import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const favorites = await db.favoriteVideo.findMany({
      orderBy: { addedAt: 'desc' }
    })
    
    // Sanitize data to prevent JSON serialization issues
    const sanitizedFavorites = favorites.map(favorite => ({
      ...favorite,
      title: favorite.title || '',
      channelName: favorite.channelName || '',
      thumbnail: favorite.thumbnail || '',
      duration: favorite.duration || '',
      viewCount: favorite.viewCount || 0
    }))
    
    return NextResponse.json(sanitizedFavorites)
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoId, title, channelName, thumbnail, duration, viewCount } = body

    const existing = await db.favoriteVideo.findUnique({
      where: { videoId }
    })

    if (existing) {
      return NextResponse.json({ error: 'Already exists' }, { status: 409 })
    }

    const favorite = await db.favoriteVideo.create({
      data: {
        videoId,
        title,
        channelName,
        thumbnail,
        duration,
        viewCount
      }
    })

    return NextResponse.json(favorite)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
  }
}