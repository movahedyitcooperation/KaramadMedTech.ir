import { ProductGridSkeleton } from "@/components/shop/ProductGridSkeleton";
import { fa } from "@/lib/i18n/fa";

/**
 * Streamed while the search query runs. A search is the one navigation on
 * this site where the shopper has actively asked for work to happen, so it is
 * the one that most needs an immediate acknowledgement rather than a page
 * that sits still.
 */
export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-[1280px] px-5 pt-6 pb-20 lg:px-8">
      <div className="pt-3.5 pb-5.5 text-13 text-ink/72">{fa.search.title}</div>
      <div className="km-shimmer mb-7 h-9 w-[min(420px,70%)] rounded-3 bg-ink/8" />
      <div className="grid items-start gap-9 lg:grid-cols-[268px_1fr]">
        <div className="km-shimmer hidden h-96 rounded-6 border border-ink/9 bg-surface lg:block" />
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
