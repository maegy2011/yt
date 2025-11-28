import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Pattern management API endpoints
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      console.error('Database connection not available')
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const where = activeOnly ? { isActive: true } : {}
    
    const patterns = await db.blacklistPattern.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ patterns })
  } catch (error) {
    console.error('Failed to fetch patterns:', error)
    return NextResponse.json({ error: 'Failed to fetch patterns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pattern, type, patternType = 'keyword', priority = 0, isActive = true } = body

    if (!pattern || !type) {
      return NextResponse.json({ 
        error: 'Pattern and type are required' 
      }, { status: 400 })
    }

    // Validate pattern type
    if (!['keyword', 'regex', 'wildcard'].includes(patternType)) {
      return NextResponse.json({ 
        error: 'Invalid pattern type. Must be keyword, regex, or wildcard' 
      }, { status: 400 })
    }

    // Validate type
    if (!['title', 'channel', 'description', 'tags'].includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid type. Must be title, channel, description, or tags' 
      }, { status: 400 })
    }

    // Test regex pattern if provided
    if (patternType === 'regex') {
      try {
        new RegExp(pattern, 'i')
      } catch (error) {
        return NextResponse.json({ 
          error: 'Invalid regex pattern' 
        }, { status: 400 })
      }
    }

    const newPattern = await db.blacklistPattern.create({
      data: {
        pattern: pattern.trim(),
        type,
        patternType,
        priority,
        isActive,
        matchCount: 0
      }
    })

    return NextResponse.json(newPattern)
  } catch (error) {
    console.error('Failed to create pattern:', error)
    return NextResponse.json({ error: 'Failed to create pattern' }, { status: 500 })
  }
}