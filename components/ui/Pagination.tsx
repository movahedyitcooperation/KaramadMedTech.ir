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
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-label={fa.category.prevPage}
        aria-disabled={page === 1}
        className={cn(chip(false), page === 1 && "pointer-events-none opacity-40")}
      >
        →
      </Link>
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
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-label={fa.category.nextPage}
        aria-disabled={page === totalPages}
        className={cn(chip(false), page === totalPages && "pointer-events-none opacity-40")}
      >
        ←
      </Link>
    </nav>
  );
}
