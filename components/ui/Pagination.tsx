import Link from "next/link";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { DirIcon } from "@/components/ui/DirIcon";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

/**
 * Build a compact page list: first and last are always shown, plus a window of
 * ±1 around the current page, with "…" gaps. Keeps the control to at most ~7
 * slots so it never overflows a 360px row.
 */
function windowedPages(page: number, totalPages: number): (number | "…")[] {
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const out: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("…");
    out.push(sorted[i]);
  }
  return out;
}

export function Pagination({ page, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) return null;

  const items = windowedPages(page, totalPages);

  return (
    <nav aria-label="صفحه‌بندی" className="flex items-center justify-center gap-1.5 sm:gap-2">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-label="صفحه قبل"
        aria-disabled={page === 1}
        className={cn(
          "tap-target flex h-10 w-10 items-center justify-center rounded-full border border-line",
          page === 1 ? "pointer-events-none opacity-40" : "cursor-pointer hover:bg-bg"
        )}
      >
        <DirIcon icon={CaretLeft} size={18} />
      </Link>

      {items.map((item, i) =>
        item === "…" ? (
          <span
            key={`gap-${i}`}
            aria-hidden="true"
            className="flex h-10 w-6 items-center justify-center text-sm text-ink-400"
          >
            …
          </span>
        ) : (
          <Link
            key={item}
            href={buildHref(item)}
            aria-label={`صفحه ${toPersianDigits(item)}`}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "tap-target flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium tabular",
              item === page
                ? "bg-brand-600 text-white"
                : "cursor-pointer border border-line hover:bg-bg"
            )}
          >
            {toPersianDigits(item)}
          </Link>
        )
      )}

      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-label="صفحه بعد"
        aria-disabled={page === totalPages}
        className={cn(
          "tap-target flex h-10 w-10 items-center justify-center rounded-full border border-line",
          page === totalPages ? "pointer-events-none opacity-40" : "cursor-pointer hover:bg-bg"
        )}
      >
        <DirIcon icon={CaretRight} size={18} />
      </Link>
    </nav>
  );
}
