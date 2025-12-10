import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
    }
    
    const watchedVideos = await db.watchedVideo.findMany({
      orderBy: { watchedAt: 'desc' }
    })
    
    // Calculate statistics
    const stats = {
      totalVideos: watchedVideos.length,
      totalWatchTime: watchedVideos.reduce((acc, video) => {
        if (video.duration) {
          const [minutes, seconds] = video.duration.split(':').map(Number)
          return acc + (minutes * 60 + (seconds || 0))
        }
        return acc
      }, 0),
      mostWatchedChannel: watchedVideos.reduce((acc, video) => {
        const count = watchedVideos.filter(v => v.channelName === video.channelName).length
        return count > acc.count ? { name: video.channelName, count } : acc
      }, { name: '', count: 0 }).name,
      videosThisWeek: watchedVideos.filter(video => {
        const watchedAt = new Date(video.watchedAt)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return watchedAt > weekAgo
      }).length,
      videosThisMonth: watchedVideos.filter(video => {
        const watchedAt = new Date(video.watchedAt)
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return watchedAt > monthAgo
      }).length,
      averageVideoLength: watchedVideos.length > 0 
        ? watchedVideos.reduce((acc, video) => {
            if (video.duration) {
              const [minutes, seconds] = video.duration.split(':').map(Number)
              return acc + (minutes * 60 + (seconds || 0))
            }
            return acc
          }, 0) / watchedVideos.filter(v => v.duration).length
        : 0
    }
    
    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch watched history stats' }, { status: 500 })
  }
}