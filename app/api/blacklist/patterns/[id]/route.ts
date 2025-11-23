import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Individual pattern management
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pattern = await db.blacklistPattern.findUnique({
      where: { id: params.id }
    })

    if (!pattern) {
      return NextResponse.json({ error: 'Pattern not found' }, { status: 404 })
    }

    return NextResponse.json(pattern)
  } catch (error) {
    console.error('Failed to fetch pattern:', error)
    return NextResponse.json({ error: 'Failed to fetch pattern' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { pattern, type, patternType, priority, isActive } = body

    const updateData: any = {}
    
    if (pattern !== undefined) updateData.pattern = pattern.trim()
    if (type !== undefined) updateData.type = type
    if (patternType !== undefined) updateData.patternType = patternType
    if (priority !== undefined) updateData.priority = priority
    if (isActive !== undefined) updateData.isActive = isActive

    // Validate pattern type if provided
    if (patternType && !['keyword', 'regex', 'wildcard'].includes(patternType)) {
      return NextResponse.json({ 
        error: 'Invalid pattern type. Must be keyword, regex, or wildcard' 
      }, { status: 400 })
    }

    // Validate type if provided
    if (type && !['title', 'channel', 'description', 'tags'].includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid type. Must be title, channel, description, or tags' 
      }, { status: 400 })
    }

    // Test regex pattern if provided
    if (patternType === 'regex' && pattern) {
      try {
        new RegExp(pattern, 'i')
      } catch (error) {
        return NextResponse.json({ 
          error: 'Invalid regex pattern' 
        }, { status: 400 })
      }
    }

    const updatedPattern = await db.blacklistPattern.update({
      where: { id: params.id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedPattern)
  } catch (error) {
    console.error('Failed to update pattern:', error)
    return NextResponse.json({ error: 'Failed to update pattern' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.blacklistPattern.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete pattern:', error)
    return NextResponse.json({ error: 'Failed to delete pattern' }, { status: 500 })
  }
}