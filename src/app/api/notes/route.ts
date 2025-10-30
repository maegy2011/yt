import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')
    
    let notes
    if (videoId) {
      // Get notes for specific video
      notes = await db.videoNote.findMany({
        where: { videoId },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      // Get all notes
      notes = await db.videoNote.findMany({
        orderBy: { createdAt: 'desc' }
      })
    }
    
    return NextResponse.json(notes)
  } catch (error) {
    console.error('Failed to fetch notes:', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoId, title, channelName, thumbnail, note, fontSize, startTime, endTime, isClip } = body

    // Validate required fields
    if (!videoId || !title || !channelName || !note) {
      return NextResponse.json({ 
        error: 'Missing required fields: videoId, title, channelName, note',
        received: { videoId, title, channelName, note }
      }, { status: 400 })
    }

    const videoNote = await db.videoNote.create({
      data: {
        videoId,
        title,
        channelName,
        thumbnail,
        note,
        fontSize: fontSize ? parseInt(fontSize) : 16,
        startTime: startTime !== undefined ? parseInt(startTime) : null,
        endTime: endTime !== undefined ? parseInt(endTime) : null,
        isClip: isClip || false
      }
    })

    return NextResponse.json(videoNote)
  } catch (error) {
    console.error('Failed to add note:', error)
    return NextResponse.json({ 
      error: 'Failed to add note', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}