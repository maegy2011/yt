'use client'

import { useState, useCallback } from 'react'
import { NoteList } from './NoteList'
import { NoteEditor } from './NoteEditor'
import { VideoNote, CreateNoteRequest, UpdateNoteRequest } from '@/types/notes'
import { useNotes } from '@/hooks/useNotes'
import { useBackgroundPlayer } from '@/contexts/background-player-context'

interface NotesContainerProps {
  videoData?: {
    videoId: string
    title: string
    channelName: string
    thumbnail?: string
  }
  className?: string
}

export function NotesContainer({ videoData, className = '' }: NotesContainerProps) {
  const {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    fetchNotes
  } = useNotes()

  const {
    backgroundVideo,
    playBackgroundVideo,
    seekTo
  } = useBackgroundPlayer()

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
    if (note.videoId === backgroundVideo?.videoId) {
      // If it's the same video, just seek to the start time
      if (note.startTime !== undefined) {
        seekTo(note.startTime)
      }
    } else {
      // If it's a different video, we'd need to load it first
      // For now, just show a message or handle accordingly
      console.log('Playing different video:', note.videoId)
    }
  }, [backgroundVideo, seekTo])

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

  const getContainerClasses = () => {
    const baseClasses = 'w-full h-full'
    return `${baseClasses} ${className}`
  }

  return (
    <div className={getContainerClasses()}>
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
    </div>
  )
}