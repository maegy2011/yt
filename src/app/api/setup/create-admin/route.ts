import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if admin already exists
    const adminCount = await db.user.count({
      where: {
        role: 'admin'
      }
    })

    if (adminCount > 0) {
      return NextResponse.json(
        { error: 'Admin account already exists' },
        { status: 400 }
      )
    }

    // Check if user with this email already exists
    const existingUser = await db.user.findUnique({
      where: {
        email: email
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create admin user
    const admin = await db.user.create({
      data: {
        email,
        password_hash: passwordHash,
        role: 'admin'
      }
    })

    // Create default settings
    try {
      await db.setting.createMany({
        data: [
          {
            key: 'api_quota_total',
            value: { value: 10000 } // Default monthly quota
          },
          {
            key: 'youtube_api_key',
            value: { value: '' } // Will be set by admin
          }
        ]
      })
    } catch (settingsError) {
      console.error('Error creating default settings:', settingsError)
      // Continue even if settings creation fails
    }

    // Log the action
    try {
      await db.auditLog.create({
        data: {
          user_id: admin.id,
          action: 'create_admin',
          target_type: 'user',
          target_id: admin.id,
          details: { email, role: 'admin' }
        }
      })
    } catch (logError) {
      console.error('Error creating audit log:', logError)
      // Continue even if audit log creation fails
    }

    return NextResponse.json({
      message: 'Admin account created successfully',
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    })
  } catch (error) {
    console.error('Error creating admin:', error)
    
    // Provide more detailed error information
    let errorMessage = 'Failed to create admin account'
    let errorDetails = null
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = {
        name: error.name,
        stack: error.stack,
        code: (error as any).code
      }
    }
    
    // Check for specific database errors
    if (typeof error === 'object' && error !== null) {
      const prismaError = error as any
      if (prismaError.code === 'P2002') {
        errorMessage = 'Database constraint violation: This email might already be registered'
      } else if (prismaError.code === 'P1001') {
        errorMessage = 'Database connection error: Unable to connect to the database'
      } else if (prismaError.code === 'P1002') {
        errorMessage = 'Database connection timeout: The database is not responding'
      } else if (prismaError.code === 'P1003') {
        errorMessage = 'Database not found: The specified database does not exist'
      } else if (prismaError.code === 'P1017') {
        errorMessage = 'Database connection failed: Server closed the connection unexpectedly'
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown'
      },
      { status: 500 }
    )
  }
}