"use client";

import { User } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { fa } from "@/lib/i18n/fa";
import { useAuthStore } from "@/lib/stores/auth-store";

export function HeaderAuthStatus() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const contact = useAuthStore((s) => s.contact);
  const logout = useAuthStore((s) => s.logout);

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-2 rounded-pill border border-line bg-surface px-4 py-2 text-sm text-ink-900 sm:inline-flex">
          <User size={18} className="text-brand-600" aria-hidden="true" />
          {contact}
        </span>
        <Button variant="outline" size="sm" onClick={logout}>
          {fa.header.logout}
        </Button>
      </div>
    );
  }

  return (
    <Link href="/login">
      <Button variant="coral" size="md" className="shadow-soft">
        {fa.header.loginRegister}
      </Button>
    </Link>
  );
}
