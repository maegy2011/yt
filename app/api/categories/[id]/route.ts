import { NextRequest, NextResponse } from 'next/server'

/**
 * Individual Category Operations API
 * 
 * Handles operations on specific categories:
 * - GET: Get a single category
 * - PATCH: Update a category
 * - DELETE: Delete a category
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const db = await import('@/lib/db').then(m => m.db)
    
    const category = await db.blacklistCategory.findUnique({
      where: { id },
      include: {
        items: {
          select: { id: true }
        },
        patterns: {
          select: { id: true }
        }
      }
    })

    if (!category) {
      return NextResponse.json({
        error: 'Category not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      category
    })

  } catch (error) {
    console.error('Category GET error:', error)
    
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const db = await import('@/lib/db').then(m => m.db)
    
    // Check if category exists
    const existingCategory = await db.blacklistCategory.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      return NextResponse.json({
        error: 'Category not found'
      }, { status: 404 })
    }

    // Prevent modification of system categories
    if (existingCategory.isSystem) {
      return NextResponse.json({
        error: 'Cannot modify system categories'
      }, { status: 403 })
    }

    // Update category
    const updatedCategory = await db.blacklistCategory.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.color && { color: body.color }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.icon !== undefined && { icon: body.icon }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      category: updatedCategory,
      message: 'Category updated successfully'
    })

  } catch (error) {
    console.error('Category PATCH error:', error)
    
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    const db = await import('@/lib/db').then(m => m.db)
    
    // Check if category exists
    const existingCategory = await db.blacklistCategory.findUnique({
      where: { id },
      include: {
        items: {
          select: { id: true }
        },
        patterns: {
          select: { id: true }
        }
      }
    })

    if (!existingCategory) {
      return NextResponse.json({
        error: 'Category not found'
      }, { status: 404 })
    }

    // Prevent deletion of system categories
    if (existingCategory.isSystem) {
      return NextResponse.json({
        error: 'Cannot delete system categories'
      }, { status: 403 })
    }

    // Check if category has dependencies
    const hasItems = existingCategory.items && existingCategory.items.length > 0
    const hasPatterns = existingCategory.patterns && existingCategory.patterns.length > 0

    if ((hasItems || hasPatterns) && !force) {
      return NextResponse.json({
        error: 'Category has dependencies and cannot be deleted',
        details: {
          hasItems,
          hasPatterns,
          itemCount: hasItems ? existingCategory.items.length : 0,
          patternCount: hasPatterns ? existingCategory.patterns.length : 0
        },
        message: 'Use force=true to override'
      }, { status: 409 })
    }

    // Move items to uncategorized if forced deletion
    if (force && hasItems) {
      await db.blacklistedItem.updateMany({
        where: { categoryId: id },
        data: { categoryId: null }
      })

      await db.blacklistPattern.updateMany({
        where: { categoryId: id },
        data: { categoryId: null }
      })
    }

    // Delete the category
    await db.blacklistCategory.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    })

  } catch (error) {
    console.error('Category DELETE error:', error)
    
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}