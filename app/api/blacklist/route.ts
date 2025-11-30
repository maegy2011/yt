import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuditLogger } from '@/lib/audit-logger'
import { UndoRedoManager } from '@/lib/undo-redo-manager'

// WebSocket notification function
async function notifyBlacklistUpdate(event: any) {
  try {
    await fetch('http://localhost:3003/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    })
  } catch (error) {
    // WebSocket service might not be available, don't fail the main operation
    console.warn('Failed to notify WebSocket service:', error)
  }
}

// Simple rate limiting using in-memory store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 100 // requests per minute for general operations
const RATE_WINDOW = 60 * 1000 // 1 minute

function checkRateLimit(request: NextRequest): { allowed: boolean; resetTime?: number } {
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  
  const now = Date.now()
  const record = rateLimitStore.get(clientIP)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(clientIP, { count: 1, resetTime: now + RATE_WINDOW })
    return { allowed: true }
  }
  
  if (record.count >= RATE_LIMIT) {
    return { allowed: false, resetTime: record.resetTime }
  }
  
  record.count++
  return { allowed: true }
}

export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimit = checkRateLimit(request)
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: 'Too many requests',
        resetTime: rateLimit.resetTime 
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetTime?.toString() || ''
        }
      })
    }

    // Check if database is available
    if (!db) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'video' | 'playlist' | 'channel'
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const sortBy = searchParams.get('sortBy') || 'addedAt' // 'addedAt' | 'title' | 'type'
    const sortOrder = searchParams.get('sortOrder') || 'desc' // 'asc' | 'desc'
    
    // Build where clause
    const where: any = {}
    if (type && type !== 'all') {
      where.type = type
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { channelName: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Build order clause
    const order: any = {}
    order[sortBy] = sortOrder

    // Get total count for pagination
    const totalCount = await db.blacklistedItem.count({ where })

    // Fetch items with pagination
    const blacklistedItems = await db.blacklistedItem.findMany({
      where,
      orderBy: order,
      skip: (page - 1) * limit,
      take: limit
    })
    
    return NextResponse.json({
      items: blacklistedItems,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      filters: {
        type,
        search,
        sortBy,
        sortOrder
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch blacklist' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimit = checkRateLimit(request)
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: 'Too many requests',
        resetTime: rateLimit.resetTime 
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetTime?.toString() || ''
        }
      })
    }

    const body = await request.json()
    const { itemId, title, type, thumbnail, channelName } = body

    // Validate required fields
    if (!itemId || !title || !type) {
      return NextResponse.json({ error: 'itemId, title, and type are required' }, { status: 400 })
    }

    // Check if already exists
    const existing = await db.blacklistedItem.findUnique({
      where: { itemId }
    })

    if (existing) {
      return NextResponse.json({ error: 'Item already blacklisted' }, { status: 409 })
    }

    const blacklistedItem = await db.blacklistedItem.create({
      data: {
        itemId,
        title: title.trim(),
        type,
        thumbnail: thumbnail?.trim() || null,
        channelName: channelName?.trim() || null,
        isChannelBlock: type === 'channel'
      }
    })

    // Log audit event
    await AuditLogger.logAdd('blacklist', blacklistedItem, {
      userId: request.headers.get('x-user-id') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    })

    // Create operation for undo/redo
    const operationId = await UndoRedoManager.createOperation({
      action: 'add',
      itemType: 'blacklist',
      itemId: blacklistedItem.itemId,
      itemData: blacklistedItem,
      userId: request.headers.get('x-user-id') || undefined
    })

    // Notify WebSocket clients
    await notifyBlacklistUpdate({
      type: 'blacklist',
      action: 'add',
      item: blacklistedItem,
      userId: request.headers.get('x-user-id') || undefined,
      timestamp: new Date().toISOString(),
      operationId
    })

    return NextResponse.json(blacklistedItem)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add to blacklist' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    const batch = searchParams.get('batch') === 'true'

    if (!itemId && !batch) {
      return NextResponse.json({ error: 'itemId or batch=true is required' }, { status: 400 })
    }

    if (batch) {
      // Batch delete - clear all blacklist items
      const body = await request.json().catch(() => ({}))
      const { itemIds, type, confirm } = body

      if (confirm === 'clear-all') {
        // Clear all blacklist items
        const result = await db.blacklistedItem.deleteMany({})
        return NextResponse.json({ 
          success: true, 
          deleted: result.count,
          message: `Cleared ${result.count} items from blacklist`
        })
      }

      if (itemIds && Array.isArray(itemIds)) {
        // Delete specific items by IDs
        const result = await db.blacklistedItem.deleteMany({
          where: {
            itemId: { in: itemIds }
          }
        })
        return NextResponse.json({ 
          success: true, 
          deleted: result.count,
          message: `Deleted ${result.count} items from blacklist`
        })
      }

      if (type) {
        // Delete all items of a specific type
        const result = await db.blacklistedItem.deleteMany({
          where: { type }
        })
        return NextResponse.json({ 
          success: true, 
          deleted: result.count,
          message: `Deleted ${result.count} ${type} items from blacklist`
        })
      }

      return NextResponse.json({ error: 'Invalid batch operation' }, { status: 400 })
    }

    // Single item delete
    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 })
    }
    
    await db.blacklistedItem.delete({
      where: { itemId: itemId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove from blacklist' }, { status: 500 })
  }
}

// New POST endpoint for batch operations
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { operation, items } = body

    if (!operation || !Array.isArray(items)) {
      return NextResponse.json({ error: 'operation and items array are required' }, { status: 400 })
    }

    if (operation === 'bulk-add') {
      // Bulk add items to blacklist
      const results = await Promise.allSettled(
        items.map(async (item: any) => {
          const { itemId, title, type, thumbnail, channelName } = item
          
          if (!itemId || !title || !type) {
            throw new Error('Missing required fields')
          }

          return await db.blacklistedItem.upsert({
            where: { itemId },
            update: {
              title: title.trim(),
              type,
              thumbnail: thumbnail?.trim() || null,
              channelName: channelName?.trim() || null,
              updatedAt: new Date(),
              isChannelBlock: type === 'channel'
            },
            create: {
              itemId,
              title: title.trim(),
              type,
              thumbnail: thumbnail?.trim() || null,
              channelName: channelName?.trim() || null,
              isChannelBlock: type === 'channel'
            }
          })
        })
      )

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      return NextResponse.json({
        success: true,
        added: successful,
        failed,
        message: `Added ${successful} items to blacklist${failed > 0 ? ` (${failed} failed)` : ''}`
      })
    }

    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to perform batch operation' }, { status: 500 })
  }
}

// New endpoint for blacklist statistics
export async function PUT(request: NextRequest) {
  try {
    // Get blacklist statistics
    const stats = await db.blacklistedItem.groupBy({
      by: ['type'],
      _count: {
        id: true
      }
    })

    const totalItems = await db.blacklistedItem.count()
    const recentItems = await db.blacklistedItem.count({
      where: {
        addedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    })

    const typeStats = stats.reduce((acc, stat) => {
      acc[stat.type] = stat._count.id
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      total: totalItems,
      recent: recentItems,
      byType: typeStats,
      types: ['video', 'playlist', 'channel'].map(type => ({
        type,
        count: typeStats[type] || 0
      }))
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get statistics' }, { status: 500 })
  }
}