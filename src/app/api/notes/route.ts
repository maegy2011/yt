import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

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
    // Console statement removed
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
        id: uuidv4(),
        videoId: String(videoId),
        title: String(title),
        channelName: String(channelName),
        thumbnail: String(thumbnail || ''),
        note: String(note),
        fontSize: Number(fontSize) || 16,
        startTime: Number(startTime) || null,
        endTime: Number(endTime) || null,
        isClip: Boolean(isClip),
        notebookId: notebookId ? String(notebookId) : null,
        updatedAt: new Date()
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
    // Console statement removed
    return NextResponse.json({ 
      error: 'Failed to add note', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}