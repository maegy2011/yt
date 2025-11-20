'use client'

import { useState, useCallback } from 'react'
import { NotebookList } from './NotebookList'
import { NotebookEditor } from './NotebookEditor'
import { Notebook, CreateNotebookRequest, UpdateNotebookRequest } from '@/types/notes'
import { useNotebooks } from '@/hooks/useNotebooks'
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

interface NotebooksContainerProps {
  onNotebookSelect?: (notebook: Notebook) => void
  onAddNoteToNotebook?: (notebook: Notebook) => void
  className?: string
}

export function NotebooksContainer({ 
  onNotebookSelect, 
  onAddNoteToNotebook,
  className = '' 
}: NotebooksContainerProps) {
  const {
    notebooks,
    loading,
    error,
    createNotebook,
    updateNotebook,
    deleteNotebook,
    fetchNotebooks
  } = useNotebooks()

  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingNotebook, setEditingNotebook] = useState<Notebook | undefined>()
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create')
  const [deletingNotebook, setDeletingNotebook] = useState<Notebook | null>()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | 'updatedAt' | 'noteCount'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterBy, setFilterBy] = useState<'all' | 'public' | 'private'>('all')

  const handleCreateNew = useCallback(() => {
    setEditingNotebook(undefined)
    setEditorMode('create')
    setIsEditorOpen(true)
  }, [])

  const handleEdit = useCallback((notebook: Notebook) => {
    setEditingNotebook(notebook)
    setEditorMode('edit')
    setIsEditorOpen(true)
  }, [])

  const handleDelete = useCallback((notebook: Notebook) => {
    setDeletingNotebook(notebook)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingNotebook) return

    try {
      await deleteNotebook(deletingNotebook.id)
      await fetchNotebooks()
    } catch (error) {
      console.error('Failed to delete notebook:', error)
    } finally {
      setDeletingNotebook(null)
    }
  }, [deletingNotebook, deleteNotebook, fetchNotebooks])

  const handleSelect = useCallback((notebook: Notebook) => {
    if (onNotebookSelect) {
      onNotebookSelect(notebook)
    }
  }, [onNotebookSelect])

  const handleToggleVisibility = useCallback(async (notebook: Notebook) => {
    try {
      await updateNotebook(notebook.id, { isPublic: !notebook.isPublic })
      await fetchNotebooks()
    } catch (error) {
      console.error('Failed to toggle notebook visibility:', error)
    }
  }, [updateNotebook, fetchNotebooks])

  const handleAddNote = useCallback((notebook: Notebook) => {
    if (onAddNoteToNotebook) {
      onAddNoteToNotebook(notebook)
    }
  }, [onAddNoteToNotebook])

  const handleSave = useCallback(async (data: CreateNotebookRequest | { id: string; data: UpdateNotebookRequest }) => {
    try {
      if ('id' in data) {
        // Update existing notebook
        await updateNotebook(data.id, data.data)
      } else {
        // Create new notebook
        await createNotebook(data)
      }
      await fetchNotebooks()
    } catch (error) {
      console.error('Failed to save notebook:', error)
      throw error
    }
  }, [createNotebook, updateNotebook, fetchNotebooks])

  const handleRefresh = useCallback(async () => {
    try {
      await fetchNotebooks()
    } catch (error) {
      console.error('Failed to refresh notebooks:', error)
    }
  }, [fetchNotebooks])

  const handleSortChange = useCallback((newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy as any)
    setSortOrder(newSortOrder)
  }, [])

  const handleFilterChange = useCallback((newFilter: 'all' | 'public' | 'private') => {
    setFilterBy(newFilter)
  }, [])

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Notebooks List */}
      <NotebookList
        notebooks={notebooks}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateNew={handleCreateNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSelect={handleSelect}
        onToggleVisibility={handleToggleVisibility}
        onAddNote={handleAddNote}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        filterBy={filterBy}
        onFilterChange={handleFilterChange}
        className="flex-1"
      />

      {/* Notebook Editor */}
      <NotebookEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSave}
        notebook={editingNotebook}
        mode={editorMode}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingNotebook} onOpenChange={() => setDeletingNotebook(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notebook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingNotebook?.title}"? 
              This action cannot be undone and all notes in this notebook will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}