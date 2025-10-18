'use client'

import { Home, PlaySquare, SquarePlus, User, Library } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around items-center py-2">
          <Button variant="ghost" size="sm" className="flex flex-col gap-1 h-auto py-2 px-3">
            <Home className="h-5 w-5 text-gray-900 dark:text-white" />
            <span className="text-xs text-gray-900 dark:text-white">Home</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="flex flex-col gap-1 h-auto py-2 px-3">
            <PlaySquare className="h-5 w-5 text-gray-900 dark:text-white" />
            <span className="text-xs text-gray-900 dark:text-white">Shorts</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="flex flex-col gap-1 h-auto py-2 px-3">
            <div className="relative">
              <SquarePlus className="h-5 w-5 text-gray-900 dark:text-white" />
            </div>
            <span className="text-xs text-gray-900 dark:text-white">Create</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="flex flex-col gap-1 h-auto py-2 px-3">
            <User className="h-5 w-5 text-gray-900 dark:text-white" />
            <span className="text-xs text-gray-900 dark:text-white">You</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="flex flex-col gap-1 h-auto py-2 px-3">
            <Library className="h-5 w-5 text-gray-900 dark:text-white" />
            <span className="text-xs text-gray-900 dark:text-white">Library</span>
          </Button>
        </div>
      </div>
    </nav>
  )
}