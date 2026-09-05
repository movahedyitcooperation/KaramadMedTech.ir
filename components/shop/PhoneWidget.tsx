"use client";

import { Phone } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";

export function PhoneWidget({ phone }: { phone: string }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
      className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-pill border border-bone/22 bg-bone/8 px-4 text-sm transition-colors duration-(--duration-state) hover:bg-bone/14"
    >
      <span className="h-1.75 w-1.75 shrink-0 rounded-full bg-emerald-live" aria-hidden="true" />
      <Phone size={16} aria-hidden="true" />
      <span dir={open ? "ltr" : undefined} style={open ? { unicodeBidi: "plaintext" } : undefined}>
        {open ? toPersianDigits(phone) : fa.header.phoneLabel}
      </span>
    </button>
  );
}
