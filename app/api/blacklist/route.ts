import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Check if database is available
    if (!db) {
      console.error('Database connection not available')
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
    }

    console.log('Database available, fetching blacklist items...')
    const blacklistedItems = await db.blacklistedItem.findMany({
      orderBy: { addedAt: 'desc' }
    })
    
    console.log('Found blacklist items:', blacklistedItems.length)
    return NextResponse.json(blacklistedItems)
  } catch (error) {
    console.error('Failed to fetch blacklist:', error)
    return NextResponse.json({ error: 'Failed to fetch blacklist' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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
        channelName: channelName?.trim() || null
      }
    })

    return NextResponse.json(blacklistedItem)
  } catch (error) {
    console.error('Failed to add to blacklist:', error)
    return NextResponse.json({ error: 'Failed to add to blacklist' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 })
    }

    await db.blacklistedItem.delete({
      where: { itemId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove from blacklist:', error)
    return NextResponse.json({ error: 'Failed to remove from blacklist' }, { status: 500 })
  }
}