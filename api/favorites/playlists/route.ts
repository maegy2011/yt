import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const playlists = await db.favoritePlaylist.findMany({
      orderBy: {
        addedAt: 'desc'
      },
      skip,
      take: limit
    })

    const total = await db.favoritePlaylist.count()

    return NextResponse.json({
      items: playlists,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching favorite playlists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch favorite playlists' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playlistId, title, channelName, thumbnail, videoCount } = body

    if (!playlistId || !title) {
      return NextResponse.json(
        { error: 'Playlist ID and title are required' },
        { status: 400 }
      )
    }

    // Check if playlist already exists
    const existingPlaylist = await db.favoritePlaylist.findUnique({
      where: { playlistId }
    })

    if (existingPlaylist) {
      return NextResponse.json(
        { error: 'Playlist already in favorites' },
        { status: 409 }
      )
    }

    const favoritePlaylist = await db.favoritePlaylist.create({
      data: {
        playlistId,
        title,
        channelName: channelName || '',
        thumbnail: thumbnail || '',
        videoCount: videoCount ? videoCount.toString() : '0',
        addedAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json(favoritePlaylist, { status: 201 })
  } catch (error) {
    console.error('Error adding favorite playlist:', error)
    return NextResponse.json(
      { error: 'Failed to add favorite playlist' },
      { status: 500 }
    )
  }
}