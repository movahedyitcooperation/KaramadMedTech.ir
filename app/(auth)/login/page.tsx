import type { Metadata } from "next";
import { OtpLoginFlow } from "@/components/shop/OtpLoginFlow";

export const metadata: Metadata = {
  title: "ورود به حساب | تجهیزات پزشکی کارآمد",
  robots: { index: false },
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  // Open-redirect guard: only an internal, single-slash path is honoured —
  // the same rule middleware.ts applies to this parameter.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  return <OtpLoginFlow nextPath={safeNext} />;
}
