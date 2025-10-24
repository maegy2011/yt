import { NextRequest, NextResponse } from 'next/server';
import { getVideoDetails } from '@/lib/youtube';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id;
    const video = await getVideoDetails(videoId);
    return NextResponse.json(video);
  } catch (error) {
    console.error('Get video API error:', error);
    return NextResponse.json({ error: 'Failed to get video details' }, { status: 500 });
  }
}