import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const batchDeleteNotesSchema = z.object({
  noteIds: z.array(z.string()).min(1, 'At least one note ID is required'),
})

// DELETE /api/notes/batch/delete - Batch delete notes with protection
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { noteIds } = batchDeleteNotesSchema.parse(body)

    // Check which notes exist and get their notebook relationships
    const notes = await db.videoNote.findMany({
      where: { id: { in: noteIds } },
      include: {
        noteLinks: {
          include: {
            notebook: true
          }
        }
      }
    })

    if (notes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No notes found' },
        { status: 404 }
      )
    }

    // Check for notes that are linked to multiple notebooks
    const protectedNotes = notes.filter(note => {
      const linkCount = note.noteLinks.length + (note.notebookId ? 1 : 0)
      return linkCount > 1
    })

    if (protectedNotes.length > 0) {
      const protectedNoteInfo = protectedNotes.map(note => ({
        id: note.id,
        title: note.title,
        notebookCount: note.noteLinks.length + (note.notebookId ? 1 : 0)
      }))

      return NextResponse.json({
        success: false,
        error: 'Cannot delete notes that are linked to multiple notebooks',
        message: 'Please unlink these notes from all but one notebook before deleting',
        protectedNotes: protectedNoteInfo
      }, { status: 409 })
    }

    // Delete the notes (they are safe to delete)
    const deletedNotes = await db.videoNote.deleteMany({
      where: { id: { in: noteIds } }
    })

    return NextResponse.json({
      success: true,
      message: `${deletedNotes.count} notes deleted successfully`,
      deletedCount: deletedNotes.count
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
      { success: false, error: 'Failed to batch delete notes' },
      { status: 500 }
    )
  }
}