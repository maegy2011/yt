import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Get all watched videos
    const watchedVideos = await db.watchedVideo.findMany()
    
    let fixedCount = 0
    let deletedCount = 0
    
    for (const video of watchedVideos) {
      // Check if the videoId looks like a database cuid (incorrect)
      if (video.videoId.length > 11 || !/^[a-zA-Z0-9_-]+$/.test(video.videoId)) {
        
        // Try to extract the correct YouTube video ID from the thumbnail URL
        const thumbnailMatch = video.thumbnail.match(/\/vi\/([^\/]+)/)
        if (thumbnailMatch && thumbnailMatch[1]) {
          const correctVideoId = thumbnailMatch[1]
          
          // Check if there's already a record with the correct video ID
          const existingCorrect = await db.watchedVideo.findUnique({
            where: { videoId: correctVideoId }
          })
          
          if (existingCorrect) {
            // If there's already a correct record, update it with the most recent data
            await db.watchedVideo.update({
              where: { videoId: correctVideoId },
              data: {
                watchedAt: new Date(),
                title: video.title,
                channelName: video.channelName,
                thumbnail: video.thumbnail,
                duration: video.duration,
                viewCount: video.viewCount
              }
            })
          } else {
            // Update the current record with the correct video ID
            await db.watchedVideo.update({
              where: { id: video.id },
              data: { videoId: correctVideoId }
            })
            fixedCount++
          }
          
          // If we updated an existing record, delete the duplicate
          if (existingCorrect) {
            await db.watchedVideo.delete({
              where: { id: video.id }
            })
            deletedCount++
          }
        } else {
          // If we can't extract a correct video ID, delete the record
          await db.watchedVideo.delete({
            where: { id: video.id }
          })
          deletedCount++
        }
      }
    }
    
    const message = `Fixed ${fixedCount} video IDs and deleted ${deletedCount} invalid records`
    
    return NextResponse.json({ 
      message,
      fixedCount,
      deletedCount,
      totalProcessed: watchedVideos.length
    })
  } catch (error) {
    console.error('Error fixing video IDs:', error)
    return NextResponse.json({ error: 'Failed to fix video IDs' }, { status: 500 })
  }
}