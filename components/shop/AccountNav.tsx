"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { logoutAction } from "@/app/(auth)/login/actions";
import { fa } from "@/lib/i18n/fa";
import { useToastStore } from "@/lib/stores/toast-store";
import { cn } from "@/lib/utils/cn";

export type AccountTab = "profile" | "addresses" | "orders";

/**
 * The account side nav. Tabs are real routed links (`?tab=`), not local
 * state, so a reload or a shared link lands on the same panel and the back
 * button works — the same principle as the category page's filters.
 */
export function AccountNav({ active }: { active: AccountTab }) {
  const [pending, startTransition] = useTransition();
  const pushToast = useToastStore((s) => s.push);
  const router = useRouter();

  function logout() {
    startTransition(async () => {
      await logoutAction();
      pushToast(fa.account.loggedOutToast);
      router.push("/");
      router.refresh();
    });
  }

  return (
    <nav
      aria-label={fa.account.navAria}
      className="flex flex-col gap-0.5 rounded-6 border border-ink/9 bg-surface p-3"
    >
      {fa.account.tabs.map((tab) => {
        const on = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.id === "profile" ? "/account" : `/account?tab=${tab.id}`}
            aria-current={on ? "true" : undefined}
            className={cn(
              "rounded-4 px-3.75 py-3.25 text-start text-15",
              on ? "bg-emerald font-bold text-bone" : "font-medium text-ink/75 hover:bg-page"
            )}
          >
            {tab.label}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={logout}
        disabled={pending}
        className="mt-2 cursor-pointer rounded-4 border-t border-ink/8 px-3.75 py-3.25 text-start text-14 text-danger disabled:opacity-50"
      >
        {fa.account.logout}
      </button>
    </nav>
  );
}
