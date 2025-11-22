import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// DELETE /api/notes/[id]/notebook - Remove a note from its notebook
export async function DELETE(
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

    // Remove the note from its notebook by setting notebookId to null
    const updatedNote = await db.videoNote.update({
      where: { id },
      data: { notebookId: null }
    })

    return NextResponse.json({
      success: true,
      message: 'Note removed from notebook successfully',
      note: updatedNote
    })
  } catch (error) {
    console.error('Error removing note from notebook:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove note from notebook' },
      { status: 500 }
    )
  }
}