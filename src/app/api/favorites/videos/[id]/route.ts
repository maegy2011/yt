import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id;
    await db.favoriteVideo.delete({
      where: { id: videoId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete favorite video error:', error);
    return NextResponse.json({ error: 'Failed to delete favorite video' }, { status: 500 });
  }
}