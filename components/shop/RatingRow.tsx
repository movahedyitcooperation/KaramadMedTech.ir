import { formatRating, stars } from "@/lib/format";
import { cn } from "@/lib/utils/cn";

/**
 * Stars + score, with no review count.
 *
 * The rating is the shop's own expert assessment, not customer reviews —
 * there is no review system (review.py is a Phase 7 stub, and rating_avg /
 * rating_count are seeded display values). A «(۳۸)» count next to the stars
 * would imply thirty-eight reviews that don't exist, so it isn't rendered.
 * The PDP says the same thing in words: «امتیاز کارشناسی ۴٫۶ از ۵».
 */
export function RatingRow({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-[7px] text-13 text-ink/70", className)}>
      <span aria-hidden="true" className="tracking-[0.05em] text-emerald">
        {stars(value)}
      </span>
      <span>{formatRating(value)}</span>
    </div>
  );
}
