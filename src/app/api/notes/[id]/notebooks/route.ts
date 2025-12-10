import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const linkNoteToNotebookSchema = z.object({
  notebookId: z.string().min(1, 'Notebook ID is required'),
})

// GET /api/notes/[id]/notebooks - Get all notebooks a note is linked to
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if note exists
    const note = await db.videoNote.findUnique({
      where: { id }
    })

    if (!note) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      )
    }

    // Get all notebooks this note is linked to via NoteLink
    const noteLinks = await db.noteLink.findMany({
      where: { noteId: id },
      include: {
        notebook: true
      }
    })

    const notebooks: any[] = noteLinks.map(link => link.notebook).filter(Boolean)

    // Also check if note has a legacy notebookId
    if (note.notebookId) {
      const foundNotebook = await db.notebook.findUnique({
        where: { id: note.notebookId }
      })
      if (foundNotebook) {
        notebooks.push(foundNotebook)
      }
    }

    return NextResponse.json({
      success: true,
      notebooks: notebooks.map(notebook => ({
        ...notebook,
        createdAt: notebook.createdAt.toISOString(),
        updatedAt: notebook.updatedAt.toISOString(),
      }))
    })
  } catch (error) {
    // Console statement removed
    return NextResponse.json(
      { success: false, error: 'Failed to fetch note notebooks' },
      { status: 500 }
    )
  }
}

// POST /api/notes/[id]/notebooks - Link a note to a notebook
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { notebookId } = linkNoteToNotebookSchema.parse(body)

    // Check if note exists
    const note = await db.videoNote.findUnique({
      where: { id }
    })

    if (!note) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      )
    }

    // Check if notebook exists
    const notebook = await db.notebook.findUnique({
      where: { id: notebookId }
    })

    if (!notebook) {
      return NextResponse.json(
        { success: false, error: 'Notebook not found' },
        { status: 404 }
      )
    }

    // Check if already linked
    const existingLink = await db.noteLink.findUnique({
      where: {
        noteId_notebookId: {
          noteId: id,
          notebookId: notebookId
        }
      }
    })

    if (existingLink) {
      return NextResponse.json(
        { success: false, error: 'Note is already linked to this notebook' },
        { status: 409 }
      )
    }

    // Create the link
    const noteLink = await db.noteLink.create({
      data: {
        noteId: id,
        notebookId: notebookId
      },
      include: {
        notebook: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Note linked to notebook successfully',
      link: {
        ...noteLink,
        createdAt: noteLink.createdAt.toISOString(),
      }
    })
  } catch (error) {
    // Console statement removed
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to link note to notebook' },
      { status: 500 }
    )
  }
}