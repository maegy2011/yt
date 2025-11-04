import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper function to extract thumbnail URL from YouTubei v1.7.0 Thumbnails API
function extractThumbnail(thumbnails: any): { url: string; width: number; height: number } {
  if (!thumbnails) {
    return {
      url: `https://via.placeholder.com/320x180/374151/ffffff?text=No+Thumbnail`,
      width: 320,
      height: 180
    }
  }

  // Handle YouTubei v1.7.0 Thumbnails object (has .best property)
  if (thumbnails.best && typeof thumbnails.best === 'string') {
    return {
      url: thumbnails.best,
      width: 1280,
      height: 720
    }
  }

  // Handle YouTubei v1.7.0 Thumbnails array
  if (Array.isArray(thumbnails) && thumbnails.length > 0) {
    const bestThumbnail = thumbnails[thumbnails.length - 1]
    if (bestThumbnail && bestThumbnail.url) {
      return {
        url: bestThumbnail.url,
        width: bestThumbnail.width || 1280,
        height: bestThumbnail.height || 720
      }
    }
  }

  // Handle single thumbnail object
  if (thumbnails.url) {
    return {
      url: thumbnails.url,
      width: thumbnails.width || 320,
      height: thumbnails.height || 180
    }
  }

  // Handle string URL
  if (typeof thumbnails === 'string') {
    return {
      url: thumbnails,
      width: 320,
      height: 180
    }
  }

  // Fallback
  return {
    url: `https://via.placeholder.com/320x180/374151/ffffff?text=No+Thumbnail`,
    width: 320,
    height: 180
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const maxVideos = parseInt(searchParams.get('maxVideos') || '20')
    const maxPlaylists = parseInt(searchParams.get('maxPlaylists') || '10')
    const includePlaylists = searchParams.get('includePlaylists') !== 'false'
    const videoPage = parseInt(searchParams.get('videoPage') || '1')
    const playlistPage = parseInt(searchParams.get('playlistPage') || '1')
    const videosPerPage = parseInt(searchParams.get('videosPerPage') || '12')
    const playlistsPerPage = parseInt(searchParams.get('playlistsPerPage') || '6')

    console.log('Fetching followed channels content:', { 
      maxVideos, 
      maxPlaylists, 
      includePlaylists, 
      videoPage, 
      playlistPage, 
      videosPerPage, 
      playlistsPerPage 
    })

    // Get all favorite channels from database
    const favoriteChannels = await db.favoriteChannel.findMany({
      orderBy: { addedAt: 'desc' }
    })

    if (favoriteChannels.length === 0) {
      return NextResponse.json({
        channels: [],
        videos: [],
        playlists: [],
        pagination: {
          videos: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: videosPerPage,
            hasNextPage: false,
            hasPreviousPage: false
          },
          playlists: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: playlistsPerPage,
            hasNextPage: false,
            hasPreviousPage: false
          }
        },
        stats: {
          totalChannels: 0,
          totalVideos: 0,
          totalPlaylists: 0,
          totalViews: 0,
          totalSubscribers: 0
        },
        metadata: {
          fetchedAt: new Date().toISOString(),
          source: 'Followed Channels Content',
          message: 'No channels found. Add some channels to your favorites to see their content here.'
        }
      })
    }

    const { Client } = await import('youtubei')
    const youtube = new Client()

    const allVideos: any[] = []
    const allPlaylists: any[] = []
    const channelsInfo: any[] = []

    // Process each favorite channel
    for (const channel of favoriteChannels) {
      try {
        console.log(`Processing channel: ${channel.name} (${channel.channelId})`)
        
        // Get channel info
        const channelData = await youtube.getChannel(channel.channelId)
        
        if (channelData) {
          // Add channel info
          channelsInfo.push({
            id: channelData.id,
            name: channelData.name,
            description: channelData.description || '',
            thumbnail: channelData.thumbnail ? extractThumbnail(channelData.thumbnail) : { url: channel.thumbnail || '', width: 0, height: 0 },
            subscriberCount: channelData.subscriberCount || 0,
            videoCount: channelData.videoCount || 0,
            url: `https://youtube.com/channel/${channelData.id}`,
            handle: channelData.handle || `@${channelData.name.toLowerCase().replace(/\s+/g, '')}`,
            addedAt: channel.addedAt
          })

          // Search for videos from this channel
          try {
            console.log(`Searching for videos from ${channel.name}...`)
            const videoSearch = await youtube.search(channel.name, { type: 'video' })
            
            if (videoSearch && videoSearch.items && videoSearch.items.length > 0) {
              const videos = videoSearch.items.slice(0, maxVideos).map((video: any) => {
                // Only include videos from this specific channel
                if (video.channel?.id !== channel.channelId) return null
                
                // Fix invalid dates
                let publishedAt = video.publishedAt
                if (publishedAt) {
                  try {
                    const date = new Date(publishedAt)
                    if (isNaN(date.getTime())) {
                      publishedAt = new Date().toISOString()
                    }
                  } catch (error) {
                    publishedAt = new Date().toISOString()
                  }
                } else {
                  publishedAt = new Date().toISOString()
                }
                
                return {
                  id: video.id,
                  videoId: video.id,
                  title: video.title,
                  description: video.description,
                  thumbnail: extractThumbnail(video.thumbnails),
                  duration: video.duration,
                  viewCount: video.viewCount || 0,
                  publishedAt: publishedAt,
                  channelId: channelData.id,
                  channelName: channelData.name,
                  channelThumbnail: channelData.thumbnail ? extractThumbnail(channelData.thumbnail).url : channel.thumbnail || '',
                  isLive: video.isLive || false,
                  isUpcoming: video.isUpcoming || false,
                  upcomingDate: video.upcomingDate,
                  stats: {
                    views: video.viewCount || 0,
                    likes: video.likeCount || 0,
                    comments: video.commentCount || 0
                  }
                }
              }).filter(video => video !== null) // Remove null entries
              
              allVideos.push(...videos)
              console.log(`Found ${videos.length} videos from ${channel.name}`)
            }
          } catch (videoError) {
            console.error(`Error searching for videos from ${channel.name}:`, videoError)
          }

          // Search for playlists from this channel if requested
          if (includePlaylists) {
            try {
              console.log(`Searching for playlists from ${channel.name}...`)
              const playlistSearch = await youtube.search(channel.name, { type: 'playlist' })
              
              if (playlistSearch && playlistSearch.items && playlistSearch.items.length > 0) {
                const playlists = playlistSearch.items.slice(0, maxPlaylists).map((playlist: any) => {
                  // Only include playlists from this specific channel
                  if (playlist.channel?.id !== channel.channelId) return null
                  
                  // Fix invalid dates
                  let lastUpdatedAt = playlist.lastUpdatedAt
                  if (lastUpdatedAt) {
                    try {
                      const date = new Date(lastUpdatedAt)
                      if (isNaN(date.getTime())) {
                        lastUpdatedAt = new Date().toISOString()
                      }
                    } catch (error) {
                      lastUpdatedAt = new Date().toISOString()
                    }
                  } else {
                    lastUpdatedAt = new Date().toISOString()
                  }
                  
                  return {
                    id: playlist.id,
                    title: playlist.title,
                    description: playlist.description,
                    thumbnail: extractThumbnail(playlist.thumbnails),
                    videoCount: playlist.videoCount || 0,
                    viewCount: playlist.viewCount || 0,
                    lastUpdatedAt: lastUpdatedAt,
                    channelId: channelData.id,
                    channelName: channelData.name,
                    channelThumbnail: channelData.thumbnail ? extractThumbnail(channelData.thumbnail).url : channel.thumbnail || ''
                  }
                }).filter(playlist => playlist !== null) // Remove null entries
                
                allPlaylists.push(...playlists)
                console.log(`Found ${playlists.length} playlists from ${channel.name}`)
              }
            } catch (playlistError) {
              console.error(`Error searching for playlists from ${channel.name}:`, playlistError)
            }
          }
        }
      } catch (error) {
        console.error(`Error processing channel ${channel.name}:`, error)
        // Continue with other channels even if one fails
      }
    }

    // Sort videos by published date (newest first)
    allVideos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    // Sort playlists by last updated date (newest first)
    allPlaylists.sort((a, b) => new Date(b.lastUpdatedAt || 0).getTime() - new Date(a.lastUpdatedAt || 0).getTime())

    // Pagination for videos
    const totalVideos = allVideos.length
    const videoStartIndex = (videoPage - 1) * videosPerPage
    const videoEndIndex = videoStartIndex + videosPerPage
    const paginatedVideos = allVideos.slice(videoStartIndex, videoEndIndex)
    const hasMoreVideos = videoEndIndex < totalVideos

    // Pagination for playlists
    const totalPlaylists = allPlaylists.length
    const playlistStartIndex = (playlistPage - 1) * playlistsPerPage
    const playlistEndIndex = playlistStartIndex + playlistsPerPage
    const paginatedPlaylists = allPlaylists.slice(playlistStartIndex, playlistEndIndex)
    const hasMorePlaylists = playlistEndIndex < totalPlaylists

    const response = {
      channels: channelsInfo,
      videos: paginatedVideos,
      playlists: paginatedPlaylists,
      pagination: {
        videos: {
          currentPage: videoPage,
          totalPages: Math.ceil(totalVideos / videosPerPage),
          totalItems: totalVideos,
          itemsPerPage: videosPerPage,
          hasNextPage: hasMoreVideos,
          hasPreviousPage: videoPage > 1
        },
        playlists: {
          currentPage: playlistPage,
          totalPages: Math.ceil(totalPlaylists / playlistsPerPage),
          totalItems: totalPlaylists,
          itemsPerPage: playlistsPerPage,
          hasNextPage: hasMorePlaylists,
          hasPreviousPage: playlistPage > 1
        }
      },
      stats: {
        totalChannels: channelsInfo.length,
        totalVideos: totalVideos,
        totalPlaylists: totalPlaylists,
        totalViews: allVideos.reduce((sum, video) => sum + (video.viewCount || 0), 0),
        totalSubscribers: channelsInfo.reduce((sum, channel) => sum + (channel.subscriberCount || 0), 0)
      },
      metadata: {
        fetchedAt: new Date().toISOString(),
        source: 'Followed Channels Content',
        maxVideosPerChannel: maxVideos,
        maxPlaylistsPerChannel: maxPlaylists
      }
    }

    console.log('Followed channels content fetched successfully:', {
      channels: response.stats.totalChannels,
      videos: response.stats.totalVideos,
      playlists: response.stats.totalPlaylists,
      videoPage: videoPage,
      playlistPage: playlistPage
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('Failed to fetch followed channels content:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch followed channels content',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}