'use client'

import { useIncognito } from '@/contexts/incognito-context'
import { Badge } from '@/components/ui/badge'
import { X, EyeOff, Info } from 'lucide-react'
import { useState } from 'react'

export function IncognitoBanner() {
  const { isIncognito, getIncognitoDuration, disableIncognito } = useIncognito()
  const [isDismissed, setIsDismissed] = useState(false)

  if (!isIncognito || isDismissed) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-black dark:via-gray-900 dark:to-black border-b border-gray-700 dark:border-gray-800">
      <div className="px-3 sm:px-4 lg:px-6 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-gray-300 dark:text-gray-400 flex-shrink-0" />
              <Badge variant="destructive" className="text-xs bg-red-600 text-white border-red-700">
                Incognito Mode
              </Badge>
            </div>
            
            <div className="hidden sm:flex items-center gap-4 text-xs text-gray-300 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                Your activity won't be saved
              </span>
              <span className="text-gray-400 dark:text-gray-500">
                Duration: {getIncognitoDuration()}
              </span>
            </div>
            
            <div className="sm:hidden text-xs text-gray-300 dark:text-gray-400">
              Private browsing active
            </div>
          </div>
          
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-md hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            aria-label="Dismiss incognito banner"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-200 dark:hover:text-gray-300" />
          </button>
        </div>
      </div>
    </div>
  )
}