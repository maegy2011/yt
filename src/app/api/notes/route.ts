import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    const notes = await db.videoNote.findMany({
      where: videoId ? { videoId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Get notes error:', error);
    return NextResponse.json({ error: 'Failed to get notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, title, content, timestamp, fontSize } = body;

    if (!videoId || !title || !content) {
      return NextResponse.json({ error: 'Video ID, title, and content are required' }, { status: 400 });
    }

    const note = await db.videoNote.create({
      data: {
        videoId,
        title,
        content,
        timestamp,
        fontSize: fontSize || 16,
        userId: 'default-user', // For demo purposes
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error('Add note error:', error);
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
  }
}