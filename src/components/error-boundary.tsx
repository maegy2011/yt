'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="mb-4">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">حدث خطأ غير متوقع</h2>
            <p className="text-muted-foreground mb-6">
              {this.state.error?.message || 'حدث خطأ في تحميل الصفحة. يرجى المحاولة مرة أخرى.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReset} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                إعادة المحاولة
              </Button>
              <Button onClick={this.handleReload}>
                تحديث الصفحة
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Simple error boundary for specific components
export function SimpleErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary fallback={
      <div className="p-4 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">فشل في تحميل هذا المحتوى</p>
        <Button 
          size="sm" 
          variant="outline" 
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          إعادة المحاولة
        </Button>
      </div>
    }>
      {children}
    </ErrorBoundary>
  )
}