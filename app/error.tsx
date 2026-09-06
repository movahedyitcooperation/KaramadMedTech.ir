"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { Panel } from "@/components/ui/Panel";
import { fa } from "@/lib/i18n/fa";

/**
 * The storefront's error state — in practice, "the backend didn't answer".
 *
 * This lives at the app root rather than inside `(shop)` on purpose. Every
 * shop screen is server-rendered from the API *including its layout*: Header
 * fetches the category tree and Footer the settings, so an unreachable
 * backend throws in the layout, above any segment-level boundary. Only a
 * boundary that wraps the layout catches it — and it therefore has to render
 * without the chrome, since the chrome is exactly what failed.
 *
 * A solid border, not the dashed empty-state treatment: this is a fault, not
 * an absence.
 *
 * Retry is `router.refresh()` *then* `reset()`, in that order and not
 * `reset()` alone: `reset()` only re-renders the boundary, which replays the
 * same cached (failed) RSC payload and throws straight back. `refresh()`
 * re-fetches it from the server, so a backend that has come back up actually
 * recovers — verified by stopping and restarting the API.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    // The digest is the only handle on the server-side stack in production,
    // so it is worth having in the console when someone reports this.
    console.error("[storefront] render failed", error.digest ?? "", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[1280px] items-center px-5 py-20 lg:px-8">
      <Panel
        className="w-full"
        dashed={false}
        watermark={false}
        title={fa.category.loadErrorTitle}
        body={fa.category.loadErrorBody}
        actions={
          <button
            type="button"
            onClick={() =>
              startTransition(() => {
                router.refresh();
                reset();
              })
            }
            disabled={pending}
            className="cursor-pointer rounded-4 bg-ink px-6 py-3.5 text-15 font-semibold text-surface transition-colors duration-(--duration-state) hover:bg-emerald disabled:opacity-50"
          >
            {fa.category.retry}
          </button>
        }
      />
    </div>
  );
}
