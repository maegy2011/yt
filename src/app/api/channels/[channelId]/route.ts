import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const channelId = params.channelId
    
    console.log('Unfollow channel request:', { channelId })

    if (!channelId) {
      console.error('Missing channelId in DELETE request')
      return NextResponse.json({ 
        error: 'Channel ID is required' 
      }, { status: 400 })
    }

    // Check if channel exists before deleting
    const existingChannel = await db.favoriteChannel.findUnique({
      where: { channelId }
    })

    if (!existingChannel) {
      console.log('Channel not found in favorites:', { channelId })
      return NextResponse.json({ 
        error: 'Channel not found in favorites' 
      }, { status: 404 })
    }

    // Delete the channel
    await db.favoriteChannel.delete({
      where: { channelId }
    })

    console.log('Channel unfollowed successfully:', { 
      channelId, 
      name: existingChannel.name 
    })

    return NextResponse.json({ 
      success: true,
      message: 'Channel unfollowed successfully',
      channel: {
        id: existingChannel.id,
        channelId: existingChannel.channelId,
        name: existingChannel.name
      }
    })
  } catch (error) {
    console.error('Failed to delete channel - Full error:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      channelId: params.channelId
    })
    
    // Handle specific database errors
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        error: 'Channel not found in favorites' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      error: 'Failed to unfollow channel',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}