'use client'

import React from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import { ErrorToast } from '@/lib/error-toast'

interface GlobalErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function GlobalErrorBoundary({ children, fallback }: GlobalErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Show toast notification for global errors
    ErrorToast.error('An unexpected error occurred', {
      duration: 5000,
      action: {
        label: 'Report Issue',
        onClick: () => {
          // Open support ticket or feedback form
          window.open('/support', '_blank')
        }
      }
    })

    // In production, send error to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error monitoring service (Sentry, etc.)
      // Console removed - Global Error Boundary caught error in production
    }
  }

  return (
    <ErrorBoundary
      fallback={fallback}
      onError={handleError}
      showRetry={true}
      showHome={true}
    >
      {children}
    </ErrorBoundary>
  )
}

// Error boundary specifically for API errors
export function ApiErrorBoundary({ children }: { children: React.ReactNode }) {
  const fallback = (
    <div className="p-4 text-center">
      <h3 className="text-lg font-semibold text-destructive mb-2">
        API Error
      </h3>
      <p className="text-muted-foreground mb-4">
        Failed to communicate with the server. Please check your connection and try again.
      </p>
    </div>
  )

  return (
    <ErrorBoundary
      fallback={fallback}
      showRetry={true}
      showHome={false}
    >
      {children}
    </ErrorBoundary>
  )
}

// Error boundary for form components
export function FormErrorBoundary({ children }: { children: React.ReactNode }) {
  const fallback = (
    <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
      <h3 className="text-lg font-semibold text-destructive mb-2">
        Form Error
      </h3>
      <p className="text-muted-foreground mb-4">
        There was an error with the form. Please refresh the page and try again.
      </p>
    </div>
  )

  return (
    <ErrorBoundary
      fallback={fallback}
      showRetry={true}
      showHome={false}
    >
      {children}
    </ErrorBoundary>
  )
}