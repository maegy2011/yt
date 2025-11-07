import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeString, validateTimeInput, validateNumericInput, validateRequestBody } from '@/lib/validation'

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
    
    // Validate request body structure
    const bodyValidation = validateRequestBody(body, ['videoId', 'title', 'channelName', 'note'])
    if (!bodyValidation.isValid) {
      return NextResponse.json({ error: bodyValidation.error }, { status: 400 })
    }

    const { videoId, title, channelName, thumbnail, note, fontSize, startTime, endTime, isClip } = body

    // Validate and sanitize inputs
    const sanitizedVideoId = sanitizeString(videoId, 50)
    const sanitizedTitle = sanitizeString(title, 200)
    const sanitizedChannelName = sanitizeString(channelName, 100)
    const sanitizedThumbnail = sanitizeString(thumbnail, 500)
    const sanitizedNote = sanitizeString(note, 1000)
    
    // Validate required fields
    if (!sanitizedVideoId || !sanitizedTitle || !sanitizedChannelName || !sanitizedNote) {
      return NextResponse.json({ error: 'Missing required fields: videoId, title, channelName, note' }, { status: 400 })
    }

    // Validate time inputs (only if provided)
    let startTimeValidation = { isValid: true, sanitized: null }
    let endTimeValidation = { isValid: true, sanitized: null }
    
    if (startTime !== null && startTime !== undefined) {
      startTimeValidation = validateTimeInput(startTime, 'Start time')
    }
    
    if (endTime !== null && endTime !== undefined) {
      endTimeValidation = validateTimeInput(endTime, 'End time')
    }
    
    if (!startTimeValidation.isValid || !endTimeValidation.isValid) {
      return NextResponse.json({ 
        error: startTimeValidation.error || endTimeValidation.error 
      }, { status: 400 })
    }
    
    // Validate font size
    const fontSizeValidation = validateNumericInput(fontSize, 'Font size')
    if (!fontSizeValidation.isValid || (fontSizeValidation.sanitized && (fontSizeValidation.sanitized < 8 || fontSizeValidation.sanitized > 72))) {
      return NextResponse.json({ error: 'Font size must be between 8 and 72' }, { status: 400 })
    }

    // Validate time range
    if (startTimeValidation.sanitized && endTimeValidation.sanitized && startTimeValidation.sanitized >= endTimeValidation.sanitized) {
      return NextResponse.json({ error: 'End time must be greater than start time' }, { status: 400 })
    }

    const videoNote = await db.videoNote.create({
      data: {
        videoId: sanitizedVideoId,
        title: sanitizedTitle,
        channelName: sanitizedChannelName,
        thumbnail: sanitizedThumbnail,
        note: sanitizedNote,
        fontSize: fontSizeValidation.sanitized ? Math.floor(fontSizeValidation.sanitized) : 16,
        startTime: startTimeValidation.sanitized,
        endTime: endTimeValidation.sanitized,
        isClip: Boolean(isClip)
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