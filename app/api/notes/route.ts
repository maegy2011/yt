import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const notes = await db.videoNote.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    // Convert Date objects to strings for JSON serialization
    const formattedNotes = notes.map(note => ({
      ...note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString()
    }))
    
    return NextResponse.json(formattedNotes)
  } catch (error) {
    console.error('Failed to fetch notes:', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { videoId, title, channelName, thumbnail, note, fontSize, startTime, endTime, isClip, notebookId } = body

    // Basic validation
    if (!videoId || !title || !channelName || !note) {
      return NextResponse.json({ 
        error: 'Missing required fields: videoId, title, channelName, note' 
      }, { status: 400 })
    }

    const videoNote = await db.videoNote.create({
      data: {
        videoId: String(videoId),
        title: String(title),
        channelName: String(channelName),
        thumbnail: String(thumbnail || ''),
        note: String(note),
        fontSize: Number(fontSize) || 16,
        startTime: Number(startTime) || null,
        endTime: Number(endTime) || null,
        isClip: Boolean(isClip),
        notebookId: notebookId ? String(notebookId) : null
      }
    })

    // Convert Date objects to strings for JSON serialization
    const formattedNote = {
      ...videoNote,
      createdAt: videoNote.createdAt.toISOString(),
      updatedAt: videoNote.updatedAt.toISOString()
    }

    return NextResponse.json(formattedNote)
  } catch (error) {
    console.error('Failed to add note:', error)
    return NextResponse.json({ 
      error: 'Failed to add note', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}