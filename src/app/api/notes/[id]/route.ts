import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeString, validateNumericInput } from '@/lib/validation'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { note, title, fontSize } = body

    // Validate required fields
    if (!note || typeof note !== 'string') {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 })
    }

    // Validate and sanitize inputs
    const sanitizedNote = sanitizeString(note, 1000)
    const sanitizedTitle = title ? sanitizeString(title, 200) : undefined
    
    // Validate font size
    let fontSizeValue = 16
    if (fontSize !== undefined) {
      const fontSizeValidation = validateNumericInput(fontSize, 'Font size')
      if (!fontSizeValidation.isValid || (fontSizeValidation.sanitized && (fontSizeValidation.sanitized < 8 || fontSizeValidation.sanitized > 72))) {
        return NextResponse.json({ error: 'Font size must be between 8 and 72' }, { status: 400 })
      }
      fontSizeValue = fontSizeValidation.sanitized ? Math.floor(fontSizeValidation.sanitized) : 16
    }

    // Check if note exists
    const existingNote = await db.videoNote.findUnique({
      where: { id }
    })

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    const updatedNote = await db.videoNote.update({
      where: { id },
      data: {
        note: sanitizedNote,
        title: sanitizedTitle || existingNote.title,
        fontSize: fontSizeValue
      }
    })

    return NextResponse.json(updatedNote)
  } catch (error) {
    console.error('Update note error:', error)
    return NextResponse.json({ 
      error: 'Failed to update note',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if note exists before deleting
    const existingNote = await db.videoNote.findUnique({
      where: { id }
    })

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    await db.videoNote.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete note error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete note',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}