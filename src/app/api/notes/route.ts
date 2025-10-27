import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const notes = await db.videoNote.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    // Sanitize data to prevent JSON serialization issues
    const sanitizedNotes = notes.map(note => ({
      ...note,
      title: note.title || '',
      channelName: note.channelName || '',
      thumbnail: note.thumbnail || '',
      note: note.note || '',
      fontSize: note.fontSize || 16
    }))
    
    return NextResponse.json(sanitizedNotes)
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoId, title, channelName, thumbnail, note, fontSize } = body

    if (!videoId || !title || !channelName || !note) {
      return NextResponse.json({ error: 'Missing required fields: videoId, title, channelName, note' }, { status: 400 })
    }

    // Sanitize input data, especially the note field
    const sanitizedData = {
      videoId: String(videoId).trim(),
      title: String(title).trim(),
      channelName: String(channelName).trim(),
      thumbnail: thumbnail ? String(thumbnail).trim() : '',
      note: String(note).trim(),
      fontSize: fontSize ? Number(fontSize) : 16
    }

    const videoNote = await db.videoNote.create({
      data: sanitizedData
    })

    return NextResponse.json(videoNote)
  } catch (error) {
    console.error('Error adding note:', error)
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 })
  }
}