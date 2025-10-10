import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "مشغل يوتيوب وموسوعة الأحاديث",
    template: "%s | مشغل يوتيوب وأحاديث"
  },
  description: "تطبيق ويب عربي متكامل يجمع بين مشغل يوتيوب متقدم وموسوعة الأحاديث النبوية. شاهد الفيديوهات التعليمية واستكشف الأحاديث النبوية من مصادر موثوقة.",
  keywords: [
    "يوتيوب", 
    "أحاديث", 
    "فيديو", 
    "إسلام", 
    "تعليم", 
    "مشغل", 
    "موسوعة", 
    "عربي", 
    "Next.js", 
    "TypeScript"
  ],
  authors: [{ name: "فريق التطوير" }],
  creator: "مشغل يوتيوب وموسوعة الأحاديث",
  publisher: "مشغل يوتيوب وموسوعة الأحاديث",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "مشغل يوتيوب وموسوعة الأحاديث",
    description: "تطبيق ويب عربي يجمع بين مشغل يوتيوب متقدم وموسوعة الأحاديث النبوية",
    url: "https://your-app.vercel.app",
    siteName: "مشغل يوتيوب وموسوعة الأحاديث",
    type: "website",
    locale: "ar_AR",
  },
  twitter: {
    card: "summary_large_image",
    title: "مشغل يوتيوب وموسوعة الأحاديث",
    description: "تطبيق ويب عربي يجمع بين مشغل يوتيوب متقدم وموسوعة الأحاديث النبوية",
    images: ["https://your-app.vercel.app/og-image.png"],
  },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
    other: {
      rel: "mask-icon",
      url: "/logo.svg",
      color: "#1e40af"
    }
  },
  manifest: "/manifest.json",
  category: "education",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1e293b" }
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="ar" 
      dir="rtl" 
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <meta name="application-name" content="مشغل يوتيوب وموسوعة الأحاديث" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="مشغل يوتيوب وأحاديث" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#1e40af" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://www.googleapis.com" />
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://dorar.net" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for better performance */}
        <link rel="dns-prefetch" href="https://www.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://dorar.net" />
      </head>
      <body
        className="antialiased bg-background text-foreground min-h-screen"
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
