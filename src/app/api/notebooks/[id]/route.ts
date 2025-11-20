import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const updateNotebookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long').optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  isPublic: z.boolean().optional(),
  tags: z.string().optional(),
})

// GET /api/notebooks/[id] - Fetch a single notebook
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const notebook = await db.notebook.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            notes: true
          }
        }
      }
    })

    if (!notebook) {
      return NextResponse.json(
        { success: false, error: 'Notebook not found' },
        { status: 404 }
      )
    }

    const formattedNotebook = {
      ...notebook,
      noteCount: notebook._count.notes,
      createdAt: notebook.createdAt.toISOString(),
      updatedAt: notebook.updatedAt.toISOString(),
    }

    return NextResponse.json({
      success: true,
      notebook: formattedNotebook
    })
  } catch (error) {
    console.error('Error fetching notebook:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notebook' },
      { status: 500 }
    )
  }
}

// PUT /api/notebooks/[id] - Update a notebook
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateNotebookSchema.parse(body)

    // Check if notebook exists
    const existingNotebook = await db.notebook.findUnique({
      where: { id }
    })

    if (!existingNotebook) {
      return NextResponse.json(
        { success: false, error: 'Notebook not found' },
        { status: 404 }
      )
    }

    const notebook = await db.notebook.update({
      where: { id },
      data: validatedData
    })

    const formattedNotebook = {
      ...notebook,
      noteCount: 0, // We'll count notes separately if needed
      createdAt: notebook.createdAt.toISOString(),
      updatedAt: notebook.updatedAt.toISOString(),
    }

    return NextResponse.json({
      success: true,
      notebook: formattedNotebook
    })
  } catch (error) {
    console.error('Error updating notebook:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update notebook' },
      { status: 500 }
    )
  }
}

// DELETE /api/notebooks/[id] - Delete a notebook
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Check if notebook exists
    const existingNotebook = await db.notebook.findUnique({
      where: { id }
    })

    if (!existingNotebook) {
      return NextResponse.json(
        { success: false, error: 'Notebook not found' },
        { status: 404 }
      )
    }

    // First, remove notebookId from all notes in this notebook
    await db.videoNote.updateMany({
      where: { notebookId: id },
      data: { notebookId: null }
    })

    // Then delete the notebook
    await db.notebook.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Notebook deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting notebook:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete notebook' },
      { status: 500 }
    )
  }
}