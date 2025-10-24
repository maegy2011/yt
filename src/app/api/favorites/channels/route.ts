import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const channels = await db.favoriteChannel.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(channels);
  } catch (error) {
    console.error('Get favorite channels error:', error);
    return NextResponse.json({ error: 'Failed to get favorite channels' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelId, channelName, thumbnail, subscriberCount } = body;

    if (!channelId || !channelName) {
      return NextResponse.json({ error: 'Channel ID and name are required' }, { status: 400 });
    }

    const channel = await db.favoriteChannel.create({
      data: {
        channelId,
        channelName,
        thumbnail,
        subscriberCount,
        userId: 'default-user', // For demo purposes
      },
    });

    return NextResponse.json(channel);
  } catch (error) {
    console.error('Add favorite channel error:', error);
    return NextResponse.json({ error: 'Failed to add favorite channel' }, { status: 500 });
  }
}