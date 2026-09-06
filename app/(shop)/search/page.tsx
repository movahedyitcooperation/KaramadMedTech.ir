import Link from "next/link";
import type { Metadata } from "next";
import { CategoryFiltersPanel } from "@/components/shop/CategoryFiltersPanel";
import { FiltersSheetProvider, FiltersSheetTrigger } from "@/components/shop/FiltersSheetContext";
import { HeaderSearch } from "@/components/shop/HeaderSearch";
import { ProductCard } from "@/components/shop/ProductCard";
import { SortDropdown } from "@/components/shop/SortDropdown";
import { Pagination } from "@/components/ui/Pagination";
import { Panel } from "@/components/ui/Panel";
import { ScreenTransition } from "@/components/ui/ScreenTransition";
import { searchProducts, type ProductListFilters } from "@/lib/db/products";
import { getContactSetting } from "@/lib/db/settings";
import { fa } from "@/lib/i18n/fa";
import { telHref } from "@/lib/utils/links";

const PAGE_SIZE = 9;

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Results depend entirely on the query string, and a search results page has
 * nothing to offer a crawler. */
export const metadata: Metadata = {
  title: `${fa.search.title} | ${fa.brand.fullName}`,
  robots: { index: false, follow: true },
};

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function parseFilters(
  sp: Record<string, string | string[] | undefined>
): ProductListFilters & { page: number } {
  const num = (v: string | string[] | undefined) => {
    const raw = typeof v === "string" ? Number(v) : NaN;
    return Number.isFinite(raw) && raw >= 0 ? raw : undefined;
  };
  const sortRaw = typeof sp.sort === "string" ? sp.sort : "newest";
  const sorts = ["newest", "cheapest", "expensive", "rating"] as const;
  const sort = (sorts as readonly string[]).includes(sortRaw)
    ? (sortRaw as ProductListFilters["sort"])
    : "newest";

  return {
    priceMin: num(sp.priceMin),
    priceMax: num(sp.priceMax),
    brands: toArray(sp.brand),
    inStockOnly: sp.inStockOnly === "1",
    sort,
    page: Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1),
    pageSize: PAGE_SIZE,
    includeFacets: true,
  };
}

/**
 * Search results.
 *
 * Deliberately the same screen as a category listing — same grid, same
 * sidebar, same sort control, same pager — because it is the same job. The
 * only structural difference is the sidebar's scope list: a department
 * listing offers its sub-categories, while here the departments themselves
 * are the scope, so a shopper can narrow «ماسک» to مصرفی و بهداشتی. Choosing
 * one carries `q` into the category page, so the search survives the jump.
 *
 * Every filter, the sort, the page and the counts are resolved by Postgres in
 * one request. Nothing is matched or counted in the browser.
 */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.trim() : "";

  if (!query) {
    return (
      <ScreenTransition screenKey="search:empty">
        <div className="mx-auto max-w-[1280px] px-5 py-20 lg:px-8">
          <Panel
            title={fa.search.emptyQueryTitle}
            body={fa.search.emptyQueryBody}
            actions={
              <div className="flex w-full max-w-[520px] flex-col items-center gap-4">
                {/* The header field is desktop-only; on a phone the header
                 * shows an icon that lands here, so the field has to exist on
                 * the page itself or there is nowhere to type. */}
                <HeaderSearch tone="surface" className="w-full" autoFocus />
                <Link
                  href="/"
                  className="text-15 font-semibold text-emerald transition-colors hover:text-emerald-live"
                >
                  {fa.search.browseCategories}
                </Link>
              </div>
            }
          />
        </div>
      </ScreenTransition>
    );
  }

  const filters = parseFilters(sp);
  const [result, contact] = await Promise.all([
    searchProducts(query, filters),
    getContactSetting(),
  ]);

  const facets = result.facets;
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  function buildHref(overrides: Record<string, string | null>, page?: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(sp)) {
      if (key === "page") continue;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
      else if (value) params.set(key, value);
    }
    for (const [key, value] of Object.entries(overrides)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    if (page && page > 1) params.set("page", String(page));
    const qs = params.toString();
    return `/search${qs ? `?${qs}` : ""}`;
  }

  return (
    <ScreenTransition screenKey={`search:${query}`}>
      <FiltersSheetProvider>
        <div className="mx-auto max-w-[1280px] px-5 pt-6 pb-20 lg:px-8">
          <nav
            aria-label={fa.category.breadcrumbAria}
            className="flex flex-wrap items-center gap-2.5 pt-3.5 pb-5.5 text-13 text-ink/72"
          >
            <Link href="/" className="transition-colors hover:text-emerald-live">
              {fa.category.home}
            </Link>
            <span>/</span>
            <span className="font-bold text-ink">{fa.search.title}</span>
          </nav>

          <div className="mb-7 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="text-h1-flat font-extrabold tracking-[-0.015em]">
                {fa.search.heading(query)}
              </h1>
              <p aria-live="polite" className="mt-3 text-15 leading-[1.75] text-ink/70">
                <span key={`rc-${result.total}`} className="km-note inline-block">
                  {fa.search.resultCount(result.total)}
                </span>
              </p>
            </div>
            {result.total > 0 && (
              <div className="flex items-center gap-2.5">
                <FiltersSheetTrigger />
                <SortDropdown />
              </div>
            )}
          </div>

          {result.total === 0 ? (
            <Panel
              title={fa.search.noResultsTitle(query)}
              body={fa.search.noResultsBody}
              actions={
                <>
                  <Link
                    href={buildHref({ q: query, brand: null, priceMin: null, priceMax: null, inStockOnly: null })}
                    className="rounded-4 bg-ink px-6 py-3.5 text-15 font-semibold text-surface transition-colors duration-(--duration-state) hover:bg-emerald"
                  >
                    {fa.category.clear}
                  </Link>
                  <a
                    href={telHref(contact.phone)}
                    className="rounded-4 border border-ink/20 px-6 py-3.5 text-15 text-ink"
                  >
                    {fa.search.noResultsCall}
                  </a>
                </>
              }
            />
          ) : (
            <div className="grid items-start gap-9 lg:grid-cols-[268px_1fr]">
              <CategoryFiltersPanel
                scopeHeading={fa.search.scopeHeading}
                scopeLinks={[
                  {
                    href: buildHref({}),
                    name: fa.search.allDepartments,
                    count: result.total,
                    active: true,
                  },
                  // Narrowing to a department leaves the search page for the
                  // category listing, carrying `q` along so the query holds.
                  ...(facets?.categories ?? []).map((c) => ({
                    href: `/category/${c.value}?q=${encodeURIComponent(query)}`,
                    name: c.label,
                    count: c.count,
                    active: false,
                  })),
                ]}
                departmentSlug={null}
                brands={(facets?.brands ?? []).map((b) => ({ name: b.value, count: b.count }))}
                total={result.total}
              />

              <div>
                <div className="km-stagger grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
                  {result.items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-9">
                    <Pagination
                      page={result.page}
                      totalPages={totalPages}
                      buildHref={(page) => buildHref({}, page)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </FiltersSheetProvider>
    </ScreenTransition>
  );
}
