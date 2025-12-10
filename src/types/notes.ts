// Enhanced types for advanced notes and favorites features
// This file now re-exports from the unified type system

// Re-export all note-related types from the unified system
export type {
  VideoNote,
  Notebook,
  CreateNoteRequest,
  UpdateNoteRequest,
  NoteFilters,
  NoteSortOptions,
  NotesState,
  NoteOperations,
  CreateNotebookRequest,
  UpdateNotebookRequest,
  NotebookOperations
} from '@/types'

// Additional types specific to notes features
export interface NoteStats {
  total: number
  clips: number
  regularNotes: number
  privateNotes: number
  publicNotes: number
  priorityStats: {
    low: number
    medium: number
    high: number
  }
  colorStats: Record<string, number>
  tagStats: Record<string, number>
  totalDuration: number
  averageNoteLength: number
}

export interface NoteTemplate {
  id: string
  name: string
  template: string
  isDefault: boolean
  tags?: string[]
  color?: string
  priority?: 'low' | 'medium' | 'high'
}

export interface NoteCategory {
  id: string
  name: string
  description?: string
  color: string
  noteIds: string[]
  createdAt: string
}