// Enhanced types for advanced notes and favorites features

export interface Notebook {
  id: string
  title: string
  description?: string
  color: string
  isPublic: boolean
  tags: string
  createdAt: string
  updatedAt: string
  notes?: VideoNote[]
  noteCount?: number
}

export interface VideoNote {
  id: string
  videoId: string
  title: string
  channelName: string
  thumbnail?: string
  note: string
  fontSize?: number
  startTime?: number
  endTime?: number
  isClip?: boolean
  isPrivate?: boolean
  tags?: string[]
  color?: string
  priority?: 'low' | 'medium' | 'high'
  notebookId?: string
  createdAt: string
  updatedAt: string
}

export interface CreateNoteRequest {
  videoId: string
  title: string
  channelName: string
  thumbnail?: string
  note: string
  fontSize?: number
  startTime?: number
  endTime?: number
  isClip?: boolean
  isPrivate?: boolean
  tags?: string[]
  color?: string
  priority?: 'low' | 'medium' | 'high'
  notebookId?: string
}

export interface CreateNotebookRequest {
  title: string
  description?: string
  color?: string
  isPublic?: boolean
  tags?: string
}

export interface UpdateNotebookRequest {
  title?: string
  description?: string
  color?: string
  isPublic?: boolean
  tags?: string
}

export interface UpdateNoteRequest {
  note: string
  title?: string
  fontSize?: number
  isPrivate?: boolean
  tags?: string[]
  color?: string
  priority?: 'low' | 'medium' | 'high'
}

export interface NoteFilters {
  searchQuery?: string
  videoId?: string
  isClip?: boolean
  isPrivate?: boolean
  tags?: string[]
  color?: string
  priority?: 'low' | 'medium' | 'high'
  dateRange?: {
    start: string
    end: string
  }
}

export interface NoteSortOptions {
  field: 'createdAt' | 'updatedAt' | 'title' | 'startTime' | 'priority' | 'color'
  direction: 'asc' | 'desc'
}

export interface NotesState {
  notes: VideoNote[]
  loading: boolean
  error: string | null
  filters: NoteFilters
  sort: NoteSortOptions
  viewMode: 'grid' | 'list' | 'compact'
  displaySettings: {
    showThumbnails: boolean
    showTimestamps: boolean
    showTags: boolean
    showPriority: boolean
    compactMode: boolean
  }
}

export interface NoteOperations {
  createNote: (data: CreateNoteRequest) => Promise<VideoNote>
  updateNote: (id: string, data: UpdateNoteRequest) => Promise<VideoNote>
  deleteNote: (id: string) => Promise<void>
  fetchNotes: (filters?: NoteFilters) => Promise<VideoNote[]>
  searchNotes: (query: string) => Promise<VideoNote[]>
  batchDeleteNotes: (ids: string[]) => Promise<void>
  exportNotes: (format: 'json' | 'csv' | 'txt') => Promise<string>
  importNotes: (data: string) => Promise<VideoNote[]>
}

export interface NotebookOperations {
  createNotebook: (data: CreateNotebookRequest) => Promise<Notebook>
  updateNotebook: (id: string, data: UpdateNotebookRequest) => Promise<Notebook>
  deleteNotebook: (id: string) => Promise<void>
  fetchNotebooks: () => Promise<Notebook[]>
  fetchNotebook: (id: string) => Promise<Notebook | null>
  addNoteToNotebook: (notebookId: string, noteId: string) => Promise<void>
  removeNoteFromNotebook: (noteId: string) => Promise<void>
  getNotebookNotes: (notebookId: string) => Promise<VideoNote[]>
}

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