import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SettingsProvider } from "@/contexts/settings-context";
import { ChannelsProvider } from "@/contexts/channels-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ماي يوتيوب - تطبيق يوتيوب عربي",
  description: "تطبيق ويب عربي لمشاهدة ومشاركة الفيديوهات من يوتيوب مع واجهة مستخدم حديثة وسهلة الاستخدام",
  keywords: ["يوتيوب", "فيديو", "عربي", "مشاهدة", "مشاركة", "Next.js", "TypeScript"],
  authors: [{ name: "ماي يوتيوب" }],
  openGraph: {
    title: "ماي يوتيوب",
    description: "تطبيق ويب عربي لمشاهدة ومشاركة الفيديوهات",
    url: "https://chat.z.ai",
    siteName: "ماي يوتيوب",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ماي يوتيوب",
    description: "تطبيق ويب عربي لمشاهدة ومشاركة الفيديوهات",
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
        <SettingsProvider>
          <ChannelsProvider>
            {children}
            <Toaster />
          </ChannelsProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
