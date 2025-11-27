'use client'

import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'

interface UseAsyncOperationOptions {
  showToast?: boolean
  successMessage?: string
  errorMessage?: string
  retryCount?: number
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

interface AsyncOperationState<T> {
  loading: boolean
  error: string | null
  data: T | null
  lastExecuted: number | null
}

interface AsyncOperationResult<T> extends AsyncOperationState<T> {
  execute: (operation: () => Promise<T>) => Promise<T | null>
  reset: () => void
  retry: () => Promise<T | null>
  isIdle: boolean
  isSuccess: boolean
  isError: boolean
}

export function useAsyncOperation<T = any>(
  options: UseAsyncOperationOptions = {}
): AsyncOperationResult<T> {
  const {
    showToast = true,
    successMessage = 'Operation completed successfully',
    errorMessage = 'An error occurred',
    retryCount = 3,
    onSuccess,
    onError
  } = options

  const [state, setState] = useState<AsyncOperationState<T>>({
    loading: false,
    error: null,
    data: null,
    lastExecuted: null
  })

  const operationRef = useRef<(() => Promise<T>) | null>(null)
  const retryCountRef = useRef(0)

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    operationRef.current = operation
    
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await operation()
      
      setState({
        loading: false,
        error: null,
        data: result,
        lastExecuted: Date.now()
      })
      
      retryCountRef.current = 0
      
      if (showToast) {
        toast.success(successMessage)
      }
      
      onSuccess?.(result)
      
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }))
      
      if (showToast) {
        toast.error(errorMessage)
      }
      
      onError?.(error)
      
      throw error
    }
  }, [showToast, successMessage, errorMessage, onSuccess, onError])

  const retry = useCallback(async (): Promise<T | null> => {
    if (!operationRef.current || retryCountRef.current >= retryCount) {
      return null
    }
    
    retryCountRef.current++
    
    if (showToast) {
      toast.info(`Retrying... (${retryCountRef.current}/${retryCount})`)
    }
    
    return execute(operationRef.current)
  }, [execute, showToast, retryCount])

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      data: null,
      lastExecuted: null
    })
    retryCountRef.current = 0
    operationRef.current = null
  }, [])

  return {
    ...state,
    execute,
    reset,
    retry,
    isIdle: !state.loading && !state.error && state.data === null,
    isSuccess: !state.loading && !state.error && state.data !== null,
    isError: !state.loading && state.error !== null
  }
}

// Hook for managing multiple async operations
export function useAsyncOperations<T = any>(initialOperations: Record<string, () => Promise<T>> = {}) {
  const [operations, setOperations] = useState<Record<string, AsyncOperationResult<T>>>(
    Object.keys(initialOperations).reduce((acc, key) => {
      acc[key] = useAsyncOperation()
      return acc
    }, {} as Record<string, AsyncOperationResult<T>>)
  )

  const executeOperation = useCallback(async (key: string, operation?: () => Promise<T>) => {
    const op = operations[key]
    if (!op) {
      throw new Error(`Operation "${key}" not found`)
    }
    
    const operationToExecute = operation || initialOperations[key]
    if (!operationToExecute) {
      throw new Error(`No operation provided for "${key}"`)
    }
    
    return op.execute(operationToExecute)
  }, [operations, initialOperations])

  const resetAll = useCallback(() => {
    Object.values(operations).forEach(op => op.reset())
  }, [operations])

  const isAnyLoading = Object.values(operations).some(op => op.loading)
  const hasAnyError = Object.values(operations).some(op => op.error)

  return {
    operations,
    executeOperation,
    resetAll,
    isAnyLoading,
    hasAnyError
  }
}

// Hook for paginated async operations
export function usePaginatedAsyncOperation<T>(
  fetchPage: (page: number, limit: number) => Promise<{ data: T[]; total: number; hasMore: boolean }>,
  options: UseAsyncOperationOptions = {}
) {
  const [page, setPage] = useState(1)
  const [data, setData] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const limit = 20

  const asyncOperation = useAsyncOperation<{
    data: T[]
    total: number
    hasMore: boolean
  }>(options)

  const loadPage = useCallback(async (pageNum: number = page, append: boolean = false) => {
    try {
      const result = await asyncOperation.execute(() => fetchPage(pageNum, limit))
      
      if (result) {
        setData(prev => append ? [...prev, ...result.data] : result.data)
        setTotal(result.total)
        setHasMore(result.hasMore)
        setPage(pageNum)
      }
      
      return result
    } catch (error) {
      console.error('Failed to load page:', error)
      return null
    }
  }, [page, fetchPage, asyncOperation])

  const loadMore = useCallback(() => {
    if (hasMore && !asyncOperation.loading) {
      return loadPage(page + 1, true)
    }
  }, [hasMore, asyncOperation.loading, page, loadPage])

  const reset = useCallback(() => {
    setData([])
    setPage(1)
    setTotal(0)
    setHasMore(true)
    asyncOperation.reset()
  }, [asyncOperation])

  return {
    ...asyncOperation,
    data,
    total,
    hasMore,
    page,
    loadPage,
    loadMore,
    reset
  }
}