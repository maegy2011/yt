import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const createNotebookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().optional(),
  color: z.string().optional(),
  isPublic: z.boolean().optional(),
  tags: z.string().optional(),
})

const updateNotebookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long').optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  isPublic: z.boolean().optional(),
  tags: z.string().optional(),
})

// GET /api/notebooks - Fetch all notebooks
export async function GET(request: NextRequest) {
  try {
    const notebooks = await db.notebook.findMany({
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        _count: {
          select: {
            notes: true
          }
        }
      }
    })

    const formattedNotebooks = notebooks.map(notebook => ({
      ...notebook,
      noteCount: notebook._count.notes,
      createdAt: notebook.createdAt.toISOString(),
      updatedAt: notebook.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      notebooks: formattedNotebooks
    })
  } catch (error) {
    console.error('Error fetching notebooks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notebooks' },
      { status: 500 }
    )
  }
}

// POST /api/notebooks - Create a new notebook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createNotebookSchema.parse(body)

    const notebook = await db.notebook.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        color: validatedData.color || '#3b82f6',
        isPublic: validatedData.isPublic || false,
        tags: validatedData.tags || '',
      }
    })

    const formattedNotebook = {
      ...notebook,
      noteCount: 0,
      createdAt: notebook.createdAt.toISOString(),
      updatedAt: notebook.updatedAt.toISOString(),
    }

    return NextResponse.json({
      success: true,
      notebook: formattedNotebook
    })
  } catch (error) {
    console.error('Error creating notebook:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create notebook' },
      { status: 500 }
    )
  }
}