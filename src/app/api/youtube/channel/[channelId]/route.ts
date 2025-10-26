import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'youtubei'

const youtube = new Client()

export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const channel = await youtube.getChannel(params.channelId)
    
    // Extract only the necessary data to avoid circular references
    const sanitizedChannel = {
      id: channel.id,
      name: channel.name,
      description: channel.description,
      thumbnail: channel.thumbnail,
      subscriberCount: channel.subscriberCount,
      videoCount: channel.videoCount
    }
    
    return NextResponse.json(sanitizedChannel)
  } catch (error) {
    console.error('Get channel error:', error)
    return NextResponse.json({ error: 'Failed to get channel' }, { status: 500 })
  }
}