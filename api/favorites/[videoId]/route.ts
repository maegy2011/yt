import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params
  try {
    // First check if the favorite exists
    const existing = await db.favoriteVideo.findUnique({
      where: { videoId }
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 })
    }
    
    await db.favoriteVideo.delete({
      where: { videoId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete favorite' }, { status: 500 })
  }
}