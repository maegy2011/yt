/**
 * Root Layout Component
 * 
 * This is the root layout component that wraps the entire MyTube application.
 * It provides global context providers, error boundaries, and basic HTML structure.
 * 
 * Features:
 * - Font configuration with Geist Sans and Geist Mono
 * - Theme provider for dark/light mode support
 * - Background player context for audio playback
 * - Error boundary for error handling
 * - Responsive viewport configuration
 * - SEO metadata configuration
 * 
 * @component RootLayout
 * @returns {JSX.Element} The wrapped application layout
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// UI Components
import { Toaster } from "@/components/ui/toaster";
import { MiniPlayer } from "@/components/mini-player";
import { ErrorBoundary } from "@/components/error-boundary";

// Context Providers
import { BackgroundPlayerProvider } from "@/contexts/background-player-context";

// Theme Provider
import { ThemeProvider } from "next-themes";

// ============================================================================
// FONT CONFIGURATION
// ============================================================================

/**
 * Geist Sans font configuration
 * Used for body text and UI elements throughout the application
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/**
 * Geist Mono font configuration
 * Used for code blocks, monospace text, and technical content
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ============================================================================
// METADATA CONFIGURATION
// ============================================================================

/**
 * Application metadata for SEO and social media sharing
 * Includes title, description, keywords, and OpenGraph/Twitter card data
 */
export const metadata: Metadata = {
  title: "MyTube - YouTube Client",
  description: "A modern YouTube client with favorites, notes, and background playback features.",
  keywords: ["YouTube", "Video", "Music", "Player", "Favorites", "Notes", "Background Playback"],
  authors: [{ name: "MyTube Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "MyTube - YouTube Client",
    description: "A modern YouTube client with favorites, notes, and background playback features",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyTube - YouTube Client",
    description: "A modern YouTube client with favorites, notes, and background playback features",
  },
};

// ============================================================================
// ROOT LAYOUT COMPONENT
// ============================================================================

/**
 * Root layout component that wraps the entire application
 * 
 * This component provides:
 * - HTML structure with proper language and viewport settings
 * - Font variables for consistent typography
 * - Theme provider for dark/light mode support
 * - Context providers for global state management
 * - Error boundary for error handling
 * - Mini player component for background audio
 * - Toast notifications system
 * 
 * @param children - Child components to be rendered within the layout
 * @returns {JSX.Element} The complete application layout
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full-screen">
      <head>
        {/* 
          Viewport meta tag for responsive design
          - width=device-width: Use device width for layout
          - initial-scale=1.0: Initial zoom level
          - maximum-scale=1.0: Prevent zooming on mobile
          - user-scalable=no: Disable user scaling for better UX
          - viewport-fit=cover: Ensure content covers entire viewport on iOS
        */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
      </head>
      <body
        className={`
          ${geistSans.variable} ${geistMono.variable}  // Font variables
          antialiased                              // Smooth font rendering
          bg-background text-foreground            // Theme colors
          h-full-screen overflow-hidden            // Full screen layout
          safe-area-inset                         // iOS safe area support
        `}
      >
        {/* 
          Theme Provider Configuration:
          - attribute="class": Uses CSS classes for theming
          - defaultTheme="system": Follows system preference
          - enableSystem: Allows system theme detection
          - disableTransitionOnChange: Prevents flash during theme changes
        */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* 
            Background Player Provider:
            Manages audio playback state across the application
            Enables background audio playback when navigating between pages
          */}
          <BackgroundPlayerProvider>
              {/* 
                Error Boundary:
                Catches and handles JavaScript errors throughout the application
                Prevents entire app from crashing due to component errors
              */}
              <ErrorBoundary>
                {/* 
                  Main Application Container:
                  - h-full: Full height layout
                  - flex flex-col: Vertical flexbox layout
                  - overflow-hidden: Prevent scrolling at this level
                */}
                <div className="h-full flex flex-col overflow-hidden">
                  {/* Page content rendered here */}
                  {children}
                  
                  {/* Global components */}
                  <MiniPlayer />  {/* Background audio player */}
                  <Toaster />     {/* Toast notifications */}
                </div>
              </ErrorBoundary>
            </BackgroundPlayerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}