import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { createSession } from '@/lib/session'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: {
        email: email
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Log the login action
    await db.auditLog.create({
      data: {
        user_id: user.id,
        action: 'login',
        target_type: 'user',
        target_id: user.id,
        details: { email, role: user.role }
      }
    })

    // Create session
    const sessionUser = {
      id: user.id,
      email: user.email,
      role: user.role as 'admin' | 'viewer'
    }

    await createSession(sessionUser)

    return NextResponse.json({
      message: 'Login successful',
      user: sessionUser
    })
  } catch (error) {
    console.error('Error during login:', error)
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}