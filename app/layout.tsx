import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { BackgroundPlayerProvider } from "@/contexts/background-player-context";
import { IncognitoProvider } from "@/contexts/incognito-context";
import { MiniPlayer } from "@/components/mini-player";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "@/components/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full-screen">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground h-full-screen overflow-hidden safe-area-inset`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <IncognitoProvider>
            <BackgroundPlayerProvider>
              <ErrorBoundary>
                <div className="h-full flex flex-col overflow-hidden">
                  {children}
                  <MiniPlayer />
                  <Toaster />
                </div>
              </ErrorBoundary>
            </BackgroundPlayerProvider>
          </IncognitoProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}