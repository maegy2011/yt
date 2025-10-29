'use client'

import React, { createContext, useContext, useCallback, useState, ReactNode } from 'react'
import { toast } from 'sonner'

interface ApiError {
  message: string
  status?: number
  endpoint?: string
  timestamp: number
}

interface ApiErrorContextType {
  errors: ApiError[]
  addError: (error: ApiError) => void
  clearErrors: () => void
  clearOldErrors: () => void
  retryLastFailedRequest: () => void
}

const ApiErrorContext = createContext<ApiErrorContextType | undefined>(undefined)

interface ApiErrorProviderProps {
  children: ReactNode
}

export function ApiErrorProvider({ children }: ApiErrorProviderProps) {
  const [errors, setErrors] = useState<ApiError[]>([])
  const [lastFailedRequest, setLastFailedRequest] = useState<{
    url: string
    options: RequestInit
  } | null>(null)

  const addError = useCallback((error: ApiError) => {
    setErrors(prev => [...prev, error].slice(-10)) // Keep only last 10 errors
    
    // Show toast notification for user feedback
    toast.error(`API Error: ${error.message}`, {
      description: error.endpoint ? `Failed to load ${error.endpoint}` : undefined,
      action: error.status === 500 ? {
        label: 'Retry',
        onClick: () => retryLastFailedRequest()
      } : undefined
    })
  }, [])

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  const clearOldErrors = useCallback(() => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    setErrors(prev => prev.filter(error => error.timestamp > fiveMinutesAgo))
  }, [])

  const retryLastFailedRequest = useCallback(async () => {
    if (!lastFailedRequest) return

    try {
      const response = await fetch(lastFailedRequest.url, lastFailedRequest.options)
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }
      toast.success('Request succeeded on retry')
      setLastFailedRequest(null)
    } catch (error) {
      addError({
        message: error instanceof Error ? error.message : 'Retry failed',
        endpoint: lastFailedRequest.url,
        timestamp: Date.now()
      })
    }
  }, [lastFailedRequest, addError])

  // Auto-clear old errors every minute
  React.useEffect(() => {
    const interval = setInterval(clearOldErrors, 60000)
    return () => clearInterval(interval)
  }, [clearOldErrors])

  const value: ApiErrorContextType = {
    errors,
    addError,
    clearErrors,
    clearOldErrors,
    retryLastFailedRequest
  }

  return (
    <ApiErrorContext.Provider value={value}>
      {children}
    </ApiErrorContext.Provider>
  )
}

export function useApiError() {
  const context = useContext(ApiErrorContext)
  if (context === undefined) {
    throw new Error('useApiError must be used within an ApiErrorProvider')
  }
  return context
}

// Enhanced fetch wrapper with error handling
export function safeFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }).catch(error => {
    // Log the error but don't throw to prevent unhandled promise rejections
    console.error('Network error:', error)
    throw new Error(`Network error: ${error.message}`)
  })
}

// API request wrapper with automatic error handling
export async function apiRequest<T = any>(
  url: string, 
  options: RequestInit = {},
  errorHandler?: (error: ApiError) => void
): Promise<T | null> {
  try {
    const response = await safeFetch(url, options)
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    // Handle empty responses
    const text = await response.text()
    if (!text.trim()) {
      return null
    }

    try {
      return JSON.parse(text)
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Response text:', text.substring(0, 200))
      throw new Error('Invalid JSON response from server')
    }
  } catch (error) {
    const apiError: ApiError = {
      message: error instanceof Error ? error.message : 'Unknown error',
      status: error instanceof Error && 'status' in error ? (error as any).status : undefined,
      endpoint: url,
      timestamp: Date.now()
    }

    if (errorHandler) {
      errorHandler(apiError)
    } else {
      console.error('API request failed:', apiError)
    }

    return null
  }
}