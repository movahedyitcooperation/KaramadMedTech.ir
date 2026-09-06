import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AccountAddresses } from "@/components/shop/AccountAddresses";
import { AccountNav, type AccountTab } from "@/components/shop/AccountNav";
import { AccountProfileForm } from "@/components/shop/AccountProfileForm";
import { Panel } from "@/components/ui/Panel";
import { ScreenTransition } from "@/components/ui/ScreenTransition";
import { getAddresses, getProfile } from "@/lib/db/account";
import { fa } from "@/lib/i18n/fa";
import { isLoggedIn } from "@/lib/session";

export const metadata: Metadata = {
  title: fa.meta.accountTitle,
  robots: { index: false },
};

interface AccountPageProps {
  searchParams: Promise<{ tab?: string }>;
}

const TABS: AccountTab[] = ["profile", "addresses", "orders"];

export default async function AccountPage({ searchParams }: AccountPageProps) {
  // middleware.ts already redirects a visitor with no customer_token, but
  // that is a UX gate, not the boundary — re-check here so a direct render
  // can never reach getProfile() without a token and throw.
  if (!(await isLoggedIn())) redirect("/login?next=/account");

  const { tab } = await searchParams;
  const active: AccountTab = TABS.includes(tab as AccountTab) ? (tab as AccountTab) : "profile";

  // Only fetch what the visible panel needs — the orders tab needs neither.
  const [profile, addresses] = await Promise.all([
    active === "profile" ? getProfile() : Promise.resolve(null),
    active === "addresses" ? getAddresses() : Promise.resolve([]),
  ]);

  return (
    <ScreenTransition screenKey={`account:${active}`}>
      <div className="mx-auto max-w-[1280px] px-5 pt-8 pb-22 lg:px-8">
        <h1 className="mb-7 text-[31px] font-extrabold tracking-[-0.015em]">{fa.account.title}</h1>

        <div className="grid items-start gap-8 lg:grid-cols-[236px_1fr]">
          <AccountNav active={active} />

          <div>
            {active === "profile" && profile && <AccountProfileForm profile={profile} />}
            {active === "addresses" && <AccountAddresses addresses={addresses} />}
            {active === "orders" && (
              /* Orders, checkout and payment are Phase 6 stubs that aren't
               * registered on the API router at all. There is no order
               * endpoint to call and no order data to show, so this states
               * that plainly rather than rendering an invented history. */
              <Panel
                title={fa.account.ordersEmptyTitle}
                body={fa.account.ordersEmptyBody}
                actions={
                  <Link
                    href="/"
                    className="rounded-4 bg-ink px-6.5 py-3.25 text-15 font-semibold text-surface transition-colors hover:bg-emerald"
                  >
                    {fa.account.ordersEmptyCta}
                  </Link>
                }
              />
            )}
          </div>
        </div>
      </div>
    </ScreenTransition>
  );
}
