import { apiFetch, apiFetchOrNull } from "@/lib/api/client";
import { mapProduct } from "@/lib/api/mappers";
import type { ApiProduct, ApiProductListResult } from "@/lib/api/types";
import type { Product } from "@/lib/types/product";

export interface ProductListFilters {
  priceMin?: number;
  priceMax?: number;
  brands?: string[];
  inStockOnly?: boolean;
  sort?: "newest" | "cheapest" | "expensive" | "rating";
  page?: number;
  pageSize?: number;
}

export interface ProductListResult {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
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
  const q = new URLSearchParams();
  if (categorySlug) q.set("category_slug", categorySlug);
  if (typeof filters.priceMin === "number") q.set("price_min", String(filters.priceMin));
  if (typeof filters.priceMax === "number") q.set("price_max", String(filters.priceMax));
  for (const brand of filters.brands ?? []) q.append("brands", brand);
  if (filters.inStockOnly) q.set("in_stock_only", "true");
  q.set("sort", filters.sort ?? "newest");
  q.set("page", String(filters.page ?? 1));
  q.set("page_size", String(Math.min(filters.pageSize ?? 12, MAX_PAGE_SIZE)));
  return q;
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
 * The پرفروش‌ترین rail.
 *
 * `is_featured` exists on ProductRead but is NOT a query param
 * (BACKEND-GAPS #5), so this fetches one highest-rated page and filters
 * client-side. Cheap at 15 products, wrong at 400 — the fix is one line in
 * backend/app/api/v1/products.py (`is_featured: bool | None = Query(None)`),
 * and this function is the only caller that would need to change.
 */
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const { items } = await listProducts(null, {
    sort: "rating",
    page: 1,
    pageSize: MAX_PAGE_SIZE,
  });
  return items.filter((p) => p.isFeatured).slice(0, limit);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const raw = await apiFetchOrNull<ApiProduct>(`/products/${encodeURIComponent(slug)}`);
  return raw ? mapProduct(raw) : null;
}

/**
 * Brand facet for the category sidebar.
 *
 * There is no /brands/ endpoint and no facet block on ProductListResult
 * (BACKEND-GAPS #3), so the available brands are derived from the products in
 * this category. The UI labels the facet «برندهای موجود در نتایج همین دسته»
 * precisely because this is not an exhaustive brand list.
 *
 * Counts come from the category's own unfiltered page, so a checked brand's
 * count doesn't collapse to the filtered result — the facet stays stable
 * while you use it.
 */
export async function getBrandFacet(
  categorySlug: string
): Promise<{ name: string; count: number }[]> {
  const { items } = await listProducts(categorySlug, { page: 1, pageSize: MAX_PAGE_SIZE });
  const counts = new Map<string, number>();
  for (const p of items) {
    if (!p.brand) continue;
    counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Product count for one category — the home rail's «۵ کالا» line and the
 * sidebar's sub-category counts. page_size=1 because only `total` is used;
 * the backend computes it with a COUNT over the filtered subquery.
 */
export async function countProductsInCategory(categorySlug: string): Promise<number> {
  const { total } = await listProducts(categorySlug, { page: 1, pageSize: 1 });
  return total;
}

/**
 * PDP "محصولات جانبی": same category first, then anything else, so the rail
 * is never empty for a lone product in a small category.
 */
export async function getRelatedProducts(
  product: Pick<Product, "id" | "categoryId">,
  limit = 6
): Promise<Product[]> {
  const { items } = await listProducts(null, { page: 1, pageSize: MAX_PAGE_SIZE });
  const others = items.filter((p) => p.id !== product.id);
  const sameCategory = others.filter((p) => p.categoryId === product.categoryId);
  const rest = others.filter((p) => p.categoryId !== product.categoryId);
  return [...sameCategory, ...rest].slice(0, limit);
}
