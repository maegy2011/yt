// Test type definitions for Jest and Testing Library

import '@testing-library/jest-dom'

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R = void> {
      toBeInTheDocument(): R
      toHaveClass(className: string): R
      toHaveAttribute(attr: string, value?: string): R
      toHaveStyle(style: string): R
      toBeChecked(): R
      toBeDisabled(): R
      toHaveFocus(): R
      toHaveValue(value: string | number): R
      toBeVisible(): R
      toContainElement(element: HTMLElement): R
      toHaveTextContent(text: string | RegExp): R
    }
  }
}

// Global test utilities
declare global {
  // Mock fetch
  const fetch: jest.MockedFunction<typeof fetch>
  
  // Mock localStorage
  const localStorage: {
    getItem: jest.MockedFunction<(key: string) => string | null>
    setItem: jest.MockedFunction<(key: string, value: string) => void>
    removeItem: jest.MockedFunction<(key: string) => void>
    clear: jest.MockedFunction<() => void>
  }
  
  // Mock window.matchMedia
  const matchMedia: jest.MockedFunction<(query: string) => MediaQueryList>
  
  // Mock ResizeObserver
  const ResizeObserver: jest.MockedFunction<typeof ResizeObserver>
  
  // Mock IntersectionObserver
  const IntersectionObserver: jest.MockedFunction<typeof IntersectionObserver>
}

// Media query list interface
interface MediaQueryList {
  matches: boolean
  media: string
  onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null
  addListener: ((this: MediaQueryList, listener: (ev: MediaQueryListEvent) => any) => void) | null
  removeListener: ((this: MediaQueryList, listener: (ev: MediaQueryListEvent) => any) => void) | null
  addEventListener: (type: string, listener: (ev: MediaQueryListEvent) => any) => void
  removeEventListener: (type: string, listener: (ev: MediaQueryListEvent) => any) => void
  dispatchEvent: (ev: Event) => void
}

interface MediaQueryListEvent {
  readonly matches: boolean
  readonly media: string
}

// Test environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: 'development' | 'production' | 'test'
    [key: string]: string | undefined
  }
}