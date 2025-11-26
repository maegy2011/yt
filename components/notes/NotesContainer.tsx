'use client'

import { useState, useCallback } from 'react'
import { NoteList } from './NoteList'
import { NoteEditor } from './NoteEditor'
import { VideoNote, CreateNoteRequest, UpdateNoteRequest } from '@/types/notes'
import { useNotes } from '@/hooks/useNotes'
import { IncognitoWrapper } from '@/components/incognito-wrapper-enhanced'

interface NotesContainerProps {
  videoData?: {
    videoId: string
    title: string
    channelName: string
    thumbnail?: string
  }
  onVideoPlay?: (note: VideoNote) => void
  onAddToNotebook?: (selectedNotes: VideoNote[]) => void
  className?: string
}

export function NotesContainer({ videoData, onVideoPlay, onAddToNotebook, className = '' }: NotesContainerProps) {
  const {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    fetchNotes
  } = useNotes()

  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<VideoNote | undefined>()
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create')

  const handleCreateNew = useCallback(() => {
    setEditingNote(undefined)
    setEditorMode('create')
    setIsEditorOpen(true)
  }, [])

  const handleEdit = useCallback((note: VideoNote) => {
    setEditingNote(note)
    setEditorMode('edit')
    setIsEditorOpen(true)
  }, [])

  const handleDelete = useCallback(async (noteId: string) => {
    try {
      await deleteNote(noteId)
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  }, [deleteNote])

  const handlePlay = useCallback((note: VideoNote) => {
    // Convert VideoNote to Video format for the main app
    const video = {
      videoId: note.videoId,
      id: note.videoId, // Also set id for compatibility
      title: note.title,
      channelName: note.channelName,
      thumbnail: note.thumbnail,
      duration: undefined, // Notes don't have duration
      viewCount: undefined, // Notes don't have view count
      publishedAt: null, // Notes don't have publishedAt
      description: note.note
    }
    
    // Call the parent's onVideoPlay function if provided
    if (onVideoPlay) {
      onVideoPlay(note)
    }
  }, [onVideoPlay])

  const handleSave = useCallback(async (data: CreateNoteRequest | { id: string; data: UpdateNoteRequest }) => {
    try {
      if ('id' in data) {
        // Update existing note
        await updateNote(data.id, data.data)
      } else {
        // Create new note
        await createNote(data)
      }
      await fetchNotes()
    } catch (error) {
      console.error('Failed to save note:', error)
      throw error
    }
  }, [createNote, updateNote, fetchNotes])

  const handleRefresh = useCallback(async () => {
    try {
      await fetchNotes()
    } catch (error) {
      console.error('Failed to refresh notes:', error)
    }
  }, [fetchNotes])

  const getContainerClasses = () => {
    const baseClasses = 'w-full h-full'
    return `${baseClasses} ${className}`
  }

  return (
    <IncognitoWrapper feature="notes" className={getContainerClasses()}>
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Notes List */}
      <NoteList
        notes={notes}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPlay={handlePlay}
        onCreateNew={handleCreateNew}
        onRefresh={handleRefresh}
        onAddToNotebook={onAddToNotebook}
      />

      {/* Note Editor */}
      <NoteEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSave}
        note={editingNote}
        videoData={videoData || {
          videoId: '',
          title: '',
          channelName: '',
          thumbnail: ''
        }}
        mode={editorMode}
      />
    </IncognitoWrapper>
  )
}