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
      className="hidden h-11 cursor-pointer items-center gap-2 rounded-pill border border-line bg-surface px-4 text-sm text-ink-900 transition-colors duration-200 hover:bg-bg md:inline-flex"
    >
      <Phone size={18} className="text-brand-600" aria-hidden="true" />
      <span>{open ? toPersianDigits(phone) : fa.header.phoneLabel}</span>
    </button>
  );
}
