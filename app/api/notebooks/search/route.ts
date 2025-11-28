import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const category = searchParams.get('category')
    const sortBy = searchParams.get('sortBy') || 'updatedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // Build search conditions
    const searchConditions: any = {
      OR: [
        { title: { contains: query } },
        { description: { contains: query } },
        { tags: { contains: query } }
      ]
    }

    if (category && category !== 'all') {
      searchConditions.category = category
    }

    // Get notebooks matching search criteria
    const notebooks = await db.notebook.findMany({
      where: searchConditions,
      include: {
        notes: {
          select: {
            id: true,
            title: true,
            note: true,
            createdAt: true
          }
        },
        pdfs: {
          select: {
            id: true,
            originalName: true,
            uploadedAt: true
          }
        },
        _count: {
          select: {
            notes: true,
            pdfs: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: offset,
      take: limit
    })

    // Also search within notes content
    const notesWithNotebooks = await db.videoNote.findMany({
      where: {
        note: { contains: query }
      },
      include: {
        notebook: {
          select: {
            id: true,
            title: true,
            category: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 20 // Limit note results
    })

    // Get total count for pagination
    const totalCount = await db.notebook.count({
      where: searchConditions
    })

    // Get all available categories
    const categories = await db.notebook.groupBy({
      by: ['category'],
      _count: {
        category: true
      }
    })

    return NextResponse.json({
      notebooks,
      notes: notesWithNotebooks,
      categories: categories.map(c => c.category),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    // 'Error searching notebooks:', error)
    return NextResponse.json(
      { error: 'Failed to search notebooks' },
      { status: 500 }
    )
  }
}