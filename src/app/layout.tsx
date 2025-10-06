import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "المنصة التعليمية - منصة فيديوهات تعليمية عربية",
  description: "منصة تعليمية تقدم محتوى عربي عالي الجودة من أفضل القنوات التعليمية على يوتيوب",
  keywords: ["تعليم", "عربي", "فيديوهات", "دروس", "محتوى تعليمي", "قنوات تعليمية"],
  authors: [{ name: "المنصة التعليمية" }],
  openGraph: {
    title: "المنصة التعليمية",
    description: "منصة تعليمية تقدم محتوى عربي عالي الجودة",
    url: "https://localhost:3000",
    siteName: "المنصة التعليمية",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "المنصة التعليمية",
    description: "منصة تعليمية تقدم محتوى عربي عالي الجودة",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
