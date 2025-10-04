import { NextResponse } from 'next/server'
import { destroySession } from '@/lib/session'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function POST() {
  try {
    const user = await getSession()
    
    if (user) {
      // Log the logout action
      await db.auditLog.create({
        data: {
          user_id: user.id,
          action: 'logout',
          target_type: 'user',
          target_id: user.id,
          details: { email: user.email, role: user.role }
        }
      })
    }

    await destroySession()

    return NextResponse.json({
      message: 'Logout successful'
    })
  } catch (error) {
    console.error('Error during logout:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}