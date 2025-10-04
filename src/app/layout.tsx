import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter, Cairo } from "next/font/google";
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

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: "YouTube Islami - فيديوهات إسلامية",
  description: "منصة فيديوهات إسلامية مختارة بعناية وآمنة للعائلة",
  keywords: ["إسلامي", "فيديو", "يوتيوب", "تعليم", "قرآن", "سنة"],
  authors: [{ name: "YouTube Islami Team" }],
  openGraph: {
    title: "YouTube Islami - فيديوهات إسلامية",
    description: "منصة فيديوهات إسلامية مختارة بعناية وآمنة للعائلة",
    type: "website",
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
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${cairo.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
