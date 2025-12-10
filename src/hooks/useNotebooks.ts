'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Notebook, 
  CreateNotebookRequest, 
  UpdateNotebookRequest,
  NotebookOperations 
} from '@/types/notes'

interface UseNotebooksReturn extends NotebookOperations {
  notebooks: Notebook[]
  loading: boolean
  error: string | null
}

export function useNotebooks(): UseNotebooksReturn {
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generic fetch function with error handling
  const fetchWithRetry = async (url: string, options: RequestInit = {}): Promise<Response> => {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return response
    } catch (error) {
      // Console statement removed
      throw error
    }
  }

  // Fetch all notebooks
  const fetchNotebooks = useCallback(async (): Promise<Notebook[]> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetchWithRetry('/api/notebooks')
      const data = await response.json()
      setNotebooks(data.notebooks || [])
      return data.notebooks || []
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notebooks'
      setError(errorMessage)
      // Console statement removed
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch a single notebook
  const fetchNotebook = useCallback(async (id: string): Promise<Notebook | null> => {
    try {
      const response = await fetchWithRetry(`/api/notebooks/${id}`)
      const data = await response.json()
      return data.notebook
    } catch (error) {
      // Console statement removed
      return null
    }
  }, [])

  // Create a new notebook
  const createNotebook = useCallback(async (data: CreateNotebookRequest): Promise<Notebook> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetchWithRetry('/api/notebooks', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      const result = await response.json()
      const newNotebook = result.notebook

      // Update local state
      setNotebooks(prev => [newNotebook, ...prev])
      return newNotebook
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create notebook'
      setError(errorMessage)
      // Console statement removed
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Update an existing notebook
  const updateNotebook = useCallback(async (id: string, data: UpdateNotebookRequest): Promise<Notebook> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetchWithRetry(`/api/notebooks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })

      const result = await response.json()
      const updatedNotebook = result.notebook

      // Update local state
      setNotebooks(prev => 
        prev.map(nb => nb.id === id ? updatedNotebook : nb)
      )
      return updatedNotebook
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update notebook'
      setError(errorMessage)
      // Console statement removed
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Delete a notebook
  const deleteNotebook = useCallback(async (id: string): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      await fetchWithRetry(`/api/notebooks/${id}`, {
        method: 'DELETE',
      })

      // Update local state
      setNotebooks(prev => prev.filter(nb => nb.id !== id))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete notebook'
      setError(errorMessage)
      // Console statement removed
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Add a note to a notebook
  const addNoteToNotebook = useCallback(async (notebookId: string, noteId: string): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      await fetchWithRetry(`/api/notebooks/${notebookId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ noteId }),
      })

      // Refresh notebooks to get updated note counts
      await fetchNotebooks()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add note to notebook'
      setError(errorMessage)
      // Console statement removed
      throw error
    } finally {
      setLoading(false)
    }
  }, [fetchNotebooks])

  // Remove a note from a notebook
  const removeNoteFromNotebook = useCallback(async (noteId: string): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      await fetchWithRetry(`/api/notes/${noteId}/notebook`, {
        method: 'DELETE',
      })

      // Refresh notebooks to get updated note counts
      await fetchNotebooks()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove note from notebook'
      setError(errorMessage)
      // Console statement removed
      throw error
    } finally {
      setLoading(false)
    }
  }, [fetchNotebooks])

  // Get notes for a specific notebook
  const getNotebookNotes = useCallback(async (notebookId: string) => {
    try {
      const response = await fetchWithRetry(`/api/notebooks/${notebookId}/notes`)
      const data = await response.json()
      return data.notes || []
    } catch (error) {
      // Console statement removed
      return []
    }
  }, [])

  // Batch add notes to a notebook
  const batchAddNotesToNotebook = useCallback(async (notebookId: string, noteIds: string[]): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      await fetchWithRetry('/api/notes/batch/link', {
        method: 'POST',
        body: JSON.stringify({ noteIds, notebookId }),
      })

      // Refresh notebooks to get updated note counts
      await fetchNotebooks()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to batch add notes to notebook'
      setError(errorMessage)
      // Console statement removed
      throw error
    } finally {
      setLoading(false)
    }
  }, [fetchNotebooks])

  // Share a notebook
  const shareNotebook = useCallback(async (notebookId: string, method: string, message?: string) => {
    try {
      const response = await fetchWithRetry(`/api/notebooks/${notebookId}/share`, {
        method: 'POST',
        body: JSON.stringify({ method, message }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to share notebook'
      // Console statement removed
      throw new Error(errorMessage)
    }
  }, [])

  // Get share information for a notebook
  const getNotebookShareInfo = useCallback(async (notebookId: string) => {
    try {
      const response = await fetchWithRetry(`/api/notebooks/${notebookId}/share`)
      const data = await response.json()
      return data.shareContent
    } catch (error) {
      // Console statement removed
      return null
    }
  }, [])

  // Load notebooks on mount
  useEffect(() => {
    fetchNotebooks()
  }, [fetchNotebooks])

  return {
    notebooks,
    loading,
    error,
    createNotebook,
    updateNotebook,
    deleteNotebook,
    fetchNotebooks,
    fetchNotebook,
    addNoteToNotebook,
    removeNoteFromNotebook,
    batchAddNotesToNotebook,
    getNotebookNotes,
  }
}