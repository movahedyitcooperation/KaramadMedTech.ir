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

export function Pagination({ page, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="صفحه‌بندی" className="flex items-center justify-center gap-2">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-label="صفحه قبل"
        aria-disabled={page === 1}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full border border-line",
          page === 1 ? "pointer-events-none opacity-40" : "cursor-pointer hover:bg-bg"
        )}
      >
        <DirIcon icon={CaretLeft} size={18} />
      </Link>
      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium",
            p === page
              ? "bg-brand-600 text-white"
              : "cursor-pointer border border-line hover:bg-bg"
          )}
        >
          {toPersianDigits(p)}
        </Link>
      ))}
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-label="صفحه بعد"
        aria-disabled={page === totalPages}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full border border-line",
          page === totalPages ? "pointer-events-none opacity-40" : "cursor-pointer hover:bg-bg"
        )}
      >
        <DirIcon icon={CaretRight} size={18} />
      </Link>
    </nav>
  );
}
