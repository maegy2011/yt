/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Mock console.error to avoid noise in tests
const originalError = console.error
beforeEach(() => {
  console.error = jest.fn()
})

afterEach(() => {
  console.error = originalError
})

describe('ErrorBoundary', () => {
  const ThrowErrorComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
    if (shouldThrow) {
      throw new Error('Test error')
    }
    return <div>No error</div>
  }

  const CustomFallbackComponent = ({ error, resetError }: { error?: Error; resetError?: () => void }) => (
    <div data-testid="custom-fallback">
      <h1>Custom Error Occurred</h1>
      <p>{error?.message}</p>
      <button onClick={resetError}>Retry</button>
    </div>
  )

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={false} />
      <div data-testid="child-content">Child content</div>
      </ErrorBoundary>
    )

    expect(screen.getByTestId('child-content')).toBeInTheDocument()
    expect(screen.queryByTestId('custom-fallback')).not.toBeInTheDocument()
  })

  it('should render default fallback when error occurs', async () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    await waitFor(() => {
      expect(screen.getByText(/Oops! Something went wrong/)).toBeInTheDocument()
      expect(screen.getByText(/An unexpected error occurred while rendering this component/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Reload Page/i })).toBeInTheDocument()
    })
  })

  it('should render custom fallback when provided', async () => {
    render(
      <ErrorBoundary fallback={<CustomFallbackComponent />}>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    await waitFor(() => {
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.getByText('Custom Error Occurred')).toBeInTheDocument()
      expect(screen.getByText('Test error')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    })
  })

  it('should call onError callback when provided', async () => {
    const onError = jest.fn()
    const error = new Error('Test error')

    render(
      <ErrorBoundary onError={onError}>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error, expect.objectContaining({
        componentStack: expect.any(String),
      }))
    })
  })

  it('should reset error state when retry button is clicked', async () => {
    const onError = jest.fn()
    const user = userEvent.setup()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    // Wait for error fallback to appear
    await waitFor(() => {
      expect(screen.getByText(/Oops! Something went wrong/)).toBeInTheDocument()
    })

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /Try Again/i })
    await user.click(retryButton)

    // Error fallback should disappear, children should render
    await waitFor(() => {
      expect(screen.queryByText(/Oops! Something went wrong/)).not.toBeInTheDocument()
      expect(screen.getByText('No error')).toBeInTheDocument()
    })
  })

  it('should handle different types of errors', async () => {
    const TypeErrorComponent = () => {
      throw new TypeError('Type error occurred')
    }

    const ReferenceErrorComponent = () => {
      throw new ReferenceError('Reference error occurred')
    }

    // Test TypeError
    const { unmount } = render(
      <ErrorBoundary>
        <TypeErrorComponent />
      </ErrorBoundary>
    )

    await waitFor(() => {
      expect(screen.getByText(/Oops! Something went wrong/)).toBeInTheDocument()
    })

    unmount()

    // Test ReferenceError
    render(
      <ErrorBoundary>
        <ReferenceErrorComponent />
      </ErrorBoundary>
    )

    await waitFor(() => {
      expect(screen.getByText(/Oops! Something went wrong/)).toBeInTheDocument()
    })
  })

  it('should show error details in development mode', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    await waitFor(() => {
      expect(screen.getByText(/Test error/)).toBeInTheDocument()
      expect(console.error).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.any(Object)
      )
    })

    process.env.NODE_ENV = originalEnv
  })

  it('should not show error details in production mode', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    await waitFor(() => {
      expect(screen.getByText(/Oops! Something went wrong/)).toBeInTheDocument()
      expect(screen.queryByText(/Test error/)).not.toBeInTheDocument()
    })

    process.env.NODE_ENV = originalEnv
  })

  it('should handle nested ErrorBoundaries', async () => {
    const InnerErrorComponent = () => {
      throw new Error('Inner error')
    }

    render(
      <ErrorBoundary fallback={<div data-testid="outer-boundary">Outer Error</div>}>
        <ErrorBoundary fallback={<div data-testid="inner-boundary">Inner Error</div>}>
          <InnerErrorComponent />
        </ErrorBoundary>
      </ErrorBoundary>
    )

    await waitFor(() => {
      // Inner boundary should catch the error first
      expect(screen.getByTestId('inner-boundary')).toBeInTheDocument()
      expect(screen.queryByTestId('outer-boundary')).not.toBeInTheDocument()
    })
  })

  it('should handle async errors in useEffect', async () => {
    const AsyncErrorComponent = () => {
      React.useEffect(() => {
        throw new Error('Async error')
      }, [])
      return <div>Async Component</div>
    }

    render(
      <ErrorBoundary>
        <AsyncErrorComponent />
      </ErrorBoundary>
    )

    await waitFor(() => {
      expect(screen.getByText(/Oops! Something went wrong/)).toBeInTheDocument()
    })
  })

  it('should be accessible', async () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    await waitFor(() => {
      const retryButton = screen.getByRole('button', { name: /Try Again/i })
      const reloadButton = screen.getByRole('button', { name: /Reload Page/i })
      
      // Check accessibility attributes
      expect(retryButton).toHaveAttribute('aria-label')
      expect(reloadButton).toHaveAttribute('aria-label')
      
      // Check keyboard navigation
      expect(retryButton).toBeInTheDocument()
      expect(reloadButton).toBeInTheDocument()
    })
  })
})