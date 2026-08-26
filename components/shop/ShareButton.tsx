"use client";

import { Share } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { fa } from "@/lib/i18n/fa";

export function ShareButton({ productName }: { productName: string }) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: productName, url });
        return;
      } catch {
        // user cancelled the native share sheet — fall back to clipboard copy
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={onShare}
      className="flex h-10 cursor-pointer items-center gap-2 rounded-pill border border-line px-4 text-sm text-ink-900 hover:bg-bg"
    >
      <Share size={16} aria-hidden="true" />
      {copied ? fa.product.shareCopied : fa.product.share}
    </button>
  );
}
