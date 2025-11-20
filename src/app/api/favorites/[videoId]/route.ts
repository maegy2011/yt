import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    // First check if the favorite exists
    const existing = await db.favoriteVideo.findUnique({
      where: { videoId: params.videoId }
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 })
    }
    
    await db.favoriteVideo.delete({
      where: { videoId: params.videoId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete favorite error:', error)
    return NextResponse.json({ error: 'Failed to delete favorite' }, { status: 500 })
  }
}