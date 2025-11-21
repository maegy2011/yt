'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  BookOpen, 
  Share2, 
  ArrowLeft, 
  Play, 
  Edit, 
  Unlink,
  ExternalLink,
  Calendar,
  Tag,
  FileText,
  MoreHorizontal,
  Check
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { VideoNote, Notebook } from '@/types/notes'
import { formatDistanceToNow } from 'date-fns'

interface NotebookViewProps {
  notebook: Notebook
  notes: VideoNote[]
  onBack: () => void
  onNotePlay: (note: VideoNote) => void
  onNoteEdit: (note: VideoNote) => void
  onNoteUnlink: (noteId: string, notebookId: string) => void
  onShare: (notebook: Notebook) => void
  className?: string
}

export function NotebookView({ 
  notebook, 
  notes, 
  onBack, 
  onNotePlay, 
  onNoteEdit,
  onNoteUnlink,
  onShare,
  className = '' 
}: NotebookViewProps) {
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set())
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false)
  const [noteToUnlink, setNoteToUnlink] = useState<{noteId: string, noteTitle: string} | null>(null)
  const [isUnlinking, setIsUnlinking] = useState(false)

  const handleSelectNote = (noteId: string) => {
    setSelectedNotes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(noteId)) {
        newSet.delete(noteId)
      } else {
        newSet.add(noteId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedNotes.size === notes.length) {
      setSelectedNotes(new Set())
    } else {
      setSelectedNotes(new Set(notes.map(note => note.id)))
    }
  }

  const handleUnlinkNote = (noteId: string, noteTitle: string) => {
    setNoteToUnlink({ noteId, noteTitle })
    setShowUnlinkConfirm(true)
  }

  const confirmUnlink = async () => {
    if (!noteToUnlink) return

    setIsUnlinking(true)
    try {
      await onNoteUnlink(noteToUnlink.noteId, notebook.id)
      setShowUnlinkConfirm(false)
      setNoteToUnlink(null)
    } catch (error) {
      console.error('Failed to unlink note:', error)
    } finally {
      setIsUnlinking(false)
    }
  }

  const handleBatchUnlink = async () => {
    if (selectedNotes.size === 0) return

    setIsUnlinking(true)
    try {
      // Unlink all selected notes
      for (const noteId of selectedNotes) {
        await onNoteUnlink(noteId, notebook.id)
      }
      setSelectedNotes(new Set())
    } catch (error) {
      console.error('Failed to batch unlink notes:', error)
    } finally {
      setIsUnlinking(false)
    }
  }

  const getNotebookColor = (color: string) => {
    const colorMap: Record<string, string> = {
      '#3b82f6': 'bg-blue-500',
      '#ef4444': 'bg-red-500',
      '#10b981': 'bg-green-500',
      '#f59e0b': 'bg-yellow-500',
      '#8b5cf6': 'bg-purple-500',
      '#ec4899': 'bg-pink-500',
      '#6b7280': 'bg-gray-500',
    }
    return colorMap[color] || 'bg-blue-500'
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full ${getNotebookColor(notebook.color)}`} />
            <h1 className="text-xl font-semibold">{notebook.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {notes.length} notes
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onShare(notebook)}
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Notebook Info */}
      {notebook.description && (
        <div className="p-4 bg-muted/30">
          <p className="text-sm text-muted-foreground">{notebook.description}</p>
          {notebook.tags && (
            <div className="flex items-center gap-1 mt-2">
              <Tag className="w-3 h-3 text-muted-foreground" />
              <div className="flex gap-1">
                {notebook.tags.split(',').filter(tag => tag.trim()).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Batch Actions */}
      {selectedNotes.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-primary/5 border-b">
          <span className="text-sm font-medium">
            {selectedNotes.size} note{selectedNotes.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBatchUnlink}
              disabled={isUnlinking}
              className="flex items-center gap-2"
            >
              {isUnlinking ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Unlink className="w-4 h-4" />
              )}
              Unlink from Notebook
            </Button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {notes.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No notes yet</h3>
              <p className="text-muted-foreground">Add some notes to this notebook to get started.</p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center gap-2 p-2 rounded-lg border">
                <input
                  type="checkbox"
                  checked={selectedNotes.size === notes.length}
                  onChange={handleSelectAll}
                  className="rounded"
                />
                <span className="text-sm font-medium">Select all notes</span>
              </div>

              {/* Notes */}
              {notes.map((note) => (
                <Card key={note.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedNotes.has(note.id)}
                          onChange={() => handleSelectNote(note.id)}
                          className="mt-1 rounded"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base line-clamp-2">{note.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {note.channelName}
                          </p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            {(note.startTime !== undefined || note.endTime !== undefined) && (
                              <Badge variant="outline" className="text-xs">
                                {note.startTime !== undefined && formatDuration(note.startTime)}
                                {note.startTime !== undefined && note.endTime !== undefined && ' - '}
                                {note.endTime !== undefined && formatDuration(note.endTime)}
                              </Badge>
                            )}
                            
                            {note.isClip && (
                              <Badge variant="secondary" className="text-xs">Clip</Badge>
                            )}
                            
                            <Badge variant="outline" className="text-xs">
                              {note.linkType === 'linked' ? 'Linked' : 'Legacy'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onNotePlay(note)}>
                            <Play className="w-4 h-4 mr-2" />
                            Play Video
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onNoteEdit(note)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Note
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleUnlinkNote(note.id, note.title)}
                            className="text-destructive"
                          >
                            <Unlink className="w-4 h-4 mr-2" />
                            Unlink from Notebook
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm line-clamp-3">{note.note}</p>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span>Font size: {note.fontSize}px</span>
                          {note.thumbnail && (
                            <div className="w-12 h-8 rounded overflow-hidden bg-muted">
                              <img 
                                src={note.thumbnail} 
                                alt={note.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Unlink Confirmation Dialog */}
      <AlertDialog open={showUnlinkConfirm} onOpenChange={setShowUnlinkConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Note from Notebook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink "{noteToUnlink?.noteTitle}" from "{notebook.title}"? 
              This action will remove the note from this notebook but won't delete the note itself.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnlinking}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmUnlink}
              disabled={isUnlinking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUnlinking ? (
                <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Unlink className="w-4 h-4 mr-2" />
              )}
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}