import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Check if database is available
    if (!db) {
      console.error('Database connection not available')
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
    }

    console.log('Database available, fetching whitelist items...')
    const whitelistedItems = await db.whitelistedItem.findMany({
      orderBy: { addedAt: 'desc' }
    })
    
    console.log('Found whitelist items:', whitelistedItems.length)
    return NextResponse.json(whitelistedItems)
  } catch (error) {
    console.error('Failed to fetch whitelist:', error)
    return NextResponse.json({ error: 'Failed to fetch whitelist' }, { status: 500 })
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
    const existing = await db.whitelistedItem.findUnique({
      where: { itemId }
    })

    if (existing) {
      return NextResponse.json({ error: 'Item already whitelisted' }, { status: 409 })
    }

    const whitelistedItem = await db.whitelistedItem.create({
      data: {
        itemId,
        title: title.trim(),
        type,
        thumbnail: thumbnail?.trim() || null,
        channelName: channelName?.trim() || null
      }
    })

    return NextResponse.json(whitelistedItem)
  } catch (error) {
    console.error('Failed to add to whitelist:', error)
    return NextResponse.json({ error: 'Failed to add to whitelist' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 })
    }

    await db.whitelistedItem.delete({
      where: { itemId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove from whitelist:', error)
    return NextResponse.json({ error: 'Failed to remove from whitelist' }, { status: 500 })
  }
}