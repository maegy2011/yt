'use client';

import { PlaylistManager } from '@/components/playlist/playlist-manager';

export default function PlaylistsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold">قوائم التشغيل</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <PlaylistManager />
      </main>
    </div>
  );
}