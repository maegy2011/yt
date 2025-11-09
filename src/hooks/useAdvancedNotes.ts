'use client'

import { useState, useCallback, useEffect } from 'react'
import { VideoNote, CreateNoteRequest, UpdateNoteRequest, NotesState, NoteOperations, NoteFilters, NoteSortOptions, NoteStats, NoteTemplate } from '@/types/notes'

const defaultFilters: NoteFilters = {}
const defaultSort: NoteSortOptions = { field: 'createdAt', direction: 'desc' }

// Default note templates
const defaultTemplates: NoteTemplate[] = [
  {
    id: '1',
    name: 'Important Point',
    template: 'Key insight: {note}',
    isDefault: true,
    tags: ['important', 'key-point'],
    color: '#ef4444',
    priority: 'high' as const
  },
  {
    id: '2',
    name: 'Question',
    template: 'Question: {note}',
    isDefault: true,
    tags: ['question', 'research'],
    color: '#3b82f6',
    priority: 'medium' as const
  },
  {
    id: '3',
    name: 'Action Item',
    template: 'Action: {note}',
    isDefault: true,
    tags: ['action', 'todo'],
    color: '#10b981',
    priority: 'high' as const
  },
  {
    id: '4',
    name: 'General Note',
    template: '{note}',
    isDefault: true,
    tags: ['general'],
    color: '#6b7280',
    priority: 'medium' as const
  }
]

// Color options for notes
const colorOptions = [
  { name: 'Red', value: '#ef4444', bg: 'bg-red-100', border: 'border-red-200' },
  { name: 'Light Gray', value: '#9ca3af', bg: 'bg-muted', border: 'border-border' },
  { name: 'Dark Gray', value: '#374151', bg: 'bg-muted', border: 'border-border' },
  { name: 'Yellow', value: '#f59e0b', bg: 'bg-yellow-100', border: 'border-yellow-200' },
  { name: 'Purple', value: '#8b5cf6', bg: 'bg-purple-100', border: 'border-purple-200' },
  { name: 'Pink', value: '#ec4899', bg: 'bg-pink-100', border: 'border-pink-200' },
  { name: 'Medium Gray', value: '#6b7280', bg: 'bg-muted', border: 'border-border' },
  { name: 'Indigo', value: '#6366f1', bg: 'bg-indigo-100', border: 'border-indigo-200' }
]

export function useAdvancedNotes(): NotesState & NoteOperations & {
  stats: NoteStats
  templates: NoteTemplate[]
  colors: typeof colorOptions
  addTemplate: (template: Omit<NoteTemplate, 'id'>) => void
  removeTemplate: (id: string) => void
  updateTemplate: (id: string, template: Partial<NoteTemplate>) => void
} {
  const [notes, setNotes] = useState<VideoNote[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<NoteFilters>(defaultFilters)
  const [sort, setSort] = useState<NoteSortOptions>(defaultSort)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid')
  const [displaySettings, setDisplaySettings] = useState({
    showThumbnails: true,
    showTimestamps: true,
    showTags: true,
    showPriority: true,
    compactMode: false
  })
  const [templates, setTemplates] = useState<NoteTemplate[]>(defaultTemplates)

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
          note.channelName.toLowerCase().includes(searchQuery) ||
          note.tags?.some(tag => tag.toLowerCase().includes(searchQuery))
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
      
      if (customFilters?.isPrivate !== undefined || filters.isPrivate !== undefined) {
        const isPrivate = customFilters?.isPrivate !== undefined ? customFilters.isPrivate : filters.isPrivate
        filteredNotes = filteredNotes.filter((note: VideoNote) => note.isPrivate === isPrivate)
      }
      
      if (customFilters?.tags || filters.tags) {
        const filterTags = customFilters?.tags || filters.tags
        if (filterTags && filterTags.length > 0) {
          filteredNotes = filteredNotes.filter((note: VideoNote) => 
            note.tags?.some(tag => filterTags.includes(tag))
          )
        }
      }
      
      if (customFilters?.color || filters.color) {
        const color = customFilters?.color || filters.color
        filteredNotes = filteredNotes.filter((note: VideoNote) => note.color === color)
      }
      
      if (customFilters?.priority || filters.priority) {
        const priority = customFilters?.priority || filters.priority
        filteredNotes = filteredNotes.filter((note: VideoNote) => note.priority === priority)
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
          return a.title.localeCompare(b.title) * direction
        }
        
        if (field === 'startTime') {
          const timeA = a[field] || 0
          const timeB = b[field] || 0
          return (timeA - timeB) * direction
        }
        
        if (field === 'priority') {
          const priorityOrder = { low: 1, medium: 2, high: 3 }
          const priorityA = priorityOrder[a.priority || 'medium'] || 2
          const priorityB = priorityOrder[b.priority || 'medium'] || 2
          return (priorityA - priorityB) * direction
        }
        
        if (field === 'color') {
          const colorA = a.color || ''
          const colorB = b.color || ''
          return colorA.localeCompare(colorB) * direction
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

  const searchNotes = useCallback(async (query: string): Promise<VideoNote[]> => {
    return fetchNotes({ ...filters, searchQuery: query })
  }, [fetchNotes, filters])

  const batchDeleteNotes = useCallback(async (ids: string[]): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      const promises = ids.map(id => 
        fetch(`/api/notes/${id}`, { method: 'DELETE' })
      )
      
      const responses = await Promise.all(promises)
      const errors = responses.filter(res => !res.ok)
      
      if (errors.length > 0) {
        throw new Error(`Failed to delete ${errors.length} notes`)
      }
      
      setNotes(prev => prev.filter(note => !ids.includes(note.id)))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to batch delete notes'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const exportNotes = useCallback(async (format: 'json' | 'csv' | 'txt'): Promise<string> => {
    try {
      const response = await fetch(`/api/notes/export?format=${format}`)
      if (!response.ok) {
        throw new Error(`Failed to export notes: ${response.status}`)
      }
      
      return await response.text()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export notes'
      setError(errorMessage)
      throw err
    }
  }, [])

  const importNotes = useCallback(async (data: string): Promise<VideoNote[]> => {
    try {
      const response = await fetch('/api/notes/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to import notes: ${response.status}`)
      }
      
      const importedNotes = await response.json()
      setNotes(prev => [...importedNotes, ...prev])
      return importedNotes
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import notes'
      setError(errorMessage)
      throw err
    }
  }, [])

  const addTemplate = useCallback((template: Omit<NoteTemplate, 'id'>) => {
    const newTemplate: NoteTemplate = {
      ...template,
      id: Date.now().toString()
    }
    setTemplates(prev => [...prev, newTemplate])
  }, [])

  const removeTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(template => template.id !== id))
  }, [])

  const updateTemplate = useCallback((id: string, template: Partial<NoteTemplate>) => {
    setTemplates(prev => 
      prev.map(t => t.id === id ? { ...t, ...template } : t)
    )
  }, [])

  // Calculate stats
  const stats: NoteStats = {
    total: notes.length,
    clips: notes.filter(note => note.isClip).length,
    regularNotes: notes.filter(note => !note.isClip).length,
    privateNotes: notes.filter(note => note.isPrivate).length,
    publicNotes: notes.filter(note => !note.isPrivate).length,
    priorityStats: {
      low: notes.filter(note => note.priority === 'low').length,
      medium: notes.filter(note => note.priority === 'medium').length,
      high: notes.filter(note => note.priority === 'high').length
    },
    colorStats: notes.reduce((acc, note) => {
      if (note.color) {
        acc[note.color] = (acc[note.color] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>),
    tagStats: notes.reduce((acc, note) => {
      note.tags?.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>),
    totalDuration: notes.reduce((sum, note) => {
      if (note.startTime !== undefined && note.endTime !== undefined) {
        return sum + (note.endTime - note.startTime)
      }
      return sum
    }, 0),
    averageNoteLength: notes.length > 0 
      ? Math.round(notes.reduce((sum, note) => sum + note.note.length, 0) / notes.length)
      : 0
  }

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
    viewMode,
    displaySettings,
    stats,
    templates,
    colors: colorOptions,
    createNote,
    updateNote,
    deleteNote,
    fetchNotes,
    searchNotes,
    batchDeleteNotes,
    exportNotes,
    importNotes,
    addTemplate,
    removeTemplate,
    updateTemplate
  }
}