import { cn } from "@/lib/utils/cn";

/**
 * The listing's loading state — the shape of the result, not a spinner.
 *
 * Mirrors the product card's proportions (square image, then brand / name /
 * rating / price / button bars) so the page does not reflow when the real
 * cards arrive. `.km-shimmer` runs the sweep, and stops entirely under
 * `prefers-reduced-motion`.
 */
export function ProductGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-3", className)}
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="km-shimmer overflow-hidden rounded-3 border border-ink/8 bg-surface"
        >
          <div className="aspect-square bg-ink/6" />
          <div className="flex flex-col gap-2.5 p-4">
            <div className="h-3 w-[38%] rounded-2 bg-ink/8" />
            <div className="h-3.5 w-[88%] rounded-2 bg-ink/8" />
            <div className="h-3.5 w-[56%] rounded-2 bg-ink/8" />
            <div className="mt-1.5 h-10.5 rounded-4 bg-ink/6" />
          </div>
        </div>
      ))}
    </div>
  );
}
