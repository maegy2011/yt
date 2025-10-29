import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    await db.favoriteChannel.delete({
      where: { channelId: params.channelId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 })
  }
}