import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { playlistId: string } }
) {
  try {
    const { playlistId } = params

    if (!playlistId) {
      return NextResponse.json(
        { error: 'Playlist ID is required' },
        { status: 400 }
      )
    }

    // Delete the favorite playlist
    await db.favoritePlaylist.delete({
      where: { playlistId }
    })

    return NextResponse.json(
      { message: 'Playlist removed from favorites' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error removing favorite playlist:', error)
    return NextResponse.json(
      { error: 'Failed to remove favorite playlist' },
      { status: 500 }
    )
  }
}