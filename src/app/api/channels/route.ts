import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const channels = await db.favoriteChannel.findMany({
      orderBy: { addedAt: 'desc' }
    })
    
    // Sanitize data to prevent JSON serialization issues
    const sanitizedChannels = channels.map(channel => ({
      ...channel,
      name: channel.name || '',
      thumbnail: channel.thumbnail || '',
      logoUrl: channel.logoUrl || null,
      hasCustomLogo: channel.hasCustomLogo || false,
      subscriberCount: channel.subscriberCount || 0
    }))
    
    return NextResponse.json(sanitizedChannels)
  } catch (error) {
    console.error('Error fetching channels:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch channels',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { channelId, name, thumbnail, subscriberCount, logoUrl, hasCustomLogo } = body

    const existing = await db.favoriteChannel.findUnique({
      where: { channelId }
    })

    if (existing) {
      return NextResponse.json({ error: 'Already exists' }, { status: 409 })
    }

    const channel = await db.favoriteChannel.create({
      data: {
        channelId,
        name,
        thumbnail,
        logoUrl: logoUrl || null,
        hasCustomLogo: hasCustomLogo || false,
        subscriberCount: subscriberCount || 0
      }
    })

    return NextResponse.json(channel)
  } catch (error) {
    console.error('Error adding channel:', error)
    return NextResponse.json({ 
      error: 'Failed to add channel',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}