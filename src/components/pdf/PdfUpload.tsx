'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  FileText, 
  X, 
  AlertCircle,
  CheckCircle,
  Plus
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PdfFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  progress?: number
}

interface PdfUploadProps {
  onUpload: (files: File[]) => Promise<void>
  maxFiles?: number
  maxSize?: number // in MB
}

export function PdfUpload({ onUpload, maxFiles = 10, maxSize = 10 }: PdfUploadProps) {
  const [pdfs, setPdfs] = useState<PdfFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const validateFile = (file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return 'Only PDF files are allowed'
    }
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`
    }
    return null
  }

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return

    const newPdfs: PdfFile[] = []
    const validFiles: File[] = []

    for (let i = 0; i < files.length && newPdfs.length < maxFiles; i++) {
      const file = files[i]
      const error = validateFile(file)
      
      const pdfFile: PdfFile = {
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: error ? 'error' : 'pending',
        error: error || undefined
      }

      newPdfs.push(pdfFile)
      if (!error) {
        validFiles.push(file)
      }
    }

    setPdfs(prev => [...prev, ...newPdfs])
    
    if (validFiles.length > 0) {
      handleUpload(validFiles)
    }
  }, [maxFiles, maxSize])

  const handleUpload = async (files: File[]) => {
    setIsUploading(true)
    
    try {
      // Update status to uploading
      setPdfs(prev => prev.map(pdf => 
        files.includes(pdf.file) ? { ...pdf, status: 'uploading', progress: 0 } : pdf
      ))

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setPdfs(prev => prev.map(pdf => 
          pdf.status === 'uploading' 
            ? { ...pdf, progress: Math.min((pdf.progress || 0) + 10, 90) }
            : pdf
        ))
      }, 200)

      await onUpload(files)

      clearInterval(progressInterval)

      // Update status to success
      setPdfs(prev => prev.map(pdf => 
        files.includes(pdf.file) ? { ...pdf, status: 'success', progress: 100 } : pdf
      ))

      // Remove successful uploads after 2 seconds
      setTimeout(() => {
        setPdfs(prev => prev.filter(pdf => pdf.status !== 'success'))
      }, 2000)

    } catch (error) {
      console.error('Upload failed:', error)
      setPdfs(prev => prev.map(pdf => 
        files.includes(pdf.file) 
          ? { ...pdf, status: 'error', error: 'Upload failed' }
          : pdf
      ))
    } finally {
      setIsUploading(false)
    }
  }

  const removePdf = (id: string) => {
    setPdfs(prev => prev.filter(pdf => pdf.id !== id))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6 text-muted-foreground" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">Upload PDF Files</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Drag and drop PDF files here, or click to select
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                Maximum {maxFiles} files, {maxSize}MB each
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                id="pdf-upload"
                disabled={isUploading}
              />
              <Button 
                asChild 
                variant="outline"
                disabled={isUploading}
              >
                <label htmlFor="pdf-upload" className="cursor-pointer flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Select Files
                </label>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {pdfs.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Files to Upload</h4>
          
          {pdfs.map((pdf) => (
            <Card key={pdf.id} className="p-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <FileText className="w-4 h-4 text-red-500" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{pdf.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(pdf.file.size)}
                  </p>
                  
                  {pdf.status === 'uploading' && pdf.progress !== undefined && (
                    <Progress value={pdf.progress} className="mt-2 h-1" />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {pdf.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePdf(pdf.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {pdf.status === 'uploading' && (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                  
                  {pdf.status === 'success' && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  
                  {pdf.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              
              {pdf.error && (
                <Alert className="mt-2" variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription className="text-xs">
                    {pdf.error}
                  </AlertDescription>
                </Alert>
              )}
            </Card>
          ))}
        </div>
      )}

      {isUploading && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Uploading PDF files... Please don't close this page.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}