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
    console.log('POST /api/channels - Starting request');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { id, name, description, thumbnailUrl, category } = body;

    // Validate required fields
    if (!id || !name) {
      console.log('Validation failed: Missing id or name');
      return NextResponse.json(
        { error: 'Channel ID and name are required', details: { id: !!id, name: !!name } },
        { status: 400 }
      );
    }

    // Validate channel ID format (should start with UC...)
    if (!id.startsWith('UC')) {
      console.log('Validation failed: Invalid channel ID format');
      return NextResponse.json(
        { error: 'Channel ID must start with UC...', details: { providedId: id } },
        { status: 400 }
      );
    }

    // Validate field lengths
    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Channel name is too long (max 100 characters)', details: { nameLength: name.length } },
        { status: 400 }
      );
    }

    if (id.length > 50) {
      return NextResponse.json(
        { error: 'Channel ID is too long (max 50 characters)', details: { idLength: id.length } },
        { status: 400 }
      );
    }

    console.log('Creating channel with data:', { id, name, description: description?.substring(0, 50), thumbnailUrl: !!thumbnailUrl, category });

    // Test database connection first
    try {
      await db.$connect();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 503 }
      );
    }

    // Check if table exists by trying to query it first
    try {
      console.log('Checking if channels table exists...');
      await db.channel.findFirst();
      console.log('Channels table exists');
    } catch (tableError) {
      console.error('Channels table might not exist:', tableError);
      return NextResponse.json(
        { 
          error: 'Database table not found', 
          details: 'The channels table does not exist. Please run database setup first.',
          suggestion: 'Visit /api/setup-database to create the table'
        },
        { status: 500 }
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

    console.log('Channel created successfully:', channel);

    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    console.error('Error creating channel:', error);
    
    // Check for specific database errors
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      
      if (error.message.includes('Unique constraint') || error.message.includes('duplicate key')) {
        return NextResponse.json(
          { error: 'Channel with this ID already exists', details: error.message },
          { status: 409 }
        );
      }
      
      if (error.message.includes('database') || error.message.includes('connection')) {
        return NextResponse.json(
          { error: 'Database connection error. Please check database configuration.', details: error.message },
          { status: 503 }
        );
      }
      
      if (error.message.includes('does not exist') || error.message.includes('table')) {
        return NextResponse.json(
          { 
            error: 'Database table not found', 
            details: error.message,
            suggestion: 'Please run database setup first by visiting /api/setup-database'
          },
          { status: 500 }
        );
      }
      
      if (error.message.includes('invalid input')) {
        return NextResponse.json(
          { error: 'Invalid data provided', details: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create channel', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}