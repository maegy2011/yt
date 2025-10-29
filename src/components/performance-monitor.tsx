'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

interface PerformanceMetrics {
  memoryUsage?: number
  memoryLimit?: number
  connectionCount: number
  slowRequests: number
  averageResponseTime: number
}

export function PerformanceMonitor() {
  const { toast } = useToast()
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    connectionCount: 0,
    slowRequests: 0,
    averageResponseTime: 0
  })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
      return
    }

    const updateMetrics = () => {
      // Memory usage (if available)
      const memory = (performance as any).memory
      const newMetrics: PerformanceMetrics = {
        connectionCount: 0, // This would need custom tracking
        slowRequests: 0,    // This would need custom tracking
        averageResponseTime: 0, // This would need custom tracking
      }

      if (memory) {
        newMetrics.memoryUsage = Math.round(memory.usedJSHeapSize / 1048576) // MB
        newMetrics.memoryLimit = Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      }

      setMetrics(newMetrics)

      // Show warning if memory usage is high
      if (memory && memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
        toast({
          title: 'High Memory Usage',
          description: `Memory usage is at ${newMetrics.memoryUsage}MB. Consider refreshing the page.`,
          variant: 'destructive',
        })
      }
    }

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000)
    updateMetrics() // Initial update

    return () => clearInterval(interval)
  }, [toast])

  // Don't show in production
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="px-3 py-2 bg-background border rounded-lg shadow-sm text-xs hover:bg-muted transition-colors"
      >
        📊 Performance
      </button>
      
      {isVisible && (
        <div className="absolute bottom-full mb-2 w-64 bg-background border rounded-lg shadow-sm p-3 space-y-2">
          <h4 className="font-medium text-sm">Performance Metrics</h4>
          
          {metrics.memoryUsage !== undefined && (
            <div className="flex justify-between text-xs">
              <span>Memory Usage:</span>
              <span className={metrics.memoryUsage > 100 ? 'text-red-500' : 'text-green-500'}>
                {metrics.memoryUsage}MB
              </span>
            </div>
          )}
          
          {metrics.memoryLimit !== undefined && (
            <div className="flex justify-between text-xs">
              <span>Memory Limit:</span>
              <span>{metrics.memoryLimit}MB</span>
            </div>
          )}
          
          <div className="flex justify-between text-xs">
            <span>Active Connections:</span>
            <span>{metrics.connectionCount}</span>
          </div>
          
          <div className="flex justify-between text-xs">
            <span>Slow Requests:</span>
            <span className={metrics.slowRequests > 0 ? 'text-red-500' : 'text-green-500'}>
              {metrics.slowRequests}
            </span>
          </div>
          
          <div className="flex justify-between text-xs">
            <span>Avg Response Time:</span>
            <span>{metrics.averageResponseTime}ms</span>
          </div>
          
          <div className="pt-2 border-t text-xs text-muted-foreground">
            Press Ctrl+Shift+R to clear cache
          </div>
        </div>
      )}
    </div>
  )
}