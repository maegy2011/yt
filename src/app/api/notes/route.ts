import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const notes = await db.videoNote.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(notes)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoId, title, channelName, thumbnail, note, fontSize } = body

    const videoNote = await db.videoNote.create({
      data: {
        videoId,
        title,
        channelName,
        thumbnail,
        note,
        fontSize: fontSize || 16
      }
    })

    return NextResponse.json(videoNote)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 })
  }
}