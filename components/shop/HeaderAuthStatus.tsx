import { User } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { fa } from "@/lib/i18n/fa";

interface HeaderAuthStatusProps {
  contact: string | null;
}

/**
 * Server Component — reads the customer session via a `contact` prop
 * supplied by Header's own data fetch. This removes the previous
 * Zustand-during-render hydration bug outright (the old client component
 * read a persisted auth store with no hydration guard) and gains a real
 * `/account` link for the first time.
 *
 * Stage 3 wires `contact` to the real session via lib/db/account.ts's
 * getCurrentCustomer(); until then Header passes null (accurate — no real
 * customer session exists yet), so this always renders the logged-out
 * state for now.
 */
export function HeaderAuthStatus({ contact }: HeaderAuthStatusProps) {
  if (contact) {
    return (
      <Link
        href="/account"
        className="inline-flex items-center gap-2 rounded-pill border border-bone/22 px-4 py-2.5 text-sm font-medium transition-colors duration-(--duration-state) hover:bg-bone/14"
      >
        <User size={18} aria-hidden="true" />
        <span className="hidden sm:inline">{fa.header.accountButton}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex items-center gap-2 rounded-pill border border-bone/22 px-4 py-2.5 text-sm font-medium transition-colors duration-(--duration-state) hover:bg-bone/14"
    >
      <User size={18} aria-hidden="true" />
      <span className="hidden sm:inline">{fa.header.loginRegister}</span>
    </Link>
  );
}
