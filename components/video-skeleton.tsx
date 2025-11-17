'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export function VideoCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-3">
        <div className="flex gap-3">
          <Skeleton className="w-32 h-24 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-7 w-16 rounded" />
              <Skeleton className="h-7 w-16 rounded" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function VideoGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  )
}