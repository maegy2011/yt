'use client'

import { useState, useEffect } from 'react'
import { SplashScreen } from '@/components/splash-screen'

export default function Home() {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    // Hide splash screen after initialization
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 3000) // 3 seconds

    return () => clearTimeout(timer)
  }, [])

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4">
      <div className="text-center space-y-4">
        <div className="relative w-24 h-24 md:w-32 md:h-32">
          <img
            src="/logo.svg"
            alt="MyTube Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-4xl font-bold text-foreground">MyTube</h1>
        <p className="text-xl text-muted-foreground">Your Personal YouTube Experience</p>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            ✅ Enhanced blacklist/whitelist system
          </p>
          <p className="text-sm text-muted-foreground">
            ✅ Real-time synchronization
          </p>
          <p className="text-sm text-muted-foreground">
            ✅ Advanced pattern matching
          </p>
          <p className="text-sm text-muted-foreground">
            ✅ Temporary blacklisting
          </p>
          <p className="text-sm text-muted-foreground">
            ✅ Audit logging & undo/redo
          </p>
        </div>
      </div>
    </div>
  )
}