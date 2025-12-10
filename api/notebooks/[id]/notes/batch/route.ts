import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const batchAddNotesToNotebookSchema = z.object({
  noteIds: z.array(z.string().min(1, 'Note ID is required')).min(1, 'At least one note ID is required'),
})

// POST /api/notebooks/[id]/notes/batch - Add multiple notes to a notebook
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { noteIds } = batchAddNotesToNotebookSchema.parse(body)

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

    // Check if all notes exist
    const notes = await db.videoNote.findMany({
      where: { id: { in: noteIds } }
    })

    if (notes.length !== noteIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more notes not found' },
        { status: 404 }
      )
    }

    // Update all notes to add them to the notebook
    const updatedNotes = await db.videoNote.updateMany({
      where: { id: { in: noteIds } },
      data: { notebookId: id }
    })

    return NextResponse.json({
      success: true,
      message: `${updatedNotes.count} notes added to notebook successfully`,
      count: updatedNotes.count
    })
  } catch (error) {
    // Error batch adding notes to notebook
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to add notes to notebook' },
      { status: 500 }
    )
  }
}