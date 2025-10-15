import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NewPipe - Privacy-Focused YouTube Frontend",
  description: "A privacy-focused YouTube frontend with advanced features like background playback, subscriptions, playlists, and more.",
  keywords: ["NewPipe", "YouTube", "Privacy", "Frontend", "React", "Next.js"],
  authors: [{ name: "NewPipe Team" }],
  openGraph: {
    title: "NewPipe - Privacy-Focused YouTube Frontend",
    description: "Privacy-focused YouTube alternative with advanced features",
    url: "https://localhost:3000",
    siteName: "NewPipe",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NewPipe - Privacy-Focused YouTube Frontend",
    description: "Privacy-focused YouTube alternative with advanced features",
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
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
