import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const batchLinkNotesSchema = z.object({
  noteIds: z.array(z.string()).min(1, 'At least one note ID is required'),
  notebookId: z.string().min(1, 'Notebook ID is required'),
})

// POST /api/notes/batch/link - Batch link notes to a notebook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { noteIds, notebookId } = batchLinkNotesSchema.parse(body)

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

    // Check if notes exist and get existing links
    const notes = await db.videoNote.findMany({
      where: { id: { in: noteIds } }
    })

    if (notes.length !== noteIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more notes not found' },
        { status: 404 }
      )
    }

    // Get existing links to avoid duplicates
    const existingLinks = await db.noteLink.findMany({
      where: {
        noteId: { in: noteIds },
        notebookId: notebookId
      }
    })

    const existingNoteIds = new Set(existingLinks.map(link => link.noteId))
    const notesToLink = noteIds.filter(id => !existingNoteIds.has(id))

    if (notesToLink.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All notes are already linked to this notebook',
        linkedCount: 0
      })
    }

    // Create the links
    const newLinks = await db.noteLink.createMany({
      data: notesToLink.map(noteId => ({
        noteId,
        notebookId
      }))
    })

    return NextResponse.json({
      success: true,
      message: `${newLinks.count} notes linked to notebook successfully`,
      linkedCount: newLinks.count
    })
  } catch (error) {
    console.error('Error batch linking notes:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to batch link notes' },
      { status: 500 }
    )
  }
}