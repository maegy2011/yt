'use client'

import { useState, useCallback, useEffect } from 'react'
import { VideoNote, CreateNoteRequest, UpdateNoteRequest, NotesState, NoteOperations, NoteFilters, NoteSortOptions } from '@/types/notes'

const defaultFilters: NoteFilters = {}
const defaultSort: NoteSortOptions = { field: 'createdAt', direction: 'desc' }

export function useNotes(): NotesState & NoteOperations {
  const [notes, setNotes] = useState<VideoNote[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<NoteFilters>(defaultFilters)
  const [sort, setSort] = useState<NoteSortOptions>(defaultSort)

  const fetchNotes = useCallback(async (customFilters?: NoteFilters): Promise<VideoNote[]> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/notes')
      if (!response.ok) {
        throw new Error(`Failed to fetch notes: ${response.status} ${response.statusText}`)
      }
      
      const allNotes = await response.json()
      
      // Apply filters
      let filteredNotes = allNotes
      
      if (customFilters?.searchQuery || filters.searchQuery) {
        const searchQuery = (customFilters?.searchQuery || filters.searchQuery)?.toLowerCase() || ''
        filteredNotes = allNotes.filter((note: VideoNote) => 
          note.title.toLowerCase().includes(searchQuery) ||
          note.note.toLowerCase().includes(searchQuery) ||
          note.channelName.toLowerCase().includes(searchQuery)
        )
      }
      
      if (customFilters?.videoId || filters.videoId) {
        const videoId = customFilters?.videoId || filters.videoId
        filteredNotes = filteredNotes.filter((note: VideoNote) => note.videoId === videoId)
      }
      
      if (customFilters?.isClip !== undefined || filters.isClip !== undefined) {
        const isClip = customFilters?.isClip !== undefined ? customFilters.isClip : filters.isClip
        filteredNotes = filteredNotes.filter((note: VideoNote) => note.isClip === isClip)
      }
      
      // Apply sorting
      filteredNotes.sort((a: VideoNote, b: VideoNote) => {
        const field = sort.field
        const direction = sort.direction === 'asc' ? 1 : -1
        
        if (field === 'createdAt' || field === 'updatedAt') {
          const dateA = new Date(a[field]).getTime()
          const dateB = new Date(b[field]).getTime()
          return (dateA - dateB) * direction
        }
        
        if (field === 'title') {
          return a[field].localeCompare(b[field]) * direction
        }
        
        if (field === 'startTime') {
          const timeA = a[field] || 0
          const timeB = b[field] || 0
          return (timeA - timeB) * direction
        }
        
        return 0
      })
      
      setNotes(filteredNotes)
      return filteredNotes
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notes'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [filters, sort])

  const createNote = useCallback(async (data: CreateNoteRequest): Promise<VideoNote> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to create note: ${response.status}`)
      }
      
      const newNote = await response.json()
      setNotes(prev => [newNote, ...prev])
      return newNote
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create note'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateNote = useCallback(async (id: string, data: UpdateNoteRequest): Promise<VideoNote> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to update note: ${response.status}`)
      }
      
      const updatedNote = await response.json()
      setNotes(prev => prev.map(note => note.id === id ? updatedNote : note))
      return updatedNote
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update note'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteNote = useCallback(async (id: string): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to delete note: ${response.status}`)
      }
      
      setNotes(prev => prev.filter(note => note.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete note'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const linkNoteToNotebook = useCallback(async (noteId: string, notebookId: string): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/notes/${noteId}/notebooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notebookId })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to link note to notebook: ${response.status}`)
      }
      
      // Refresh notes to get updated state
      await fetchNotes()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to link note to notebook'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchNotes])

  const unlinkNoteFromNotebook = useCallback(async (noteId: string, notebookId: string): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/notes/${noteId}/notebooks/${notebookId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to unlink note from notebook: ${response.status}`)
      }
      
      // Refresh notes to get updated state
      await fetchNotes()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unlink note from notebook'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchNotes])

  const batchLinkNotesToNotebook = useCallback(async (noteIds: string[], notebookId: string): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/notes/batch/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteIds, notebookId })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to batch link notes: ${response.status}`)
      }
      
      // Refresh notes to get updated state
      await fetchNotes()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to batch link notes'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchNotes])

  const batchUnlinkNotesFromNotebook = useCallback(async (noteIds: string[], notebookId: string): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/notes/batch/unlink', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteIds, notebookId })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to batch unlink notes: ${response.status}`)
      }
      
      // Refresh notes to get updated state
      await fetchNotes()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to batch unlink notes'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchNotes])

  const batchDeleteNotes = useCallback(async (noteIds: string[]): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/notes/batch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteIds })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to batch delete notes: ${response.status}`)
      }
      
      // Refresh notes to get updated state
      await fetchNotes()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to batch delete notes'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchNotes])

  const getNoteNotebooks = useCallback(async (noteId: string): Promise<any[]> => {
    try {
      const response = await fetch(`/api/notes/${noteId}/notebooks`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch note notebooks: ${response.status}`)
      }
      
      const data = await response.json()
      return data.notebooks || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch note notebooks'
      throw new Error(errorMessage)
    }
  }, [])

  const searchNotes = useCallback(async (query: string): Promise<VideoNote[]> => {
    return fetchNotes({ ...filters, searchQuery: query })
  }, [fetchNotes, filters])

  // Load notes on mount
  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  return {
    notes,
    loading,
    error,
    filters,
    sort,
    viewMode: 'grid' as const,
    displaySettings: {
      showThumbnails: true,
      showTimestamps: true,
      showTags: true,
      showPriority: true,
      compactMode: false
    },
    createNote,
    updateNote,
    deleteNote,
    fetchNotes,
    searchNotes,
    batchDeleteNotes,
    exportNotes: async (format) => {
      // Placeholder implementation
      return JSON.stringify(notes, null, 2)
    },
    importNotes: async (data) => {
      // Placeholder implementation
      try {
        const imported = JSON.parse(data)
        setNotes([...notes, ...imported])
        return imported
      } catch {
        return []
      }
    }
  }
}