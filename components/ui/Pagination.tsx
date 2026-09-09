import Link from "next/link";
import { toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

/**
 * Square-ish page chips, ink for the current page — not pills, and not the
 * brand green: pagination is navigation on the shopping surface, where only
 * ink/danger/warn appear.
 *
 * The arrows are literal characters rather than icons because they must point
 * the RTL way: → goes to the previous (earlier) page, ← to the next one.
 *
 * At either end the arrow renders as a <span>, not a dimmed <Link>:
 * `pointer-events-none` stops the mouse but not the keyboard, so the old
 * markup let a keyboard user Tab to «صفحه قبلی» on page 1 and press Enter.
 */
export function Pagination({ page, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const chip = (active: boolean) =>
    cn(
      "grid h-10.5 min-w-10.5 place-items-center rounded-4 border text-15 font-semibold transition-colors duration-(--duration-state)",
      active ? "border-ink bg-ink text-surface" : "border-ink/16 bg-surface text-ink hover:border-ink"
    );

  return (
    <nav aria-label={fa.category.pagerAria} className="flex items-center justify-center gap-2">
      {page === 1 ? (
        <span aria-hidden="true" className={cn(chip(false), "opacity-40")}>
          →
        </span>
      ) : (
        <Link
          href={buildHref(page - 1)}
          aria-label={fa.category.prevPage}
          className={chip(false)}
        >
          →
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          aria-current={p === page ? "page" : undefined}
          className={chip(p === page)}
        >
          {toPersianDigits(p)}
        </Link>
      ))}
      {page === totalPages ? (
        <span aria-hidden="true" className={cn(chip(false), "opacity-40")}>
          ←
        </span>
      ) : (
        <Link
          href={buildHref(page + 1)}
          aria-label={fa.category.nextPage}
          className={chip(false)}
        >
          ←
        </Link>
      )}
    </nav>
  );
}
