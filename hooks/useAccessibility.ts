'use client'

import React, { useEffect, useRef, useState } from 'react'

// Accessibility hook for managing focus and keyboard navigation
export function useAccessibility(options: {
  restoreFocus?: boolean
  trapFocus?: boolean
  autoFocus?: boolean
} = {}) {
  const { restoreFocus = true, trapFocus = false, autoFocus = true } = options
  const containerRef = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Store the previously focused element
    if (restoreFocus && document.activeElement instanceof HTMLElement) {
      previousFocusRef.current = document.activeElement
    }

    // Auto-focus the container or first focusable element
    if (autoFocus) {
      const focusableElement = containerRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      
      if (focusableElement) {
        focusableElement.focus()
      } else {
        containerRef.current.focus()
      }
    }

    // Handle focus trapping
    let handleKeyDown: (e: KeyboardEvent) => void

    if (trapFocus) {
      handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return

        const focusableElements = containerRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as NodeListOf<HTMLElement>

        if (!focusableElements.length) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }

      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      // Restore focus to the previously focused element
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus()
      }

      if (handleKeyDown) {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [restoreFocus, trapFocus, autoFocus])

  return containerRef
}

// Hook for managing ARIA live regions
export function useAriaLive() {
  const announceRef = useRef<HTMLDivElement>(null)

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceRef.current) return

    // Create a temporary element for the announcement
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    announceRef.current.appendChild(announcement)

    // Remove the announcement after it's been spoken
    setTimeout(() => {
      announcement.remove()
    }, 1000)
  }

  const AnnounceComponent = () => {
    return React.createElement('div', {
      ref: announceRef,
      className: 'sr-only',
      'aria-live': 'polite',
      'aria-atomic': 'true'
    })
  }

  return { announce, AnnounceComponent }
}

// Hook for keyboard shortcuts
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in input fields
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return
      }

      const key: string[] = []
      if (e.ctrlKey) key.push('ctrl')
      if (e.shiftKey) key.push('shift')
      if (e.altKey) key.push('alt')
      if (e.metaKey) key.push('meta')
      key.push(e.key.toLowerCase())

      const shortcut = key.join('+')
      
      if (shortcuts[shortcut]) {
        e.preventDefault()
        shortcuts[shortcut]()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

// Utility functions for accessibility
export const a11y = {
  // Generate unique IDs for form labels
  generateId: (prefix: string = 'a11y') => `${prefix}-${Math.random().toString(36).substr(2, 9)}`,
  
  // Check if an element is visible
  isVisible: (element: HTMLElement) => {
    return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length)
  },
  
  // Get all focusable elements within a container
  getFocusableElements: (container: HTMLElement) => {
    return container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>
  },
  
  // Set focus to first focusable element
  focusFirst: (container: HTMLElement) => {
    const focusable = a11y.getFocusableElements(container)
    if (focusable.length > 0) {
      focusable[0].focus()
    }
  },
  
  // Announce to screen readers
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      announcement.remove()
    }, 1000)
  }
}

// Higher-order component for adding accessibility to components
export function withAccessibility<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    role?: string
    ariaLabel?: string
    ariaDescribedBy?: string
    tabIndex?: number
  } = {}
) {
  const WrappedComponent = (props: P) => {
    const { role, ariaLabel, ariaDescribedBy, tabIndex } = options
    
    return React.createElement(Component, {
      ...props,
      role,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      tabIndex
    })
  }
  
  WrappedComponent.displayName = `withAccessibility(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Custom hook for skip links
export function useSkipLinks() {
  const skipLinksRef = useRef<HTMLDivElement>(null)

  const addSkipLink = (targetId: string, label: string) => {
    if (!skipLinksRef.current) return

    const link = document.createElement('a')
    link.href = `#${targetId}`
    link.textContent = label
    link.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50'
    
    skipLinksRef.current.appendChild(link)
  }

  const SkipLinksComponent = () => {
    return React.createElement('div', {
      ref: skipLinksRef,
      className: 'sr-only'
    })
  }

  return { addSkipLink, SkipLinksComponent }
}

// Hook for managing reduced motion preferences
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

// Hook for managing high contrast preferences
export function useHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setPrefersHighContrast(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersHighContrast
}

// Component for screen reader only content
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return React.createElement('span', {
    className: 'sr-only'
  }, children)
}

// Component for visible only to screen readers when focused
export function FocusVisible({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return React.createElement('span', {
    className: `sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50 ${className}`
  }, children)
}