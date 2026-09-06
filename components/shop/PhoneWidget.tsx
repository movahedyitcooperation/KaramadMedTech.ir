"use client";

import { useState } from "react";
import { toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";

/**
 * Reveals the shop's number in place rather than opening a panel: one tap
 * swaps the label for the number, which is then selectable. The live dot is
 * emerald-live — graphical use only, never carrying text.
 *
 * The number renders LTR with `unicode-bidi: plaintext`: a phone number is
 * one of the three places (with SKU and postal code) that keeps Latin digits
 * and Latin direction inside Persian copy.
 */
export function PhoneWidget({ phone }: { phone: string }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setRevealed((o) => !o)}
      aria-expanded={revealed}
      className="j-hdr-ctl hidden items-center gap-2 rounded-pill px-3.5 py-2.5 text-sm lg:inline-flex"
    >
      <span aria-hidden="true" className="block size-1.75 shrink-0 rounded-full bg-emerald-live" />
      <span dir="ltr" style={{ unicodeBidi: "plaintext" }}>
        {revealed ? toPersianDigits(phone) : fa.header.phone}
      </span>
    </button>
  );
}
