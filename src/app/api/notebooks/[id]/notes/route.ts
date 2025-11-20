import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const addNoteToNotebookSchema = z.object({
  noteId: z.string().min(1, 'Note ID is required'),
})

// POST /api/notebooks/[id]/notes - Add a note to a notebook
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { noteId } = addNoteToNotebookSchema.parse(body)

    // Check if notebook exists
    const notebook = await db.notebook.findUnique({
      where: { id }
    })

    if (!notebook) {
      return NextResponse.json(
        { success: false, error: 'Notebook not found' },
        { status: 404 }
      )
    }

    // Check if note exists
    const note = await db.videoNote.findUnique({
      where: { id: noteId }
    })

    if (!note) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      )
    }

    // Update the note to add it to the notebook
    const updatedNote = await db.videoNote.update({
      where: { id: noteId },
      data: { notebookId: id }
    })

    return NextResponse.json({
      success: true,
      message: 'Note added to notebook successfully',
      note: updatedNote
    })
  } catch (error) {
    console.error('Error adding note to notebook:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to add note to notebook' },
      { status: 500 }
    )
  }
}

// GET /api/notebooks/[id]/notes - Get all notes in a notebook
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Check if notebook exists
    const notebook = await db.notebook.findUnique({
      where: { id }
    })

    if (!notebook) {
      return NextResponse.json(
        { success: false, error: 'Notebook not found' },
        { status: 404 }
      )
    }

    // Get all notes in this notebook
    const notes = await db.videoNote.findMany({
      where: { notebookId: id },
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    const formattedNotes = notes.map(note => ({
      ...note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      notes: formattedNotes
    })
  } catch (error) {
    console.error('Error fetching notebook notes:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notebook notes' },
      { status: 500 }
    )
  }
}