import type { ProductListFilters, ProductSort } from "@/lib/db/products";

/**
 * The URL <-> filter translation shared by the two product listings (a
 * category and a search result), which differ in what they list but not at
 * all in how they are filtered, sorted or paged.
 *
 * Every filter lives in the query string so a narrowed listing is shareable,
 * bookmarkable and back-button-correct, and so the server can do the
 * filtering. That only works if both screens read and write the parameters
 * identically — hence one module rather than a copy per page.
 */

export type SearchParams = Record<string, string | string[] | undefined>;

const SORTS: readonly string[] = ["newest", "cheapest", "expensive", "rating"];

export function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function toPositiveInt(value: string | string[] | undefined): number | undefined {
  const raw = typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(raw) && raw >= 0 ? raw : undefined;
}

export interface ParsedListingParams extends ProductListFilters {
  page: number;
}

/**
 * Reads the filter state out of a URL.
 *
 * Anything unrecognised falls back to the default rather than being forwarded,
 * so a hand-edited or stale URL degrades to a sensible listing instead of
 * 422-ing the API.
 */
export function parseListingParams(
  sp: SearchParams,
  options: { pageSize: number; includeFacets?: boolean }
): ParsedListingParams {
  const sortRaw = typeof sp.sort === "string" ? sp.sort : "newest";

  return {
    // Present on the search page, and carried into a category listing when a
    // shopper narrows a search to one department.
    q: typeof sp.q === "string" ? sp.q : undefined,
    priceMin: toPositiveInt(sp.priceMin),
    priceMax: toPositiveInt(sp.priceMax),
    brands: toArray(sp.brand),
    inStockOnly: sp.inStockOnly === "1",
    sort: (SORTS.includes(sortRaw) ? sortRaw : "newest") as ProductSort,
    page: Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1),
    pageSize: options.pageSize,
    includeFacets: options.includeFacets,
  };
}

/**
 * Rebuilds the current URL with some parameters changed.
 *
 * `page` is dropped unless it is greater than 1, so page one has a clean
 * address and every filter link resets paging — page 3 of a result set that
 * just changed is meaningless.
 */
export function buildListingHref(
  basePath: string,
  sp: SearchParams,
  overrides: Record<string, string | null> = {},
  page?: number
): string {
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
  return qs ? `${basePath}?${qs}` : basePath;
}
