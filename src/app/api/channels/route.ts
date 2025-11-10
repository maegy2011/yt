import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    console.log('Fetching favorite channels...')
    
    const channels = await db.favoriteChannel.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`Found ${channels.length} favorite channels`)
    
    return NextResponse.json(channels)
  } catch (error) {
    console.error('Failed to fetch channels - Full error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      constructor: error instanceof Error ? error.constructor.name : 'Unknown'
    })
    
    return NextResponse.json({ 
      error: 'Failed to fetch channels',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { channelId, name, thumbnail, subscriberCount, viewCount, videoCount } = body

    console.log('Follow channel request:', { channelId, name, subscriberCount, viewCount })

    // Validate required fields
    if (!channelId || !name) {
      console.error('Missing required fields:', { channelId, name })
      return NextResponse.json({ 
        error: 'Missing required fields: channelId and name are required' 
      }, { status: 400 })
    }

    // Check if channel already exists
    const existing = await db.favoriteChannel.findUnique({
      where: { channelId }
    })

    if (existing) {
      console.log('Channel already exists:', { channelId, name })
      return NextResponse.json({ 
        error: 'Channel already followed',
        channel: existing
      }, { status: 409 })
    }

    // Create new favorite channel
    const channel = await db.favoriteChannel.create({
      data: {
        channelId,
        name,
        thumbnail: thumbnail || null,
        subscriberCount: subscriberCount ? parseInt(subscriberCount.toString()) : null,
        viewCount: viewCount ? parseInt(viewCount.toString()) : null
      }
    })

    console.log('Channel followed successfully:', { 
      id: channel.id, 
      channelId: channel.channelId, 
      name: channel.name,
      viewCount: channel.viewCount
    })

    return NextResponse.json(channel)
  } catch (error) {
    console.error('Failed to add channel - Full error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      constructor: error instanceof Error ? error.constructor.name : 'Unknown'
    })
    
    // Handle specific database errors
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Channel already followed' 
      }, { status: 409 })
    }
    
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ 
        error: 'Database record not found' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      error: 'Failed to add channel',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    }, { status: 500 })
  }
}