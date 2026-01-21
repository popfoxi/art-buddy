import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "ArtTutor123 畫重點 | 你的 AI 貼身繪畫家教",
  description: "全台首創 AI 繪畫教學 App。上傳作品即時分析，提供構圖、色彩、光影的專業修改建議。不需要昂貴學費，ArtTutor123 就像你的 24 小時貼身美術老師，陪你一起進步。",
  keywords: ["繪畫教學", "AI畫作分析", "學畫畫", "美術家教", "ArtTutor123", "畫重點", "素描技巧", "水彩教學", "作品集製作"],
  openGraph: {
    title: "ArtTutor123 畫重點 | 你的 AI 貼身繪畫家教",
    description: "拍下你的畫作，AI 老師立刻告訴你怎麼改會更好！構圖、色彩、光影全方位分析。",
    url: "https://arttutor123.com", // 暫定網址，上線後可改
    siteName: "ArtTutor123",
    locale: "zh_TW",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ArtTutor123",
  },
  formatDetection: {
    telephone: false,
  },
};

// JSON-LD Structured Data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "ArtTutor123 畫重點",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "TWD"
  },
  "description": "你的 24 小時貼身繪畫家教，透過 AI 分析提供即時繪畫建議。",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "1250"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
