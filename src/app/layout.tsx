import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import SetupRedirect from "@/components/setup-redirect";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YT Islami - نظام إدارة الفيديوهات الإسلامية",
  description: "نظام متكامل لإدارة ومشاركة الفيديوهات الإسلامية من يوتيوب",
  keywords: ["YT Islami", "فيديوهات إسلامية", "يوتيوب", "إدارة المحتوى", "الإسلام"],
  authors: [{ name: "YT Islami Team" }],
  openGraph: {
    title: "YT Islami - نظام إدارة الفيديوهات الإسلامية",
    description: "نظام متكامل لإدارة ومشاركة الفيديوهات الإسلامية من يوتيوب",
    url: "https://ytislami.com",
    siteName: "YT Islami",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YT Islami - نظام إدارة الفيديوهات الإسلامية",
    description: "نظام متكامل لإدارة ومشاركة الفيديوهات الإسلامية من يوتيوب",
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
        <SetupRedirect>
          {children}
        </SetupRedirect>
        <Toaster />
      </body>
    </html>
  );
}
