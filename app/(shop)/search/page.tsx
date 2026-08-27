import { ProductCard } from "@/components/shop/ProductCard";
import { fa } from "@/lib/i18n/fa";
import { searchProducts } from "@/lib/db/products";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const products = query ? await searchProducts(query) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        {query && (
          <span className="flex items-center gap-2 text-xs font-medium tracking-wide text-brand-600">
            <span className="h-px w-8 bg-accent-500" aria-hidden="true" />
            {fa.search.title}
          </span>
        )}
        <h1 className="mt-1.5 text-balance text-2xl font-bold text-ink-900">
          {query ? fa.search.resultsFor(query) : fa.search.title}
        </h1>
      </div>

      {query && products.length === 0 && (
        <div className="rounded-card border border-dashed border-line-strong bg-surface py-16 text-center">
          <p className="font-medium text-ink-900">{fa.search.noResultsTitle}</p>
          <p className="mt-1 text-sm text-ink-500">{fa.search.noResultsDesc}</p>
        </div>
      )}

      {products.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
