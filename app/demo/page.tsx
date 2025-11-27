'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Check, 
  AlertTriangle, 
  Loader2, 
  RefreshCw,
  Zap,
  Shield,
  Eye,
  Keyboard,
  Bug
} from 'lucide-react'

// Import our enhanced components
import { ErrorBoundary, withErrorBoundary } from '@/components/ErrorBoundary'
import { useAsyncOperation, useAsyncOperations } from '@/hooks/useAsyncOperation'
import { 
  VideoCardSkeleton, 
  SearchResultsSkeleton, 
  FavoritesListSkeleton,
  LoadingSpinner,
  FullPageLoading,
  InlineLoading
} from '@/components/ui/skeleton-components'
import { NavigationEnhanced } from '@/components/navigation/NavigationEnhanced'
import { AccessibilityGuide } from '@/components/accessibility/AccessibilityGuide'

// Demo component that will intentionally throw an error
const ErrorProneComponent = ({ shouldError = false }: { shouldError?: boolean }) => {
  if (shouldError) {
    throw new Error('This is a demo error to showcase the ErrorBoundary!')
  }
  
  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <h3 className="font-medium text-green-800">✅ Component loaded successfully!</h3>
      <p className="text-sm text-green-600 mt-1">This component is working as expected.</p>
    </div>
  )
}

// Demo component with async operations
const AsyncDemoComponent = () => {
  const [data, setData] = useState<string[]>([])
  
  // Single async operation
  const fetchDataOperation = useAsyncOperation<string[]>({
    showToast: true,
    successMessage: 'Data fetched successfully!',
    errorMessage: 'Failed to fetch data'
  })
  
  // Multiple async operations
  const operations = useAsyncOperations({
    fetchUsers: () => Promise.resolve(['User 1', 'User 2', 'User 3']),
    fetchPosts: () => Promise.resolve(['Post 1', 'Post 2']),
    fetchComments: () => Promise.resolve(['Comment 1', 'Comment 2', 'Comment 3'])
  })

  const handleFetchData = async () => {
    try {
      const result = await fetchDataOperation.execute(async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000))
        return ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5']
      })
      setData(result || [])
    } catch (error) {
      console.error('Fetch error:', error)
    }
  }

  const handleMultipleOperations = async () => {
    try {
      await Promise.all([
        operations.executeOperation('fetchUsers'),
        operations.executeOperation('fetchPosts'),
        operations.executeOperation('fetchComments')
      ])
    } catch (error) {
      console.error('Multiple operations error:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button 
          onClick={handleFetchData}
          disabled={fetchDataOperation.loading}
          className="gap-2"
        >
          {fetchDataOperation.loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Fetch Data
        </Button>
        
        <Button 
          onClick={handleMultipleOperations}
          disabled={operations.isAnyLoading}
          variant="outline"
          className="gap-2"
        >
          {operations.isAnyLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          Run Multiple Operations
        </Button>
      </div>

      {fetchDataOperation.loading && (
        <InlineLoading message="Fetching data..." />
      )}

      {data.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800">Fetched Data:</h4>
          <ul className="text-sm text-blue-600 mt-2">
            {data.map((item, index) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>
        </div>
      )}

      {operations.hasAnyError && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Some operations failed. Check the console for details.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// Component wrapped with error boundary HOC
const SafeComponent = withErrorBoundary(ErrorProneComponent, {
  onError: (error, errorInfo) => {
    console.error('SafeComponent error:', error, errorInfo)
  }
})

export default function FrontendImprovementsDemo() {
  const [activeTab, setActiveTab] = useState('overview')
  const [shouldError, setShouldError] = useState(false)
  const [showLoading, setShowLoading] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Navigation with Accessibility */}
      <NavigationEnhanced 
        onSearch={(query) => console.log('Search:', query)}
        className="mb-8"
      />

      <main id="main-content" className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Frontend Improvements Demo</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Showcase of loading states, error boundaries, and accessibility improvements
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Check className="h-3 w-3" />
              Error Boundaries
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="h-3 w-3" />
              Loading States
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Eye className="h-3 w-3" />
              Accessibility
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="error-boundaries">Error Boundaries</TabsTrigger>
            <TabsTrigger value="loading-states">Loading States</TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
            <TabsTrigger value="kitchen-sink">Kitchen Sink</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-500" />
                    Error Boundaries
                  </CardTitle>
                  <CardDescription>
                    Component-level error handling with graceful fallbacks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1">
                    <li>• Catch React render errors</li>
                    <li>• Graceful error UI</li>
                    <li>• Error reporting integration</li>
                    <li>• HOC for easy wrapping</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 text-blue-500" />
                    Loading States
                  </CardTitle>
                  <CardDescription>
                    Comprehensive loading states and skeleton screens
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1">
                    <li>• Async operation hooks</li>
                    <li>• Skeleton components</li>
                    <li>• Loading spinners</li>
                    <li>• Progress indicators</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-purple-500" />
                    Accessibility
                  </CardTitle>
                  <CardDescription>
                    WCAG 2.1 compliant accessibility features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1">
                    <li>• Keyboard navigation</li>
                    <li>• Screen reader support</li>
                    <li>• ARIA labels</li>
                    <li>• Focus management</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="error-boundaries" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="h-5 w-5" />
                  Error Boundary Demo
                </CardTitle>
                <CardDescription>
                  Toggle the error to see the ErrorBoundary in action
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => setShouldError(!shouldError)}
                    variant={shouldError ? "destructive" : "default"}
                  >
                    {shouldError ? 'Trigger Error' : 'Reset to Normal'}
                  </Button>
                  <Badge variant={shouldError ? "destructive" : "secondary"}>
                    {shouldError ? 'Error Will Occur' : 'Normal Operation'}
                  </Badge>
                </div>

                <ErrorBoundary
                  fallback={
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This is a custom error fallback! The component failed to load, but the app continues working.
                      </AlertDescription>
                    </Alert>
                  }
                >
                  <ErrorProneComponent shouldError={shouldError} />
                </ErrorBoundary>

                <div className="mt-6">
                  <h4 className="font-medium mb-2">HOC Wrapped Component:</h4>
                  <SafeComponent shouldError={shouldError} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loading-states" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Async Operations Demo</CardTitle>
                <CardDescription>
                  Test the useAsyncOperation hook with loading states
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AsyncDemoComponent />
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Skeleton Components</CardTitle>
                  <CardDescription>
                    Various skeleton screens for different content types
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Video Card Skeleton</h4>
                    <VideoCardSkeleton />
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Search Results Skeleton</h4>
                    <div className="scale-75 origin-top">
                      <SearchResultsSkeleton count={2} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Loading Spinners</CardTitle>
                  <CardDescription>
                    Different loading spinner variants
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm">Small</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <LoadingSpinner size="md" />
                    <span className="text-sm">Medium</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <LoadingSpinner size="lg" />
                    <span className="text-sm">Large</span>
                  </div>
                  
                  <div className="pt-4 space-y-2">
                    <InlineLoading message="Loading inline content..." />
                    <Button 
                      onClick={() => setShowLoading(!showLoading)}
                      className="w-full"
                    >
                      {showLoading ? 'Hide' : 'Show'} Full Page Loading
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="accessibility" className="space-y-6">
            <AccessibilityGuide />
          </TabsContent>

          <TabsContent value="kitchen-sink" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kitchen Sink Demo</CardTitle>
                <CardDescription>
                  All features working together in a complex scenario
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <ErrorBoundary>
                    <Card>
                      <CardHeader>
                        <CardTitle>Async Data Loading</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <AsyncDemoComponent />
                      </CardContent>
                    </Card>
                  </ErrorBoundary>

                  <ErrorBoundary>
                    <Card>
                      <CardHeader>
                        <CardTitle>Skeleton Loading</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <FavoritesListSkeleton count={3} />
                      </CardContent>
                    </Card>
                  </ErrorBoundary>
                </div>

                <ErrorBoundary>
                  <Card>
                    <CardHeader>
                      <CardTitle>Complex Interaction</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          This section demonstrates multiple features working together:
                        </p>
                        <ul className="text-sm space-y-1">
                          <li>• Error boundaries protect against crashes</li>
                          <li>• Loading states provide user feedback</li>
                          <li>• Accessibility features ensure screen reader compatibility</li>
                          <li>• Keyboard navigation works throughout</li>
                        </ul>
                        
                        <div className="flex gap-2 pt-4">
                          <Button 
                            onClick={() => setShouldError(!shouldError)}
                            variant={shouldError ? "destructive" : "outline"}
                            size="sm"
                          >
                            Toggle Error State
                          </Button>
                          <Button 
                            onClick={() => setShowLoading(!showLoading)}
                            variant="outline"
                            size="sm"
                          >
                            Toggle Loading Demo
                          </Button>
                        </div>
                        
                        {shouldError && (
                          <ErrorBoundary>
                            <ErrorProneComponent shouldError={true} />
                          </ErrorBoundary>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </ErrorBoundary>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Full page loading overlay */}
      {showLoading && (
        <FullPageLoading message="Loading application data..." />
      )}
    </div>
  )
}