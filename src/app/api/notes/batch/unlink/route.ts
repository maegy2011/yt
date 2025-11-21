import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const batchUnlinkNotesSchema = z.object({
  noteIds: z.array(z.string()).min(1, 'At least one note ID is required'),
  notebookId: z.string().min(1, 'Notebook ID is required'),
})

// DELETE /api/notes/batch/unlink - Batch unlink notes from a notebook
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { noteIds, notebookId } = batchUnlinkNotesSchema.parse(body)

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

    // Delete NoteLink entries
    const deletedLinks = await db.noteLink.deleteMany({
      where: {
        noteId: { in: noteIds },
        notebookId: notebookId
      }
    })

    // Also handle legacy notebookId relationships
    const legacyUpdates = await db.videoNote.updateMany({
      where: {
        id: { in: noteIds },
        notebookId: notebookId
      },
      data: { notebookId: null }
    })

    const totalUnlinked = deletedLinks.count + legacyUpdates.count

    return NextResponse.json({
      success: true,
      message: `${totalUnlinked} notes unlinked from notebook successfully`,
      unlinkedCount: totalUnlinked
    })
  } catch (error) {
    console.error('Error batch unlinking notes:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to batch unlink notes' },
      { status: 500 }
    )
  }
}