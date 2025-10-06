import { Skeleton } from '@/components/ui/skeleton'

interface VideoCardSkeletonProps {
  count?: number
}

export function VideoCardSkeleton({ count = 1 }: VideoCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="youtube-card bg-card rounded-lg overflow-hidden">
          {/* Thumbnail skeleton */}
          <Skeleton className="aspect-video w-full" />
          
          {/* Content skeleton */}
          <div className="p-3 space-y-2">
            {/* Title skeleton */}
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            
            {/* Channel info skeleton */}
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
            
            {/* Stats skeleton */}
            <div className="flex items-center gap-3 pt-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export function VideoListSkeleton({ count = 8 }: VideoCardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      <VideoCardSkeleton count={count} />
    </div>
  )
}

export function RelatedVideoSkeleton({ count = 6 }: VideoCardSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex gap-3">
          {/* Thumbnail skeleton */}
          <Skeleton className="aspect-video w-32 flex-shrink-0 rounded-lg" />
          
          {/* Content skeleton */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}