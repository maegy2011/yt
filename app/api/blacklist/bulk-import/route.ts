import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

// Types for bulk import
interface BulkImportItem {
  itemId: string
  title: string
  type: 'video' | 'playlist' | 'channel'
  thumbnail?: string
  channelName?: string
  priority?: number
}

interface BulkImportRequest {
  items: BulkImportItem[]
  batchName?: string
  description?: string
  source?: 'file' | 'api' | 'manual'
  chunkSize?: number
  skipDuplicates?: boolean
}

interface BulkImportProgress {
  batchId: string
  total: number
  processed: number
  success: number
  failed: number
  isComplete: boolean
  errors: string[]
}

// In-memory storage for progress tracking (in production, use Redis or similar)
const importProgress = new Map<string, BulkImportProgress>()

// Helper function to create MD5 hash
function createMD5Hash(input: string): string {
  return createHash('md5').update(input).digest('hex')
}

// Process items in chunks for better performance
async function processChunk(
  items: BulkImportItem[], 
  batchId: string,
  isBlacklist: boolean = true,
  skipDuplicates: boolean = true
): Promise<{ success: number; failed: number; errors: string[] }> {
  const modelName = isBlacklist ? 'blacklistedItem' : 'whitelistedItem'
  const errors: string[] = []
  let success = 0
  let failed = 0

  for (const item of items) {
    try {
      // Create hashes for performance
      const videoHash = item.type === 'video' ? createMD5Hash(item.itemId) : null
      const channelHash = item.type === 'channel' ? createMD5Hash(item.itemId) : null

      // Check for duplicates if requested
      if (skipDuplicates) {
        const existing = await (db as any)[modelName].findUnique({
          where: { itemId: item.itemId }
        })
        
        if (existing) {
          failed++
          continue
        }
      }

      // Prepare data with optimizations
      const data: any = {
        itemId: item.itemId,
        title: item.title.trim(),
        type: item.type,
        thumbnail: item.thumbnail?.trim() || null,
        channelName: item.channelName?.trim() || null,
        priority: item.priority || 0,
        batchId,
        videoHash,
        channelHash,
        isChannelBlock: item.type === 'channel',
        isChannelWhitelist: item.type === 'channel'
      }

      // Use upsert for better performance and conflict handling
      await (db as any)[modelName].upsert({
        where: { itemId: item.itemId },
        update: {
          title: data.title,
          type: data.type,
          thumbnail: data.thumbnail,
          channelName: data.channelName,
          priority: data.priority,
          updatedAt: new Date()
        },
        create: data
      })

      success++
    } catch (error) {
      failed++
      errors.push(`Failed to process ${item.itemId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return { success, failed, errors }
}

// Main bulk import endpoint
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body: BulkImportRequest = await request.json()
    const { 
      items, 
      batchName, 
      description, 
      source = 'manual',
      chunkSize = 100,
      skipDuplicates = true 
    } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid items array. Must be a non-empty array.' 
      }, { status: 400 })
    }

    if (items.length > 50000) {
      return NextResponse.json({ 
        error: 'Too many items. Maximum 50,000 items per batch.' 
      }, { status: 400 })
    }

    // Create batch record
    const batch = await db.blacklistBatch.create({
      data: {
        name: batchName || `Import ${new Date().toISOString()}`,
        description: description || `Bulk import of ${items.length} items`,
        source,
        itemCount: items.length,
        status: 'processing',
        metadata: JSON.stringify({
          chunkSize,
          skipDuplicates,
          startTime: new Date().toISOString()
        })
      }
    })

    const batchId = batch.id
    let totalSuccess = 0
    let totalFailed = 0
    const allErrors: string[] = []

    // Initialize progress tracking
    importProgress.set(batchId, {
      batchId,
      total: items.length,
      processed: 0,
      success: 0,
      failed: 0,
      isComplete: false,
      errors: []
    })

    // Process items in chunks
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize)
      
      const result = await processChunk(chunk, batchId, true, skipDuplicates)
      
      totalSuccess += result.success
      totalFailed += result.failed
      allErrors.push(...result.errors)

      // Update progress
      const currentProgress = importProgress.get(batchId)!
      currentProgress.processed = Math.min(i + chunkSize, items.length)
      currentProgress.success = totalSuccess
      currentProgress.failed = totalFailed
      currentProgress.errors = allErrors.slice(-10) // Keep only last 10 errors

      // Yield control to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    // Update batch record
    const processingTime = Date.now() - startTime
    await db.blacklistBatch.update({
      where: { id: batchId },
      data: {
        successCount: totalSuccess,
        errorCount: totalFailed,
        status: totalFailed === 0 ? 'completed' : 'completed_with_errors',
        metadata: JSON.stringify({
          chunkSize,
          skipDuplicates,
          startTime: new Date().toISOString(),
          processingTime,
          avgTimePerItem: processingTime / items.length
        })
      }
    })

    // Mark progress as complete
    const finalProgress = importProgress.get(batchId)!
    finalProgress.isComplete = true
    finalProgress.errors = allErrors

    // Update metrics
    await updateBlacklistMetrics(items.length, processingTime)

    return NextResponse.json({
      success: true,
      batchId,
      summary: {
        total: items.length,
        success: totalSuccess,
        failed: totalFailed,
        processingTime: `${processingTime}ms`,
        avgTimePerItem: `${(processingTime / items.length).toFixed(2)}ms`
      },
      batch: {
        id: batchId,
        name: batch.name,
        status: totalFailed === 0 ? 'completed' : 'completed_with_errors'
      }
    })

  } catch (error) {
    console.error('Bulk import failed:', error)
    return NextResponse.json({ 
      error: 'Bulk import failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// Get import progress
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const batchId = searchParams.get('batchId')

  if (!batchId) {
    return NextResponse.json({ error: 'batchId is required' }, { status: 400 })
  }

  const progress = importProgress.get(batchId)
  
  if (!progress) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
  }

  return NextResponse.json(progress)
}

// Cancel import
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const batchId = searchParams.get('batchId')

  if (!batchId) {
    return NextResponse.json({ error: 'batchId is required' }, { status: 400 })
  }

  // Remove from progress tracking
  importProgress.delete(batchId)

  // Update batch status
  try {
    await db.blacklistBatch.update({
      where: { id: batchId },
      data: { status: 'cancelled' }
    })
  } catch (error) {
    console.error('Failed to update batch status:', error)
  }

  return NextResponse.json({ success: true, message: 'Import cancelled' })
}

// Helper function to update metrics
async function updateBlacklistMetrics(itemCount: number, processingTime: number) {
  const today = new Date().toISOString().split('T')[0]
  
  try {
    await db.blacklistMetrics.upsert({
      where: { date: new Date(today) },
      update: {
        totalItems: { increment: itemCount },
        filterHits: { increment: 1 },
        avgFilterTime: { 
          // Simple moving average calculation
          set: (current) => {
            const currentAvg = current || 0
            return (currentAvg + processingTime) / 2
          }
        }
      },
      create: {
        date: new Date(today),
        totalItems: itemCount,
        filterHits: 1,
        avgFilterTime: processingTime
      }
    })
  } catch (error) {
    console.error('Failed to update metrics:', error)
  }
}