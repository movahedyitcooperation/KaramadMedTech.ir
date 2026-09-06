import { apiFetch, apiFetchOrNull } from "@/lib/api/client";
import { mapFacets, mapProduct } from "@/lib/api/mappers";
import type { ApiProduct, ApiProductListResult } from "@/lib/api/types";
import type { Product, ProductFacets } from "@/lib/types/product";

export type ProductSort = "newest" | "cheapest" | "expensive" | "rating";

export interface ProductListFilters {
  /** Free-text query. Persian folding (Arabic yeh/kaf, ZWNJ, digits) happens
   * server-side, so pass whatever the shopper typed, unmodified. */
  q?: string;
  priceMin?: number;
  priceMax?: number;
  brands?: string[];
  inStockOnly?: boolean;
  /** true = featured only, false = non-featured only, undefined = both. */
  isFeatured?: boolean;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
  /** Ask the backend for brand/category/stock/price counts in the same
   * request. Off by default — the carousels never read them. */
  includeFacets?: boolean;
}

export interface ProductListResult {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  /** Null unless `includeFacets` was requested. */
  facets: ProductFacets | null;
}

/** The backend's own cap (`Query(..., le=100)` on page_size). */
const MAX_PAGE_SIZE = 100;

/**
 * Builds the query string for GET /products/.
 *
 * `brands` is a *repeated* param (?brands=Omron&brands=Beurer) — that's what
 * FastAPI's `brands: list[str] | None = Query(None)` expects — so it can't go
 * through apiFetch's flat Record<string, string> params and is appended here
 * instead. Sub-category filtering also goes through `category_slug`: the
 * backend resolves a slug to itself plus its direct children, which is
 * exactly the two-level tree the data actually has.
 */
function buildProductQuery(
  categorySlug: string | null,
  filters: ProductListFilters
): URLSearchParams {
  const params = new URLSearchParams();
  // Trimmed but otherwise untouched: normalising Persian here would only risk
  // drifting from the single normalisation table the backend applies to both
  // the query and the indexed column (backend/app/core/search.py).
  const q = filters.q?.trim();
  if (q) params.set("q", q);
  if (categorySlug) params.set("category_slug", categorySlug);
  if (typeof filters.priceMin === "number") params.set("price_min", String(filters.priceMin));
  if (typeof filters.priceMax === "number") params.set("price_max", String(filters.priceMax));
  for (const brand of filters.brands ?? []) params.append("brands", brand);
  if (filters.inStockOnly) params.set("in_stock_only", "true");
  if (typeof filters.isFeatured === "boolean") {
    params.set("is_featured", String(filters.isFeatured));
  }
  if (filters.includeFacets) params.set("include_facets", "true");
  params.set("sort", filters.sort ?? "newest");
  params.set("page", String(filters.page ?? 1));
  params.set("page_size", String(Math.min(filters.pageSize ?? 12, MAX_PAGE_SIZE)));
  return params;
}

/**
 * The single entry point to GET /products/. Filtering, sorting and paging all
 * happen in Postgres — this deliberately does NOT fetch the whole catalog and
 * narrow it in JS. The backend supports every filter the UI offers
 * (category_slug / price_min / price_max / brands / in_stock_only / sort /
 * page / page_size), so filtering here would both scale badly and report a
 * `total` that disagrees with the server's.
 */
export async function listProducts(
  categorySlug: string | null,
  filters: ProductListFilters = {}
): Promise<ProductListResult> {
  const raw = await apiFetch<ApiProductListResult>(
    `/products/?${buildProductQuery(categorySlug, filters).toString()}`
  );
  return {
    items: raw.items.map(mapProduct),
    total: raw.total,
    page: raw.page,
    pageSize: raw.page_size,
    facets: raw.facets ? mapFacets(raw.facets) : null,
  };
}

export async function getProductsByCategory(
  categorySlug: string,
  filters: ProductListFilters = {}
): Promise<ProductListResult> {
  return listProducts(categorySlug, filters);
}

export async function getNewestProducts(limit = 8): Promise<Product[]> {
  const { items } = await listProducts(null, { sort: "newest", page: 1, pageSize: limit });
  return items;
}

/**
 * The پرفروش‌ترین rail — highest-rated of the products the shop has flagged.
 *
 * `is_featured=true` is a real query param, so the database returns exactly
 * `limit` rows. This used to fetch a 100-row page and filter it in JS, which
 * was cheap at 15 products and wrong at 400.
 */
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const { items } = await listProducts(null, {
    isFeatured: true,
    sort: "rating",
    page: 1,
    pageSize: limit,
  });
  return items;
}

/**
 * Product search. One call, one SQL query, real pagination — the backend does
 * the matching (see backend/app/core/search.py for how Persian spellings are
 * folded), so nothing is filtered in the browser.
 */
export async function searchProducts(
  query: string,
  filters: Omit<ProductListFilters, "q"> = {}
): Promise<ProductListResult> {
  return listProducts(null, { ...filters, q: query });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const raw = await apiFetchOrNull<ApiProduct>(`/products/${encodeURIComponent(slug)}`);
  return raw ? mapProduct(raw) : null;
}

/**
 * PDP "محصولات جانبی": same category first, then anything else, so the rail
 * is never empty for a lone product in a small category.
 *
 * Two scoped requests at most — one for the category, and a second only if
 * that came up short. Both ask for `limit + 1` rows (the +1 absorbs the
 * current product, which the API has no "exclude this id" param for), rather
 * than pulling a 100-row page and slicing it in JS.
 */
export async function getRelatedProducts(
  product: Pick<Product, "id">,
  categorySlug: string | null,
  limit = 6
): Promise<Product[]> {
  const take = limit + 1;
  const related: Product[] = [];
  const seen = new Set<string>([product.id]);

  const push = (items: Product[]) => {
    for (const item of items) {
      if (seen.has(item.id) || related.length >= limit) continue;
      seen.add(item.id);
      related.push(item);
    }
  };

  if (categorySlug) {
    const { items } = await listProducts(categorySlug, { sort: "rating", pageSize: take });
    push(items);
  }
  if (related.length < limit) {
    const { items } = await listProducts(null, { sort: "rating", pageSize: take + related.length });
    push(items);
  }
  return related;
}
