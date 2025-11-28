import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const unlinkNoteFromNotebookSchema = z.object({
  notebookId: z.string().min(1, 'Notebook ID is required'),
})

// DELETE /api/notes/[id]/notebooks/[notebookId] - Unlink a note from a specific notebook
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; notebookId: string }> }
) {
  try {
    const { id, notebookId } = await params

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

    // Check if the link exists
    const existingLink = await db.noteLink.findUnique({
      where: {
        noteId_notebookId: {
          noteId: id,
          notebookId: notebookId
        }
      }
    })

    if (!existingLink) {
      // Check if it's a legacy notebookId relationship
      if (note.notebookId === notebookId) {
        // Remove the legacy relationship
        await db.videoNote.update({
          where: { id },
          data: { notebookId: null }
        })

        return NextResponse.json({
          success: true,
          message: 'Note unlinked from notebook successfully'
        })
      }

      return NextResponse.json(
        { success: false, error: 'Note is not linked to this notebook' },
        { status: 404 }
      )
    }

    // Delete the link
    await db.noteLink.delete({
      where: {
        noteId_notebookId: {
          noteId: id,
          notebookId: notebookId
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Note unlinked from notebook successfully'
    })
  } catch (error) {
    // Console statement removed
    return NextResponse.json(
      { success: false, error: 'Failed to unlink note from notebook' },
      { status: 500 }
    )
  }
}