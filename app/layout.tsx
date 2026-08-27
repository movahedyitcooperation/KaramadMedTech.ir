import type { Metadata, Viewport } from "next";
import { fa } from "@/lib/i18n/fa";
import "./globals.css";

export const metadata: Metadata = {
  title: "تجهیزات پزشکی کارآمد",
  description:
    "فروشگاه اینترنتی تجهیزات پزشکی کارآمد — تجهیزات تشخیصی، مصرفی، توانبخشی و مراقبت در منزل",
};

export const viewport: Viewport = {
  themeColor: "#0e7c86",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className="h-full">
      <head>
        <link
          rel="preload"
          href="/fonts/Vazirmatn-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased bg-(--color-bg) text-(--color-ink-900)">
        <a href="#main-content" className="skip-link">
          {fa.common.skipToContent}
        </a>
        {children}
      </body>
    </html>
  );
}
