'use client'

import { useApiError } from '@/lib/api-error-handler'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Trash2, RefreshCw } from 'lucide-react'

export function ErrorStatus() {
  const { errors, clearErrors, retryLastFailedRequest } = useApiError()

  if (errors.length === 0) {
    return null
  }

  const recentErrors = errors.slice(-5) // Show last 5 errors

  return (
    <Card className="fixed bottom-4 right-4 w-80 max-h-96 z-50 bg-destructive/5 border-destructive/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Recent Errors ({errors.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recentErrors.map((error, index) => (
          <div key={`${error.timestamp}-${index}`} className="text-xs space-y-1">
            <div className="flex items-center justify-between">
              <Badge variant="destructive" className="text-xs">
                {error.endpoint || 'Unknown'}
              </Badge>
              <span className="text-muted-foreground">
                {new Date(error.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-muted-foreground truncate">
              {error.message}
            </p>
          </div>
        ))}
        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={clearErrors}
            className="flex-1"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={retryLastFailedRequest}
            className="flex-1"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}