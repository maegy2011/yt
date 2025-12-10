import { NextRequest, NextResponse } from 'next/server'
import { databaseMaintenance } from '@/lib/api/health'

// Database maintenance endpoint
export async function POST(request: NextRequest) {
  return databaseMaintenance(request)
}

// Get database statistics
export async function GET(request: NextRequest) {
  return databaseMaintenance(request)
}