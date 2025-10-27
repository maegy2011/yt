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
      subscriberCount: channel.subscriberCount || 0
    }))
    
    return NextResponse.json(sanitizedChannels)
  } catch (error) {
    console.error('Error fetching channels:', error)
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { channelId, name, thumbnail, subscriberCount } = body

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
        subscriberCount
      }
    })

    return NextResponse.json(channel)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add channel' }, { status: 500 })
  }
}