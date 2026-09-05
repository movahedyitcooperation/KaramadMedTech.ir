"use client";

import { useToastStore } from "@/lib/stores/toast-store";

/** Mounted once in app/layout.tsx. `role="status" aria-live="polite"` so
 * screen readers announce new toasts without stealing focus. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 start-6 z-[90] flex flex-col gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="km-toast pointer-events-auto max-w-[340px] rounded-5 bg-ink px-5 py-3.5 text-15 leading-prose text-surface shadow-pop"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
