import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notebookId = params.id
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'thumbnails')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${notebookId}_${timestamp}_${file.name}`
    const filepath = join(uploadsDir, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Update notebook with thumbnail path
    const thumbnailPath = `/uploads/thumbnails/${filename}`
    await db.notebook.update({
      where: { id: notebookId },
      data: { thumbnail: thumbnailPath }
    })

    return NextResponse.json({
      message: 'Thumbnail uploaded successfully',
      thumbnailPath
    })
  } catch (error) {
    // Error uploading thumbnail
    return NextResponse.json(
      { error: 'Failed to upload thumbnail' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notebookId = params.id

    // Remove thumbnail from notebook
    await db.notebook.update({
      where: { id: notebookId },
      data: { thumbnail: null }
    })

    return NextResponse.json({
      message: 'Thumbnail removed successfully'
    })
  } catch (error) {
    // Error removing thumbnail
    return NextResponse.json(
      { error: 'Failed to remove thumbnail' },
      { status: 500 }
    )
  }
}