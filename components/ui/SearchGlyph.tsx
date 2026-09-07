import { cn } from "@/lib/utils/cn";

/**
 * The magnifying glass — the site's one search mark, shared by the header's
 * search field, the phone header's search control and the drawer's search
 * row, so all three read as the same affordance rather than three glyphs
 * that happen to mean search.
 *
 * Stroke and size come from `currentColor` and a `size-*` class, so the mark
 * inherits whatever ground it lands on (bone on the emerald header, ink on a
 * light page) — matching CheckGlyph in AddToCartButton.tsx.
 *
 * The inner `<g>` is the animation handle: a parent carrying `.km-search`
 * sweeps it on hover/focus-within (app/globals.css). At rest it is a plain,
 * complete magnifying glass — nothing moves and nothing loops.
 */
export function SearchGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("size-6 shrink-0", className)}
    >
      <g className="km-search-mark">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.34-4.34" />
      </g>
    </svg>
  );
}
