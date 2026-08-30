"use client";

import { SignOut } from "@phosphor-icons/react/dist/ssr";
import { fa } from "@/lib/i18n/fa";

export function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full cursor-pointer items-center gap-2 rounded-input px-3 py-2 text-sm text-ink-500 hover:bg-bg hover:text-danger"
    >
      <SignOut size={18} aria-hidden="true" />
      {fa.admin.logout}
    </button>
  );
}
