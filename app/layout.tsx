import type { Metadata } from "next";
import { Toaster } from "@/components/ui/Toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "تجهیزات پزشکی کارآمد",
  description: "فروشگاه اینترنتی تجهیزات پزشکی کارآمد — تجهیزات تشخیصی، مصرفی، توانبخشی و مراقبت در منزل",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className="h-full">
      <body className="min-h-full flex flex-col antialiased bg-(--color-page) text-(--color-ink)">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
