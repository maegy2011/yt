import { NextRequest, NextResponse } from 'next/server'
import { DataManager } from '@/lib/database-modules'

interface BatchOperation {
  type: 'favoriteChannels' | 'favoriteVideos' | 'videoNotes' | 'watchedVideos' | 'notebooks' | 'playbackPositions'
  ids?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const operations: BatchOperation[] = body.operations
    
    // Console statement removed
    
    const result = await DataManager.clearBatch(operations)
    
    // Console statement removed
    
    return NextResponse.json({
      success: true,
      message: 'Batch operations completed successfully',
      results: result.results,
      totalDeleted: result.totalDeleted,
      localStorageCleared: true // Client will handle this
    })
  } catch (error) {
    // Console statement removed
    return NextResponse.json({
      success: false,
      error: 'Failed to perform batch operations',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    }, { status: 500 })
  }
}