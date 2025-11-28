import { NextResponse } from 'next/server'
import { DataManager } from '@/lib/database-modules'

export async function POST() {
  try {
    const result = await DataManager.clearAll()
    
    
    return NextResponse.json({
      success: true,
      message: 'All data cleared successfully using enhanced modules',
      deleted: result.deleted,
      localStorageCleared: true // Client will handle this
    })
  } catch (error) {
    // Clear all data failed
    return NextResponse.json({
      success: false,
      error: 'Failed to clear all data',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const statistics = await DataManager.getStatistics()
    
    return NextResponse.json({
      statistics,
      hasData: statistics.total > 0,
      enhanced: true // Using enhanced modules
    })
  } catch (error) {
    // Failed to get data statistics
    return NextResponse.json({
      error: 'Failed to get data statistics',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    }, { status: 500 })
  }
}