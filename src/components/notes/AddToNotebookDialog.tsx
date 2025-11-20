'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BookOpen, Plus, Check } from 'lucide-react'
import { VideoNote, Notebook } from '@/types/notes'
import { useNotebooks } from '@/hooks/useNotebooks'

interface AddToNotebookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notes: VideoNote[]
  mode: 'single' | 'batch'
  onSuccess?: () => void
}

export function AddToNotebookDialog({ 
  open, 
  onOpenChange, 
  notes, 
  mode,
  onSuccess 
}: AddToNotebookDialogProps) {
  const { notebooks, loading, addNoteToNotebook, batchAddNotesToNotebook } = useNotebooks()
  const [selectedNotebookId, setSelectedNotebookId] = useState<string>('')
  const [isAdding, setIsAdding] = useState(false)

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedNotebookId('')
    }
  }, [open])

  const handleAddToNotebook = async () => {
    if (!selectedNotebookId) return

    setIsAdding(true)
    try {
      if (mode === 'single' && notes.length === 1) {
        await addNoteToNotebook(selectedNotebookId, notes[0].id)
      } else {
        await batchAddNotesToNotebook(selectedNotebookId, notes.map(note => note.id))
      }
      
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to add notes to notebook:', error)
    } finally {
      setIsAdding(false)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Add to Notebook
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Notes Summary */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">
              {mode === 'single' ? 'Note to add:' : `${notes.length} notes to add:`}
            </p>
            <ScrollArea className="h-20 w-full">
              <div className="space-y-1">
                {notes.map((note) => (
                  <div key={note.id} className="text-xs text-muted-foreground truncate">
                    • {note.title}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Notebook Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Notebook:</label>
            <Select value={selectedNotebookId} onValueChange={setSelectedNotebookId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a notebook..." />
              </SelectTrigger>
              <SelectContent>
                {notebooks.map((notebook) => (
                  <SelectItem key={notebook.id} value={notebook.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getNotebookColor(notebook.color)}`} />
                      <span className="flex-1">{notebook.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {notebook.noteCount || 0}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Create New Notebook Hint */}
          <div className="text-xs text-muted-foreground">
            Don't see a notebook you like? Create a new one in the Notebooks tab first.
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAdding}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddToNotebook}
            disabled={!selectedNotebookId || isAdding || loading}
          >
            {isAdding ? (
              <div className="w-4 h-4 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add {mode === 'single' ? 'Note' : `${notes.length} Notes`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}