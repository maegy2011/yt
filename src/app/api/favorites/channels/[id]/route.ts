import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const channelId = params.id;
    await db.favoriteChannel.delete({
      where: { id: channelId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete favorite channel error:', error);
    return NextResponse.json({ error: 'Failed to delete favorite channel' }, { status: 500 });
  }
}