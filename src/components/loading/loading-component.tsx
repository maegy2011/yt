'use client';

import { Loader2 } from 'lucide-react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  showText?: boolean;
}

export function Loading({ 
  size = 'md', 
  text = 'جاري التحميل...', 
  className = '',
  showText = true 
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      {showText && (
        <span className="text-sm text-muted-foreground animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
}

// Page loading component
export function PageLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loading size="lg" text="جاري تحميل الصفحة..." />
      </div>
    </div>
  );
}

// Video grid loading skeleton
export function VideoGridLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <VideoCardSkeleton key={index} />
      ))}
    </div>
  );
}

// Video card loading skeleton
function VideoCardSkeleton() {
  return (
    <div className="bg-card rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-video bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-3 bg-muted rounded w-1/3" />
      </div>
    </div>
  );
}

// Button loading component
export function ButtonLoading({ children, isLoading }: { 
  children: React.ReactNode; 
  isLoading: boolean 
}) {
  return (
    <div className="relative inline-block">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-md">
          <Loading size="sm" showText={false} />
        </div>
      )}
      <span className={isLoading ? 'invisible' : 'visible'}>
        {children}
      </span>
    </div>
  );
}