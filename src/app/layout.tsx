import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/error-boundary";

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
  description: "A feature-rich YouTube client built with Next.js",
  keywords: ["YouTube", "Next.js", "TypeScript", "Tailwind CSS", "Video", "Music"],
  authors: [{ name: "MyTube Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "MyTube - YouTube Client",
    description: "A modern YouTube client with advanced features",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyTube - YouTube Client",
    description: "A modern YouTube client with advanced features",
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
          {children}
          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  );
}
