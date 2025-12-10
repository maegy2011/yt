'use client'

import React from 'react'
import { toast } from 'sonner'
import { AppError, ErrorUtils, ValidationError, AuthenticationError, AuthorizationError, DatabaseError, FileUploadError, YouTubeApiError, RateLimitError } from '@/lib/errors'

export interface ToastOptions {
  duration?: number
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'
  dismissible?: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

// Toast notification system for errors
export class ErrorToast {
  // Show success message
  static success(message: string, options?: ToastOptions) {
    return toast.success(message, {
      duration: options?.duration || 3000,
      position: options?.position || 'bottom-right',
      dismissible: options?.dismissible !== false,
      action: options?.action
    })
  }

  // Show error message
  static error(error: Error | string, options?: ToastOptions) {
    let message: string
    let details: string | undefined

    if (error instanceof AppError) {
      message = error.message
      details = process.env.NODE_ENV === 'development' ? error.code : undefined
    } else if (typeof error === 'string') {
      message = error
    } else {
      message = 'An unexpected error occurred'
      details = process.env.NODE_ENV === 'development' ? error.message : undefined
    }

    return toast.error(message, {
      description: details,
      duration: options?.duration || 5000,
      position: options?.position || 'bottom-right',
      dismissible: options?.dismissible !== false,
      action: options?.action
    })
  }

  // Show warning message
  static warning(message: string, options?: ToastOptions) {
    return toast.warning(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'bottom-right',
      dismissible: options?.dismissible !== false,
      action: options?.action
    })
  }

  // Show info message
  static info(message: string, options?: ToastOptions) {
    return toast.info(message, {
      duration: options?.duration || 3000,
      position: options?.position || 'bottom-right',
      dismissible: options?.dismissible !== false,
      action: options?.action
    })
  }

  // Show loading message
  static loading(message: string, options?: ToastOptions) {
    return toast.loading(message, {
      position: options?.position || 'bottom-right'
    })
  }

  // Dismiss toast by ID
  static dismiss(id: string | number) {
    toast.dismiss(id)
  }

  // Dismiss all toasts
  static dismissAll() {
    toast.dismiss()
  }
}

// Specific error type toasts
export const ErrorToasts = {
  // Validation errors
  validation: (error: ValidationError, options?: ToastOptions) => {
    return ErrorToast.error(error, {
      ...options,
      action: {
        label: 'Fix Issues',
        onClick: () => {
          // Focus on first invalid field if available
          const firstField = error.context?.issues?.[0]?.field
          if (firstField) {
            const element = document.querySelector(`[name="${firstField}"]`) as HTMLElement
            element?.focus()
          }
        }
      }
    })
  },

  // Network errors
  network: (error: Error, options?: ToastOptions) => {
    return ErrorToast.error('Network connection failed', {
      ...options,
      action: {
        label: 'Retry',
        onClick: () => window.location.reload()
      }
    })
  },

  // Authentication errors
  auth: (error: AuthenticationError, options?: ToastOptions) => {
    return ErrorToast.error(error, {
      ...options,
      action: {
        label: 'Sign In',
        onClick: () => {
          window.location.href = '/auth/signin'
        }
      }
    })
  },

  // Permission errors
  permission: (error: AuthorizationError, options?: ToastOptions) => {
    return ErrorToast.error(error, {
      ...options,
      action: {
        label: 'Go Back',
        onClick: () => window.history.back()
      }
    })
  },

  // Database errors
  database: (error: DatabaseError, options?: ToastOptions) => {
    return ErrorToast.error('Database operation failed', {
      ...options,
      duration: 6000, // Longer duration for database errors
      action: {
        label: 'Report Issue',
        onClick: () => {
          // Open support ticket or feedback form
          window.open('/support', '_blank')
        }
      }
    })
  },

  // File upload errors
  fileUpload: (error: FileUploadError, options?: ToastOptions) => {
    return ErrorToast.error(error, {
      ...options,
      action: {
        label: 'Choose Another File',
        onClick: () => {
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
          fileInput?.click()
        }
      }
    })
  },

  // YouTube API errors
  youtubeApi: (error: YouTubeApiError, options?: ToastOptions) => {
    return ErrorToast.error(error, {
      ...options,
      duration: 6000,
      action: {
        label: 'Try Again',
        onClick: () => {
          // Retry the last YouTube API request
          window.location.reload()
        }
      }
    })
  },

  // Rate limit errors
  rateLimit: (error: RateLimitError, options?: ToastOptions) => {
    return ErrorToast.error('Too many requests. Please try again later.', {
      ...options,
      duration: 10000, // Longer duration for rate limit
      action: {
        label: 'Learn More',
        onClick: () => {
          window.open('/docs/rate-limits', '_blank')
        }
      }
    })
  }
}

// Hook for error handling with toasts
export function useErrorToast() {
  const showError = React.useCallback((error: Error | string, options?: ToastOptions) => {
    ErrorToast.error(error, options)
  }, [])

  const showSuccess = React.useCallback((message: string, options?: ToastOptions) => {
    ErrorToast.success(message, options)
  }, [])

  const showWarning = React.useCallback((message: string, options?: ToastOptions) => {
    ErrorToast.warning(message, options)
  }, [])

  const showInfo = React.useCallback((message: string, options?: ToastOptions) => {
    ErrorToast.info(message, options)
  }, [])

  const showLoading = React.useCallback((message: string, options?: ToastOptions) => {
    return ErrorToast.loading(message, options)
  }, [])

  // Handle API errors with appropriate toast
  const handleApiError = React.useCallback((error: unknown, options?: ToastOptions) => {
    const appError = ErrorUtils.normalizeError(error)
    
    // Log the error
    ErrorUtils.logError(appError, { showToast: true })

    // Show appropriate toast based on error type
    if (appError instanceof ValidationError) {
      ErrorToasts.validation(appError, options)
    } else if (appError instanceof AuthenticationError) {
      ErrorToasts.auth(appError, options)
    } else if (appError instanceof AuthorizationError) {
      ErrorToasts.permission(appError, options)
    } else if (appError instanceof DatabaseError) {
      ErrorToasts.database(appError, options)
    } else if (appError instanceof FileUploadError) {
      ErrorToasts.fileUpload(appError, options)
    } else if (appError instanceof YouTubeApiError) {
      ErrorToasts.youtubeApi(appError, options)
    } else if (appError instanceof RateLimitError) {
      ErrorToasts.rateLimit(appError, options)
    } else {
      ErrorToast.error(appError, options)
    }
  }, [])

  return {
    showError,
    showSuccess,
    showWarning,
    showInfo,
    showLoading,
    handleApiError
  }
}