import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/error-boundary";
import { ApiErrorProvider } from "@/lib/api-error-handler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyTube - YouTube Video Manager",
  description: "A modern YouTube video management application with watch tracking, notes, and channel discovery",
  keywords: ["MyTube", "YouTube", "Video Manager", "Watch Tracking", "Notes", "Channel Discovery"],
  authors: [{ name: "MyTube Team" }],
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "MyTube - YouTube Video Manager",
    description: "A modern YouTube video management application",
    url: "http://localhost:3000",
    siteName: "MyTube",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyTube - YouTube Video Manager",
    description: "A modern YouTube video management application",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ErrorBoundary>
          <ApiErrorProvider>
            {children}
            <Toaster />
          </ApiErrorProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
