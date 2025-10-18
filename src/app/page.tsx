'use client'

// YouTube Clone - Mobile First Design
import { useState, lazy, Suspense } from 'react'
import { Search, Menu, Bell, Cast } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { categories } from '@/constants/videos'

// Lazy load components
const VideoCard = lazy(() => import('@/components/VideoCard'))
const BottomNav = lazy(() => import('@/components/BottomNav'))
const SideMenu = lazy(() => import('@/components/SideMenu'))
const UserProfileMenu = lazy(() => import('@/components/UserProfileMenu'))

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col max-w-md mx-auto relative">
      {/* Side Menu */}
      <Suspense fallback={<div className="fixed inset-0 bg-white dark:bg-gray-900 z-40" />}>
        <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      </Suspense>
      
      {/* User Profile Menu */}
      <Suspense fallback={<div className="fixed inset-0 bg-white dark:bg-gray-900 z-40" />}>
        <UserProfileMenu isOpen={isProfileMenuOpen} onClose={() => setIsProfileMenuOpen(false)} />
      </Suspense>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={toggleMenu}>
            <Menu className="h-6 w-6 text-gray-900 dark:text-white" />
          </Button>
          
          <div className="flex-1 flex items-center">
            <div className="text-red-600 font-bold text-xl mr-2">YouTube</div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0">
              <Cast className="h-5 w-5 text-gray-900 dark:text-white" />
            </Button>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Bell className="h-5 w-5 text-gray-900 dark:text-white" />
            </Button>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Search className="h-5 w-5 text-gray-900 dark:text-white" />
            </Button>
            <Avatar className="h-8 w-8 cursor-pointer" onClick={toggleProfileMenu}>
              <AvatarImage src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=32&h=32&fit=crop&crop=face" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-full text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          <Button variant="ghost" size="icon" className="shrink-0">
            <Search className="h-5 w-5 text-gray-900 dark:text-white" />
          </Button>
        </div>
      </header>

      {/* Categories */}
      <div className="sticky top-16 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2">
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === 'All' ? 'default' : 'secondary'}
              size="sm"
              className="rounded-full whitespace-nowrap bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-black dark:text-white"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-16">
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
            <Suspense key={index} fallback={<div className="p-2 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />}>
              <VideoCard videoIndex={index} />
            </Suspense>
          ))}
        </div>
      </main>

      {/* Bottom Navigation */}
      <Suspense fallback={<div className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800" />}>
        <BottomNav />
      </Suspense>
    </div>
  )
}