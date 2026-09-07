import type { Metadata } from "next";
import { Toaster } from "@/components/ui/Toaster";
import { fa } from "@/lib/i18n/fa";
import { SITE_URL } from "@/lib/seo/jsonld";
import "./globals.css";

export const metadata: Metadata = {
  // Without metadataBase, Next emits `alternates.canonical` and og:url as
  // RELATIVE URLs, which search engines ignore — a canonical has to be
  // absolute to mean anything. Every page that sets a canonical resolves
  // against this.
  metadataBase: new URL(SITE_URL),
  title: fa.meta.homeTitle,
  description: fa.meta.homeDesc,
  openGraph: {
    siteName: fa.brand.fullName,
    locale: "fa_IR",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className="h-full">
      <body className="min-h-full flex flex-col antialiased bg-(--color-page) text-(--color-ink)">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
