import { formatRating, stars } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
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
      <span aria-hidden="true">{formatRating(value)}</span>
      {/* The stars are decorative and the numeral alone reads as a bare
       * number with no scale, so the same sentence the PDP prints in words
       * is what a screen reader gets here. */}
      <span className="sr-only">{fa.pdp.ratingLine(formatRating(value))}</span>
    </div>
  );
}
