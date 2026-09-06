"use client";

import { SignOut } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { fa } from "@/lib/i18n/fa";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await fetch("/api/admin/logout", { method: "POST" });
      // router.push + refresh rather than window.location.href: a full
      // document load would throw away the client router's cache and reload
      // every asset for what is an internal navigation.
      router.push("/admin/login");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className="flex w-full cursor-pointer items-center gap-2 rounded-input px-3 py-2 text-sm text-ink-500 hover:bg-bg hover:text-danger disabled:opacity-50"
    >
      <SignOut size={18} aria-hidden="true" />
      {fa.admin.logout}
    </button>
  );
}
