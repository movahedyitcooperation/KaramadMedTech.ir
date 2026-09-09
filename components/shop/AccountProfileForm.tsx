"use client";

import { useState, useTransition } from "react";
import { saveProfileNameAction } from "@/app/(shop)/account/actions";
import { Button } from "@/components/ui/Button";
import { fa } from "@/lib/i18n/fa";
import { useToastStore } from "@/lib/stores/toast-store";
import type { CustomerProfile } from "@/lib/types/account";

/**
 * Only `full_name` is editable — that's the whole of PATCH /account/me.
 *
 * Phone and email render as read-only values with a line saying why: they are
 * the login identity, and changing one would need a re-verification flow that
 * doesn't exist. Showing them as disabled inputs would imply the opposite.
 */
export function AccountProfileForm({ profile }: { profile: CustomerProfile }) {
  const [fullName, setFullName] = useState(profile.fullName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const pushToast = useToastStore((s) => s.push);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveProfileNameAction(fullName);
      if (result.ok) pushToast(result.message);
      else setError(result.error);
    });
  }

  return (
    <div className="flex max-w-[560px] flex-col gap-5 rounded-6 border border-ink/10 bg-surface p-6.5">
      <strong className="text-lg font-bold">{fa.account.profileHeading}</strong>

      <label className="flex flex-col gap-2.25 text-sm text-ink/70">
        {fa.account.fullName}
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
          }}
          className="rounded-4 border border-ink/18 bg-white p-3.5 text-base text-ink"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <ReadOnlyField label={fa.account.phone} value={profile.phone} />
        <ReadOnlyField label={fa.account.email} value={profile.email} />
      </div>

      <p className="text-12 leading-[1.85] text-ink/68">{fa.account.identityNote}</p>

      <div aria-live="polite" className="min-h-5 text-13 text-danger">
        {error}
      </div>

      <Button
        type="button"
        onClick={save}
        loading={pending}
        className="self-start rounded-4 px-7.5 py-3.75 text-[15.5px] font-bold"
      >
        {fa.account.saveName}
      </Button>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1.75">
      <span className="text-sm text-ink/68">{label}</span>
      {/* Latin digits, LTR — a phone number is one of the three places that
       * keeps Latin numerals inside Persian copy (with SKU and postal code). */}
      <span dir="ltr" className="text-base font-semibold" style={{ unicodeBidi: "plaintext" }}>
        {value || "—"}
      </span>
    </div>
  );
}
