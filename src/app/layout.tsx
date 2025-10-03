import type { Metadata } from "next";
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
  title: "اليوتيوب الإسلامي - بوابتك الآمنة للمعرفة الإسلامية",
  description: "بوابتك الآمنة والموثوقة للمعرفة الإسلامية على يوتيوب، بدون إعلانات مشتتة أو محتوى غير لائق",
  keywords: ["يوتيوب إسلامي", "محتوى إسلامي", "قنوات إسلامية", "فيديوهات إسلامية", "دروس دينية"],
  authors: [{ name: "فريق اليوتيوب الإسلامي" }],
  openGraph: {
    title: "اليوتيوب الإسلامي",
    description: "بوابتك الآمنة للمعرفة الإسلامية على يوتيوب",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "اليوتيوب الإسلامي",
    description: "بوابتك الآمنة للمعرفة الإسلامية على يوتيوب",
  },
  other: {
    "twitter:image": "https://via.placeholder.com/1200x630/4F46E5/FFFFFF?text=اليوتيوب+الإسلامي",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground font-sans`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
