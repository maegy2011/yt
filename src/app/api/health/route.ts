import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`
    
    // Check if we can access the User table
    const userCount = await db.user.count()
    
    // Check if admin exists
    const adminCount = await db.user.count({
      where: {
        role: 'admin'
      }
    })

    return NextResponse.json({
      status: 'healthy',
      database: {
        connected: true,
        userCount,
        adminCount,
        setupComplete: adminCount > 0
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown'
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    let errorMessage = 'Database connection failed'
    let errorDetails = null
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = {
        name: error.name,
        code: (error as any).code
      }
    }
    
    // Check for specific database errors
    if (typeof error === 'object' && error !== null) {
      const prismaError = error as any
      if (prismaError.code === 'P1001') {
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
        status: 'unhealthy',
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown'
      },
      { status: 500 }
    )
  }
}