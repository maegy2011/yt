'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react'

interface LoadingErrorProps {
  isLoading: boolean
  error?: string | null
  onRetry?: () => void
  loadingText?: string
  errorTitle?: string
  children: React.ReactNode
  className?: string
}

export function LoadingError({
  isLoading,
  error,
  onRetry,
  loadingText = 'Loading...',
  errorTitle = 'Error',
  children,
  className = ''
}: LoadingErrorProps) {
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{loadingText}</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>{errorTitle}:</strong> {error}
              </div>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="ml-4"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return <>{children}</>
}

// HOC to wrap components with loading and error handling
export function withLoadingError<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    loadingProp?: string
    errorProp?: string
    onRetryProp?: string
    loadingText?: string
    errorTitle?: string
  } = {}
) {
  const {
    loadingProp = 'isLoading',
    errorProp = 'error',
    onRetryProp = 'onRetry',
    loadingText = 'Loading...',
    errorTitle = 'Error'
  } = options

  return function WithLoadingErrorComponent(props: P) {
    const isLoading = props[loadingProp as keyof P] as boolean
    const error = props[errorProp as keyof P] as string | null | undefined
    const onRetry = props[onRetryProp as keyof P] as (() => void) | undefined

    return (
      <LoadingError
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        loadingText={loadingText}
        errorTitle={errorTitle}
      >
        <Component {...props} />
      </LoadingError>
    )
  }
}

// Hook for managing loading and error states
export function useLoadingError<T extends any[] = []>(
  asyncFn: (...args: T) => Promise<any>,
  options: {
    immediate?: boolean
    onSuccess?: (data: any) => void
    onError?: (error: Error) => void
  } = {}
) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<any>(null)

  const execute = React.useCallback(
    async (...args: T) => {
      try {
        setIsLoading(true)
        setError(null)
        
        const result = await asyncFn(...args)
        setData(result)
        
        if (options.onSuccess) {
          options.onSuccess(result)
        }
        
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        
        if (options.onError) {
          options.onError(err instanceof Error ? err : new Error(errorMessage))
        }
        
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [asyncFn, options.onSuccess, options.onError]
  )

  const reset = React.useCallback(() => {
    setError(null)
    setData(null)
    setIsLoading(false)
  }, [])

  // Execute immediately if requested
  React.useEffect(() => {
    if (options.immediate) {
      execute()
    }
  }, [options.immediate, execute])

  return {
    isLoading,
    error,
    data,
    execute,
    reset
  }
}

export default LoadingError