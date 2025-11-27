'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { ERROR_FALLBACKS, ErrorUtils } from '@/lib/errors'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showRetry?: boolean
  showHome?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorType: keyof typeof ERROR_FALLBACKS
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'GENERIC'
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Determine error type based on error properties
    let errorType: keyof typeof ERROR_FALLBACKS = 'GENERIC'

    if (error.message.includes('Network') || error.message.includes('fetch')) {
      errorType = 'NETWORK'
    } else if (error.message.includes('404') || error.message.includes('not found')) {
      errorType = 'NOT_FOUND'
    } else if (error.message.includes('403') || error.message.includes('unauthorized')) {
      errorType = 'PERMISSION'
    }

    return {
      hasError: true,
      error,
      errorType
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to error reporting service
    ErrorUtils.logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'GENERIC'
    })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // If custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      const fallback = ERROR_FALLBACKS[this.state.errorType]
      
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">{fallback.title}</CardTitle>
              <CardDescription>{fallback.message}</CardDescription>
            </CardHeader>
            
            <CardContent className="text-center">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 p-3 bg-muted rounded-md text-xs font-mono overflow-auto max-h-32">
                    <div className="text-red-600 font-semibold">Error:</div>
                    <div>{this.state.error.message}</div>
                    {this.state.errorInfo && (
                      <>
                        <div className="text-red-600 font-semibold mt-2">Component Stack:</div>
                        <pre className="whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
            
            <CardFooter className="flex gap-2 justify-center">
              {this.props.showRetry !== false && (
                <Button onClick={this.handleRetry} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              )}
              {this.props.showHome !== false && (
                <Button onClick={this.handleGoHome} size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  {fallback.action}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    ErrorUtils.logError(error, { useErrorHandler: true })
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}

// Error fallback component for specific error types
interface ErrorFallbackProps {
  error?: Error
  resetError?: () => void
  type?: keyof typeof ERROR_FALLBACKS
  customMessage?: string
}

export function ErrorFallback({ 
  error, 
  resetError, 
  type = 'GENERIC', 
  customMessage 
}: ErrorFallbackProps) {
  const fallback = ERROR_FALLBACKS[type]
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-xl">
          {customMessage || fallback.title}
        </CardTitle>
        <CardDescription>
          {customMessage || fallback.message}
        </CardDescription>
      </CardHeader>
      
      <CardFooter className="flex gap-2 justify-center">
        {resetError && (
          <Button onClick={resetError} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
        <Button onClick={() => window.location.href = '/'} size="sm">
          <Home className="h-4 w-4 mr-2" />
          {fallback.action}
        </Button>
      </CardFooter>
    </Card>
  )
}

// HOC to wrap components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}