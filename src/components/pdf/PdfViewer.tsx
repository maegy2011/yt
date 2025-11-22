'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Download, 
  Share2, 
  Eye, 
  FileText, 
  Calendar,
  HardDrive,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'

interface PdfFile {
  id: string
  filename: string
  originalName: string
  size: number
  mimeType: string
  path: string
  uploadedAt: string
}

interface PdfViewerProps {
  pdf: PdfFile
  isOpen: boolean
  onClose: () => void
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function PdfViewer({ pdf, isOpen, onClose }: PdfViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = pdf.path
    link.download = pdf.originalName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: pdf.originalName,
          text: `Check out this PDF: ${pdf.originalName}`,
          url: window.location.origin + pdf.path
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.origin + pdf.path)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-[95vw] w-full max-w-4xl max-h-[90vh] ${isFullscreen ? 'w-screen h-screen max-w-none' : ''}`}>
        <DialogHeader>
          <div className="flex items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <FileText className="w-5 h-5 text-red-500" />
              <DialogTitle className="truncate pr-2">{pdf.originalName}</DialogTitle>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="h-8 w-8 touch-manipulation-none"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 touch-manipulation-none">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <DialogDescription>
            <div className="flex items-center justify-center gap-2 sm:gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                <span className="hidden sm:inline">{formatFileSize(pdf.size)}</span>
                <span className="sm:hidden">{formatFileSize(pdf.size)}</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span className="hidden sm:inline">{formatDistanceToNow(new Date(pdf.uploadedAt), { addSuffix: true })}</span>
                <span className="sm:hidden">{formatDistanceToNow(new Date(pdf.uploadedAt), { addSuffix: false })}</span>
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col h-[60vh] sm:h-[70vh]">
          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2 border-b">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="w-full sm:w-auto h-9 touch-manipulation-none"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
                <span className="sm:hidden">Save</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="w-full sm:w-auto h-9 touch-manipulation-none"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
                <span className="sm:hidden">Share</span>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-9 touch-manipulation-none"
              >
                <a
                  href={pdf.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Open in New Tab</span>
                  <span className="sm:hidden">Open</span>
                </a>
              </Button>
            </div>
          </div>

          {/* PDF Viewer */}
          <ScrollArea className="flex-1">
            <div className="p-2 sm:p-4">
              <iframe
                src={`${pdf.path}#view=FitV`}
                className="w-full h-full min-h-[400px] sm:min-h-[600px] border rounded-lg"
                title={pdf.originalName}
              />
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface PdfCardProps {
  pdf: PdfFile
  onView: (pdf: PdfFile) => void
  onDelete: (pdfId: string) => void
}

export function PdfCard({ pdf, onView, onDelete }: PdfCardProps) {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = pdf.path
    link.download = pdf.originalName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: pdf.originalName,
          text: `Check out this PDF: ${pdf.originalName}`,
          url: window.location.origin + pdf.path
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.origin + pdf.path)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-red-50 rounded-lg">
              <FileText className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base line-clamp-2">{pdf.originalName}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {formatFileSize(pdf.size)}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(pdf)}>
                <Eye className="w-4 h-4 mr-2" />
                View PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(pdf.id)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <Separator />
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDistanceToNow(new Date(pdf.uploadedAt), { addSuffix: true })}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(pdf)}
            className="text-xs h-6 px-2"
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}