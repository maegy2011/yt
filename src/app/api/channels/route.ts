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

    // Validate channel ID format (should start with UC...)
    if (!id.startsWith('UC')) {
      return NextResponse.json(
        { error: 'Channel ID must start with UC...' },
        { status: 400 }
      );
    }

    console.log('Creating channel with data:', { id, name, description, thumbnailUrl, category });

    const channel = await db.channel.create({
      data: {
        id,
        name,
        description,
        thumbnailUrl,
        category
      }
    });

    console.log('Channel created successfully:', channel);

    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    console.error('Error creating channel:', error);
    
    // Check for specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Channel with this ID already exists' },
          { status: 409 }
        );
      }
      
      if (error.message.includes('database') || error.message.includes('connection')) {
        return NextResponse.json(
          { error: 'Database connection error. Please check database configuration.' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create channel', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}