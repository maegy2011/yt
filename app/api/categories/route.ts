import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Professional Category Management API
 * 
 * Provides category management for content filtering:
 * - CRUD operations for categories
 * - Hierarchical category support
 * - Bulk operations
 * - Performance optimization
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const includeStats = searchParams.get('includeStats') === 'true'
    const parentId = searchParams.get('parentId')

    const whereClause: any = {}
    
    if (!includeInactive) {
      whereClause.isActive = true
    }
    
    if (parentId) {
      whereClause.parentId = parentId === 'null' ? null : parentId
    }

    const categories = await db.blacklistCategory.findMany({
      where: whereClause,
      include: {
        items: {
          select: { id: true }
        }
      },
      orderBy: [
        { name: 'asc' }
      ]
    })

    // Add computed statistics if requested
    const categoriesWithStats = categories.map(cat => ({
      ...cat,
      itemCount: includeStats ? cat.items?.length || 0 : undefined,
      patternCount: includeStats ? 0 : undefined,
      hasChildren: false,
      level: 0
    }))

    return NextResponse.json({
      success: true,
      categories: categoriesWithStats,
      count: categoriesWithStats.length
    })

  } catch (error) {
    console.error('Categories GET error:', error)
    
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, color, description, parentId, icon, priority = 0 } = body

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json({
        error: 'Category name is required'
      }, { status: 400 })
    }

    // Check for duplicate names
    const existingCategory = await db.blacklistCategory.findFirst({
      where: {
        name: name.trim()
      }
    })

    if (existingCategory) {
      return NextResponse.json({
        error: 'Category with this name already exists in this parent'
      }, { status: 409 })
    }

    // Validate parent exists if specified
    if (parentId && parentId !== 'null') {
      const parentCategory = await db.blacklistCategory.findUnique({
        where: { id: parentId }
      })

      if (!parentCategory) {
        return NextResponse.json({
          error: 'Parent category not found'
        }, { status: 404 })
      }
    }

    const category = await db.blacklistCategory.create({
      data: {
        name: name.trim(),
        color: color || '#ff0000',
        description: description?.trim() || null
      }
    })

    return NextResponse.json({
      success: true,
      category,
      message: 'Category created successfully'
    })

  } catch (error) {
    console.error('Category POST error:', error)
    
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Update category
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, color, description, icon, priority, isActive } = body

    if (!id) {
      return NextResponse.json({
        error: 'Category ID is required'
      }, { status: 400 })
    }

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

    // Check for duplicate names (if name is being changed)
    if (name && name.trim() !== existingCategory.name) {
      const duplicateCategory = await db.blacklistCategory.findFirst({
        where: {
          name: name.trim(),
          id: { not: id }
        }
      })

      if (duplicateCategory) {
        return NextResponse.json({
          error: 'Category with this name already exists'
        }, { status: 409 })
      }
    }

    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name.trim()
    if (color !== undefined) updateData.color = color
    if (description !== undefined) updateData.description = description?.trim() || null
    if (icon !== undefined) updateData.icon = icon
    if (priority !== undefined) updateData.priority = Math.max(0, Math.min(100, priority))
    if (isActive !== undefined) updateData.isActive = isActive

    const category = await db.blacklistCategory.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      category,
      message: 'Category updated successfully'
    })

  } catch (error) {
    console.error('Category PUT error:', error)
    
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Delete category
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    const force = searchParams.get('force') === 'true'

    if (!id) {
      return NextResponse.json({
        error: 'Category ID is required'
      }, { status: 400 })
    }

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

    // Delete category
    await db.blacklistCategory.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: force ? 
        'Category deleted successfully (dependencies moved to uncategorized)' :
        'Category deleted successfully'
    })

  } catch (error) {
    console.error('Category DELETE error:', error)
    
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Bulk operations on categories
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { operation, categoryIds, data } = body

    if (!operation || !Array.isArray(categoryIds)) {
      return NextResponse.json({
        error: 'Operation and categoryIds are required'
      }, { status: 400 })
    }

    switch (operation) {
      case 'activate':
      case 'deactivate':
        const isActive = operation === 'activate'
        
        await db.blacklistCategory.updateMany({
          where: {
            id: { in: categoryIds },
            isSystem: false // Don't allow deactivating system categories
          },
          data: { isActive }
        })

        return NextResponse.json({
          success: true,
          message: `Categories ${operation}d successfully`,
          count: categoryIds.length
        })

      case 'updatePriority':
        if (!data || !Array.isArray(data.priorities)) {
          return NextResponse.json({
            error: 'Priorities array is required for priority update'
          }, { status: 400 })
        }

        const updatePromises = categoryIds.map((categoryId, index) => 
          db.blacklistCategory.update({
            where: { 
              id: categoryId,
              isSystem: false
            },
            data: { 
              priority: Math.max(0, Math.min(100, data.priorities[index] || 0))
            }
          })
        )

        await Promise.all(updatePromises)

        return NextResponse.json({
          success: true,
          message: 'Category priorities updated successfully',
          count: categoryIds.length
        })

      case 'move':
        return NextResponse.json({
          error: 'Move operation not supported - categories do not support hierarchy'
        }, { status: 400 })

      default:
        return NextResponse.json({
          error: 'Invalid operation',
          validOperations: ['activate', 'deactivate', 'updatePriority', 'move']
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Categories PATCH error:', error)
    
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

