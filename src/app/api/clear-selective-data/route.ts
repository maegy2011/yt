import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { DataManager } from '@/lib/database-modules'

const clearSelectiveDataSchema = z.object({
  favoriteChannels: z.boolean().optional(),
  favoriteVideos: z.boolean().optional(),
  videoNotes: z.boolean().optional(),
  watchedVideos: z.boolean().optional(),
  notebooks: z.boolean().optional(),
  playbackPositions: z.boolean().optional(),
  noteLinks: z.boolean().optional(),
  localStorage: z.boolean().optional(),
  searchCache: z.boolean().optional(),
  userPreferences: z.boolean().optional(),
})

// POST /api/clear-selective-data - Clear selected types of data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const options = clearSelectiveDataSchema.parse(body)

    console.log('Starting selective clear data operation:', options)
    
    const result = await DataManager.clearSelective(options)
    
    console.log('Selective data clearing completed:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Selected data cleared successfully',
      deleted: result.deleted
    })
  } catch (error) {
    console.error('Selective clear data failed:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to clear selected data' },
      { status: 500 }
    )
  }
}