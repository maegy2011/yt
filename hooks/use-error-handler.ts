'use client'

import { useCallback, useState, useEffect } from 'react'
import { AppError, ErrorUtils } from '@/lib/errors'
import { useErrorToast } from '@/lib/error-toast'

interface ErrorState {
  error: AppError | null
  isLoading: boolean
  hasError: boolean
}

interface UseErrorOptions {
  showToast?: boolean
  retryCount?: number
  onError?: (error: AppError) => void
  onRetry?: () => void
}

export function useErrorHandler(options: UseErrorOptions = {}) {
  const { 
    showToast = true, 
    retryCount = 3, 
    onError, 
    onRetry 
  } = options
  
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isLoading: false,
    hasError: false
  })
  
  const [retryAttempts, setRetryAttempts] = useState(0)
  const { handleApiError, showError, showSuccess } = useErrorToast()

  // Handle error with logging and toast
  const handleError = useCallback((error: unknown, context?: Record<string, any>) => {
    const appError = ErrorUtils.normalizeError(error)
    
    setErrorState({
      error: appError,
      isLoading: false,
      hasError: true
    })

    // Log error
    ErrorUtils.logError(appError, context)

    // Show toast notification
    if (showToast) {
      handleApiError(appError)
    }

    // Call custom error handler
    if (onError) {
      onError(appError)
    }

    return appError
  }, [showToast, handleApiError, onError])

  // Reset error state
  const resetError = useCallback(() => {
    setErrorState({
      error: null,
      isLoading: false,
      hasError: false
    })
    setRetryAttempts(0)
  }, [])

  // Retry operation
  const retry = useCallback(async (operation: () => Promise<any>) => {
    if (retryAttempts >= retryCount) {
      handleError(new AppError('Maximum retry attempts exceeded', 500, 'MAX_RETRIES_EXCEEDED'))
      return null
    }

    setErrorState(prev => ({ ...prev, isLoading: true, hasError: false }))
    setRetryAttempts(prev => prev + 1)

    try {
      const result = await operation()
      
      setErrorState({
        error: null,
        isLoading: false,
        hasError: false
      })
      
      setRetryAttempts(0)
      
      if (onRetry) {
        onRetry()
      }
      
      if (showToast && retryAttempts > 0) {
        showSuccess('Operation completed successfully')
      }
      
      return result
    } catch (error) {
      return handleError(error, { 
        retryAttempt: retryAttempts + 1,
        maxRetries: retryCount 
      })
    }
  }, [retryAttempts, retryCount, handleError, onRetry, showToast, showSuccess])

  // Execute async operation with error handling
  const executeAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> => {
    setErrorState(prev => ({ ...prev, isLoading: true, hasError: false }))

    try {
      const result = await operation()
      
      setErrorState({
        error: null,
        isLoading: false,
        hasError: false
      })
      
      setRetryAttempts(0)
      
      return result
    } catch (error) {
      handleError(error, context)
      return null
    }
  }, [handleError])

  // Execute synchronous operation with error handling
  const executeSync = useCallback(<T>(
    operation: () => T,
    context?: Record<string, any>
  ): T | null => {
    try {
      const result = operation()
      
      setErrorState({
        error: null,
        isLoading: false,
        hasError: false
      })
      
      setRetryAttempts(0)
      
      return result
    } catch (error) {
      handleError(error, context)
      return null
    }
  }, [handleError])

  // Set loading state manually
  const setLoading = useCallback((loading: boolean) => {
    setErrorState(prev => ({ ...prev, isLoading: loading }))
  }, [])

  return {
    // State
    error: errorState.error,
    isLoading: errorState.isLoading,
    hasError: errorState.hasError,
    retryAttempts,
    
    // Actions
    handleError,
    resetError,
    retry,
    executeAsync,
    executeSync,
    setLoading
  }
}

// Hook for handling form validation errors
export function useFormValidation() {
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  const { handleError } = useErrorHandler({ showToast: false })

  const validateField = useCallback((field: string, value: any, rules: ValidationRule[]) => {
    const errors: string[] = []

    for (const rule of rules) {
      if (!rule.validate(value)) {
        errors.push(rule.message)
      }
    }

    setValidationErrors(prev => ({
      ...prev,
      [field]: errors
    }))

    return errors.length === 0
  }, [])

  const validateForm = useCallback((data: Record<string, any>, schema: ValidationSchema) => {
    const errors: Record<string, string[]> = {}
    let isValid = true

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field]
      const fieldErrors: string[] = []

      for (const rule of rules) {
        if (!rule.validate(value)) {
          fieldErrors.push(rule.message)
        }
      }

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors
        isValid = false
      }
    }

    setValidationErrors(errors)

    if (!isValid) {
      handleError(new AppError('Form validation failed', 400, 'VALIDATION_ERROR', true, { errors }))
    }

    return { isValid, errors }
  }, [handleError])

  const clearFieldError = useCallback((field: string) => {
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  const clearAllErrors = useCallback(() => {
    setValidationErrors({})
  }, [])

  return {
    validationErrors,
    validateField,
    validateForm,
    clearFieldError,
    clearAllErrors,
    hasErrors: Object.keys(validationErrors).length > 0
  }
}

// Types for form validation
interface ValidationRule {
  validate: (value: any) => boolean
  message: string
}

interface ValidationSchema {
  [field: string]: ValidationRule[]
}

// Common validation rules
export const ValidationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    validate: (value: any) => value !== undefined && value !== null && value !== '',
    message
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value: any) => !value || value.length >= min,
    message: message || `Must be at least ${min} characters`
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value: any) => !value || value.length <= max,
    message: message || `Must be no more than ${max} characters`
  }),

  email: (message = 'Must be a valid email address'): ValidationRule => ({
    validate: (value: any) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message
  }),

  url: (message = 'Must be a valid URL'): ValidationRule => ({
    validate: (value: any) => !value || /^https?:\/\/.+/.test(value),
    message
  }),

  youtubeVideoId: (message = 'Must be a valid YouTube video ID'): ValidationRule => ({
    validate: (value: any) => !value || /^[a-zA-Z0-9_-]{11}$/.test(value),
    message
  }),

  numeric: (message = 'Must be a number'): ValidationRule => ({
    validate: (value: any) => !value || !isNaN(Number(value)),
    message
  }),

  positive: (message = 'Must be a positive number'): ValidationRule => ({
    validate: (value: any) => !value || Number(value) > 0,
    message
  }),

  min: (min: number, message?: string): ValidationRule => ({
    validate: (value: any) => !value || Number(value) >= min,
    message: message || `Must be at least ${min}`
  }),

  max: (max: number, message?: string): ValidationRule => ({
    validate: (value: any) => !value || Number(value) <= max,
    message: message || `Must be no more than ${max}`
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value: any) => !value || regex.test(value),
    message
  }),

  oneOf: (options: any[], message?: string): ValidationRule => ({
    validate: (value: any) => !value || options.includes(value),
    message: message || `Must be one of: ${options.join(', ')}`
  })
}

// Hook for handling API call errors with retry logic
export function useApiCall<T = any>(options: {
  onSuccess?: (data: T) => void
  onError?: (error: AppError) => void
  retryCount?: number
  showToast?: boolean
} = {}) {
  const { onSuccess, onError, retryCount = 3, showToast = true } = options
  const { executeAsync, retry, isLoading, error, hasError, retryAttempts } = useErrorHandler({
    showToast,
    retryCount,
    onError
  })

  const call = useCallback(async (
    apiFunction: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> => {
    const result = await executeAsync(apiFunction, context)
    
    if (result && onSuccess) {
      onSuccess(result)
    }
    
    return result
  }, [executeAsync, onSuccess])

  const callWithRetry = useCallback(async (
    apiFunction: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> => {
    return retry(apiFunction)
  }, [retry])

  return {
    call,
    callWithRetry,
    isLoading,
    error,
    hasError,
    retryAttempts
  }
}