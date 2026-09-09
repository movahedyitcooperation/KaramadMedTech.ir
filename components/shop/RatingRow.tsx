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
    // `relative` is load-bearing, not cosmetic: the sr-only span below is
    // position:absolute, and an absolutely positioned box is NOT clipped by an
    // ancestor with overflow:auto/hidden unless that ancestor is its containing
    // block. Without a positioned ancestor here the span resolved against
    // <body>, rode out with the card inside the horizontal product carousel,
    // and landed ~1500px outside the viewport — inflating the document's
    // scrollable width and giving the RTL page a huge empty band to pan into.
    <div className={cn("relative flex items-center gap-[7px] text-13 text-ink/70", className)}>
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
