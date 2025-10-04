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

    // Log the action
    await db.auditLog.create({
      data: {
        user_id: admin.id,
        action: 'create_admin',
        target_type: 'user',
        target_id: admin.id,
        details: { email, role: 'admin' }
      }
    })

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
    return NextResponse.json(
      { error: 'Failed to create admin account' },
      { status: 500 }
    )
  }
}