"use client";

import { useState } from "react";
import { fa } from "@/lib/i18n/fa";
import { useToastStore } from "@/lib/stores/toast-store";

/**
 * Native share sheet where the browser has one, clipboard copy everywhere
 * else. The confirmation goes through the same toast queue as every other
 * acknowledgement rather than mutating the button's own label — the button
 * is a persistent control, not a state readout.
 */
export function ShareButton({ productName }: { productName: string }) {
  const [busy, setBusy] = useState(false);
  const pushToast = useToastStore((s) => s.push);

  async function onShare() {
    if (busy) return;
    setBusy(true);
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: productName, url });
      } else {
        await navigator.clipboard.writeText(url);
        pushToast(fa.pdp.shared, "pdp-shared");
      }
    } catch {
      // The visitor dismissed the native sheet, or the clipboard is blocked
      // (insecure context / denied permission). Neither is worth a message.
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onShare}
      className="cursor-pointer rounded-pill border border-ink/18 px-4 py-2.25 text-13 text-ink transition-colors duration-(--duration-state) hover:border-ink"
    >
      {fa.pdp.share}
    </button>
  );
}
