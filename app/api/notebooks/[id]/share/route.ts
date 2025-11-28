import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const shareNotebookSchema = z.object({
  method: z.enum(['email', 'whatsapp', 'twitter', 'facebook', 'link', 'telegram']),
  recipients: z.array(z.string().email()).optional(),
  message: z.string().optional(),
})

// POST /api/notebooks/[id]/share - Share a notebook
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { method, recipients, message } = shareNotebookSchema.parse(body)

    // Check if notebook exists
    const notebook = await db.notebook.findUnique({
      where: { id },
      include: {
        notes: {
          include: {
            noteLinks: true
          }
        }
      }
    })

    if (!notebook) {
      return NextResponse.json(
        { success: false, error: 'Notebook not found' },
        { status: 404 }
      )
    }

    // Generate shareable link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const shareableLink = `${baseUrl}/notebooks/${id}`

    // Get all notes in the notebook
    const [legacyNotes, linkedNotes] = await Promise.all([
      db.videoNote.findMany({
        where: { notebookId: id }
      }),
      db.noteLink.findMany({
        where: { notebookId: id },
        include: {
          note: true
        }
      })
    ])

    const totalNotes = legacyNotes.length + linkedNotes.length

    // Create share content
    const shareContent = {
      title: notebook.title,
      description: notebook.description || `A collection of ${totalNotes} video notes`,
      noteCount: totalNotes,
      link: shareableLink,
      tags: notebook.tags.split(',').filter(tag => tag.trim()).slice(0, 3)
    }

    // Generate share message based on method
    let shareMessage = ''
    let shareUrl = ''

    switch (method) {
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(`Check out this notebook: ${notebook.title}`)}&body=${encodeURIComponent(`${message || ''}\n\n${shareContent.description}\n\nView here: ${shareableLink}`)}`
        break
      case 'whatsapp':
        shareMessage = `${message || ''}\n📓 ${notebook.title}\n${shareContent.description}\n\n${shareableLink}`
        shareUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`
        break
      case 'twitter':
        shareMessage = `${message || `Check out this notebook: ${notebook.title}`}\n${shareContent.description}\n${shareableLink}`
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableLink)}`
        break
      case 'telegram':
        shareMessage = `${message || ''}\n📓 ${notebook.title}\n${shareContent.description}\n\n${shareableLink}`
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareableLink)}&text=${encodeURIComponent(shareMessage)}`
        break
      case 'link':
        shareUrl = shareableLink
        break
    }

    return NextResponse.json({
      success: true,
      shareUrl,
      shareContent,
      method
    })
  } catch (error) {
    console.error('Error sharing notebook:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to share notebook' },
      { status: 500 }
    )
  }
}

// GET /api/notebooks/[id]/share - Get share information for a notebook
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if notebook exists
    const notebook = await db.notebook.findUnique({
      where: { id }
    })

    if (!notebook) {
      return NextResponse.json(
        { success: false, error: 'Notebook not found' },
        { status: 404 }
      )
    }

    // Get note count
    const [legacyNotes, linkedNotes] = await Promise.all([
      db.videoNote.count({
        where: { notebookId: id }
      }),
      db.noteLink.count({
        where: { notebookId: id }
      })
    ])

    const totalNotes = legacyNotes + linkedNotes

    // Generate shareable link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const shareableLink = `${baseUrl}/notebooks/${id}`

    const shareContent = {
      title: notebook.title,
      description: notebook.description || `A collection of ${totalNotes} video notes`,
      noteCount: totalNotes,
      link: shareableLink,
      tags: notebook.tags.split(',').filter(tag => tag.trim()).slice(0, 3),
      isPublic: notebook.isPublic
    }

    return NextResponse.json({
      success: true,
      shareContent
    })
  } catch (error) {
    console.error('Error getting notebook share info:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get notebook share info' },
      { status: 500 }
    )
  }
}