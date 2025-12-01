import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: notebookId } = await params
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'pdfs')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    let uploadedFiles: Array<{
    id: string;
    notebookId: string;
    path: string;
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
    updatedAt: Date;
  }> = []

    for (const file of files) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        return NextResponse.json(
          { error: `Only PDF files are allowed. ${file.name} is not a PDF.` },
          { status: 400 }
        )
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size is 10MB.` },
          { status: 400 }
        )
      }

      // Generate unique filename
      const fileId = uuidv4()
      const filename = `${fileId}_${file.name}`
      const filepath = join(uploadsDir, filename)

      // Convert file to buffer and save
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filepath, buffer)

      // Save to database
      const pdfFile = await db.pdfFile.create({
        data: {
          notebookId,
          filename,
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          path: `/uploads/pdfs/${filename}`
        }
      })

      uploadedFiles.push(pdfFile)
    }

    return NextResponse.json({
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      files: uploadedFiles
    })
  } catch (error) {
    // Error uploading PDFs
    return NextResponse.json(
      { error: 'Failed to upload PDFs' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: notebookId } = await params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    let pdfFiles
    if (search) {
      // Search in filename and original name
      pdfFiles = await db.pdfFile.findMany({
        where: {
          notebookId,
          OR: [
            { filename: { contains: search } },
            { originalName: { contains: search } }
          ]
        },
        orderBy: { uploadedAt: 'desc' }
      })
    } else {
      pdfFiles = await db.pdfFile.findMany({
        where: { notebookId },
        orderBy: { uploadedAt: 'desc' }
      })
    }

    return NextResponse.json({ files: pdfFiles })
  } catch (error) {
    // Error fetching PDFs
    return NextResponse.json(
      { error: 'Failed to fetch PDFs' },
      { status: 500 }
    )
  }
}