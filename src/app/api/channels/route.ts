import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const channels = await db.channel.findMany({
      orderBy: {
        addedAt: 'desc'
      }
    });

    return NextResponse.json(channels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, name, description, thumbnailUrl, category } = await request.json();

    if (!id || !name) {
      return NextResponse.json(
        { error: 'Channel ID and name are required' },
        { status: 400 }
      );
    }

    const channel = await db.channel.create({
      data: {
        id,
        name,
        description,
        thumbnailUrl,
        category
      }
    });

    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    console.error('Error creating channel:', error);
    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    );
  }
}