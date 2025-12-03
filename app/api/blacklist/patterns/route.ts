import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

// Enhanced pattern validation
function validatePattern(pattern: string, patternType: string): { isValid: boolean; error?: string } {
  if (!pattern || pattern.trim().length === 0) {
    return { isValid: false, error: 'Pattern cannot be empty' }
  }

  if (pattern.length > 500) {
    return { isValid: false, error: 'Pattern too long (max 500 characters)' }
  }

  switch (patternType) {
    case 'regex':
      try {
        // Test regex compilation
        const regex = new RegExp(pattern, 'i')
        
        // Check for potentially dangerous regex patterns
        if (pattern.includes('(?=') || pattern.includes('(?!') || pattern.includes('(*')) {
          return { isValid: false, error: 'Complex regex patterns not allowed for security reasons' }
        }
        
        // Check for potential ReDoS attacks
        if (/(\\*|\\+|\{|\})\+/.test(pattern) || /\(\?=.*\)\*/.test(pattern)) {
          return { isValid: false, error: 'Regex pattern may cause performance issues' }
        }
        
        return { isValid: true }
      } catch (error) {
        return { isValid: false, error: `Invalid regex: ${error instanceof Error ? error.message : 'Unknown error'}` }
      }
    
    case 'wildcard':
      // Validate wildcard pattern
      const dangerousChars = /[<>{}[\]\\]/g
      if (dangerousChars.test(pattern)) {
        return { isValid: false, error: 'Wildcard pattern contains invalid characters' }
      }
      return { isValid: true }
    
    case 'keyword':
      // Basic keyword validation
      if (pattern.length < 2) {
        return { isValid: false, error: 'Keyword must be at least 2 characters long' }
      }
      return { isValid: true }
    
    case 'fuzzy':
      // Validate fuzzy pattern
      if (pattern.length < 2) {
        return { isValid: false, error: 'Fuzzy pattern must be at least 2 characters long' }
      }
      return { isValid: true }
    
    case 'semantic':
      // Validate semantic pattern
      if (pattern.length < 2) {
        return { isValid: false, error: 'Semantic pattern must be at least 2 characters long' }
      }
      return { isValid: true }
    
    default:
      return { isValid: false, error: 'Invalid pattern type' }
  }
}

// Simple rate limiting using in-memory store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 30 // requests per minute
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

// Pattern management API endpoints
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

    if (!db) {
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
    return NextResponse.json({ error: 'Failed to fetch patterns' }, { status: 500 })
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
    const { pattern, type, patternType = 'keyword', priority = 0, isActive = true, name, description, severity = 'medium' } = body

    if (!pattern || !type) {
      return NextResponse.json({ 
        error: 'Pattern and type are required' 
      }, { status: 400 })
    }

    // Validate pattern type
    if (!['keyword', 'regex', 'wildcard', 'fuzzy', 'semantic'].includes(patternType)) {
      return NextResponse.json({ 
        error: 'Invalid pattern type. Must be keyword, regex, wildcard, fuzzy, or semantic' 
      }, { status: 400 })
    }

    // Validate type
    if (!['title', 'channel', 'description', 'tags'].includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid type. Must be title, channel, description, or tags' 
      }, { status: 400 })
    }

    // Enhanced pattern validation
    const validation = validatePattern(pattern, patternType)
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: validation.error || 'Invalid pattern' 
      }, { status: 400 })
    }

    const newPattern = await db.blacklistPattern.create({
      data: {
        id: randomUUID(),
        pattern: pattern.trim(),
        type,
        patternType,
        priority,
        isActive,
        name: name?.trim() || null,
        description: description?.trim() || null,
        severity,
        matchCount: 0,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(newPattern)
  } catch (error) {
    console.error('Pattern creation error:', error)
    return NextResponse.json({ 
      error: 'Failed to create pattern',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}