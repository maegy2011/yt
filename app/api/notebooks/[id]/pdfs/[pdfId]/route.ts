import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { unlink } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; pdfId: string } }
) {
  try {
    const { id: notebookId, pdfId } = params

    const pdfFile = await db.pdfFile.findFirst({
      where: {
        id: pdfId,
        notebookId
      }
    })

    if (!pdfFile) {
      return NextResponse.json(
        { error: 'PDF file not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ file: pdfFile })
  } catch (error) {
    // Error fetching PDF
    return NextResponse.json(
      { error: 'Failed to fetch PDF' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; pdfId: string } }
) {
  try {
    const { id: notebookId, pdfId } = params

    const pdfFile = await db.pdfFile.findFirst({
      where: {
        id: pdfId,
        notebookId
      }
    })

    if (!pdfFile) {
      return NextResponse.json(
        { error: 'PDF file not found' },
        { status: 404 }
      )
    }

    // Delete physical file
    const filepath = join(process.cwd(), 'public', pdfFile.path)
    try {
      await unlink(filepath)
    } catch (error) {
      // Error deleting physical file
    }

    // Delete database record
    await db.pdfFile.delete({
      where: { id: pdfId }
    })

    return NextResponse.json({
      message: 'PDF deleted successfully'
    })
  } catch (error) {
    // Error deleting PDF
    return NextResponse.json(
      { error: 'Failed to delete PDF' },
      { status: 500 }
    )
  }
}