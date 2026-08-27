import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/shop/Breadcrumb";
import { CategoryFilters } from "@/components/shop/CategoryFilters";
import { FiltersBottomSheet } from "@/components/shop/FiltersBottomSheet";
import { ProductCard } from "@/components/shop/ProductCard";
import { SortDropdown } from "@/components/shop/SortDropdown";
import { Pagination } from "@/components/ui/Pagination";
import { toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import { getCategoryBreadcrumb, getCategoryBySlug, getSubcategories } from "@/lib/db/categories";
import {
  getBrandsInCategory,
  getProductsByCategory,
  type ProductListFilters,
} from "@/lib/db/products";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function buildPageHref(
  sp: Record<string, string | string[] | undefined>,
  slug: string,
  page: number
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (key === "page") continue;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else if (value) {
      params.set(key, value);
    }
  }
  params.set("page", String(page));
  return `/category/${slug}?${params.toString()}`;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const brandsSelected = toArray(sp.brand);
  const priceMinRaw = typeof sp.priceMin === "string" ? sp.priceMin : undefined;
  const priceMaxRaw = typeof sp.priceMax === "string" ? sp.priceMax : undefined;
  const priceMin = priceMinRaw ? Number(priceMinRaw) : undefined;
  const priceMax = priceMaxRaw ? Number(priceMaxRaw) : undefined;
  const inStockOnly = sp.inStockOnly === "1";
  const sort = (typeof sp.sort === "string" ? sp.sort : "newest") as ProductListFilters["sort"];
  const page = typeof sp.page === "string" ? Math.max(1, Number(sp.page) || 1) : 1;

  const [breadcrumbChain, subcategories, brands, result] = await Promise.all([
    getCategoryBreadcrumb(slug),
    category.parentId ? Promise.resolve([]) : getSubcategories(category.id),
    getBrandsInCategory(slug),
    getProductsByCategory(slug, {
      priceMin,
      priceMax,
      brands: brandsSelected,
      inStockOnly,
      sort,
      page,
      pageSize: 12,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const filterValues = {
    priceMin: priceMinRaw,
    priceMax: priceMaxRaw,
    brands: brandsSelected,
    inStockOnly,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Breadcrumb
        items={[
          ...breadcrumbChain.slice(0, -1).map((c) => ({
            label: c.name,
            href: `/category/${c.slug}`,
          })),
          { label: category.name },
        ]}
      />

      <div className="mb-4 mt-2 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <span className="flex items-center gap-2 text-xs font-medium tracking-wide text-brand-600">
            <span className="h-px w-8 bg-accent-500" aria-hidden="true" />
            {fa.category.breadcrumbCategories}
          </span>
          <h1 className="mt-1.5 text-balance text-2xl font-bold text-ink-900">{category.name}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <FiltersBottomSheet
            subcategories={subcategories.map((s) => ({ slug: s.slug, name: s.name }))}
            brands={brands}
            values={filterValues}
          />
          <SortDropdown />
        </div>
      </div>

      <p className="mb-4 text-sm text-ink-500">
        {fa.category.resultsCount(toPersianDigits(result.total))}
      </p>

      <div className="grid gap-6 md:grid-cols-[220px_1fr] lg:grid-cols-[240px_1fr]">
        <aside className="hidden md:block">
          <CategoryFilters
            subcategories={subcategories.map((s) => ({ slug: s.slug, name: s.name }))}
            brands={brands}
            values={filterValues}
          />
        </aside>

        <div>
          {result.items.length === 0 ? (
            <div className="rounded-card border border-dashed border-line-strong bg-surface py-16 text-center">
              <p className="font-medium text-ink-900">{fa.category.noResultsTitle}</p>
              <p className="mt-1 text-sm text-ink-500">{fa.category.noResultsDesc}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {result.items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination page={page} totalPages={totalPages} buildHref={(p) => buildPageHref(sp, slug, p)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
