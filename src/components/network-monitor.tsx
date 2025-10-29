'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react'

interface NetworkStatus {
  online: boolean
  effectiveType?: string
  downlink?: number
  rtt?: number
}

export function NetworkMonitor() {
  const { toast } = useToast()
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true
  })
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection

      const newStatus: NetworkStatus = {
        online: navigator.onLine,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt
      }

      setNetworkStatus(newStatus)

      // Show warning for slow connections
      if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') {
        if (!showWarning) {
          setShowWarning(true)
          toast({
            title: 'Slow Connection Detected',
            description: 'You may experience slower loading times on this network.',
            variant: 'destructive',
          })
        }
      } else {
        setShowWarning(false)
      }
    }

    const handleOnline = () => {
      updateNetworkStatus()
      toast({
        title: 'Connection Restored',
        description: 'You are back online.',
        variant: 'success',
      })
    }

    const handleOffline = () => {
      updateNetworkStatus()
      toast({
        title: 'Connection Lost',
        description: 'You are currently offline. Some features may not work.',
        variant: 'destructive',
      })
    }

    // Initial status
    updateNetworkStatus()

    // Event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection
    
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus)
      }
    }
  }, [toast, showWarning])

  // Don't show anything in production unless there's an issue
  if (process.env.NODE_ENV === 'production' && networkStatus.online && !showWarning) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-background border rounded-lg shadow-sm">
      {networkStatus.online ? (
        <>
          <Wifi className="w-4 h-4 text-green-500" />
          <span className="text-xs text-muted-foreground">
            {networkStatus.effectiveType && `${networkStatus.effectiveType.toUpperCase()}`}
            {networkStatus.downlink && ` • ${networkStatus.downlink}Mbps`}
          </span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-red-500" />
          <span className="text-xs text-red-500">Offline</span>
        </>
      )}
      
      {showWarning && (
        <AlertTriangle className="w-4 h-4 text-yellow-500" />
      )}
    </div>
  )
}