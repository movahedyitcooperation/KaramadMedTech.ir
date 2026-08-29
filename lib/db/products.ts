import { apiFetch, apiFetchOrNull } from "@/lib/api/client";
import { mapProduct } from "@/lib/api/mappers";
import type { ApiProduct, ApiProductListResult } from "@/lib/api/types";
import { getCategoryIdsInSubtree } from "@/lib/db/categories";
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

export async function getAllProducts(): Promise<Product[]> {
  // page_size=100 is the backend's own max (Query(..., le=100) in
  // backend/app/api/v1/products.py). Only 15 products are seeded today, so
  // one page covers the whole catalog — revisit with a real paging loop
  // before the active catalog exceeds 100. is_active filtering already
  // happens server-side (WHERE is_active), matching the old
  // mockProducts.filter(isActive).
  //
  // No .reverse() here: the backend's sort=newest currently returns rows in
  // the exact same order as the old mock array's declared order (verified
  // live — every seeded product shares one created_at, since
  // scripts/seed.py inserts all 15 in a single transaction, and Postgres's
  // tie-break on equal created_at happens to preserve insertion order for
  // this untouched table). That matches what getAllProducts() always
  // returned, so getNewestProducts()/sortProducts()'s "newest" branch below
  // — which apply their own .reverse() — keep working unchanged. This isn't
  // a guaranteed SQL semantic, just what this table does today; a real fix
  // (a monotonic sequence column, or staggered seed timestamps) would be a
  // backend change if it ever became unreliable.
  const result = await apiFetch<ApiProductListResult>("/products/", {
    sort: "newest",
    page_size: 100,
  });
  return result.items.map(mapProduct);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.isFeatured).slice(0, limit);
}

export async function getNewestProducts(limit = 8): Promise<Product[]> {
  const all = await getAllProducts();
  return [...all].reverse().slice(0, limit);
}

export async function getBestsellerProducts(limit = 8): Promise<Product[]> {
  const all = await getAllProducts();
  return [...all].sort((a, b) => b.ratingCount - a.ratingCount).slice(0, limit);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const raw = await apiFetchOrNull<ApiProduct>(`/products/${encodeURIComponent(slug)}`);
  return raw ? mapProduct(raw) : null;
}

function sortProducts(products: Product[], sort: ProductListFilters["sort"]): Product[] {
  const sorted = [...products];
  switch (sort) {
    case "cheapest":
      return sorted.sort((a, b) => a.price - b.price);
    case "expensive":
      return sorted.sort((a, b) => b.price - a.price);
    case "rating":
      return sorted.sort((a, b) => b.ratingAvg - a.ratingAvg);
    case "newest":
    default:
      return sorted.reverse();
  }
}

export async function getProductsByCategory(
  categorySlug: string,
  filters: ProductListFilters = {}
): Promise<ProductListResult> {
  const categoryIds = await getCategoryIdsInSubtree(categorySlug);
  const all = await getAllProducts();

  let filtered = all.filter((p) => categoryIds.includes(p.categoryId));

  if (typeof filters.priceMin === "number") {
    filtered = filtered.filter((p) => p.price >= filters.priceMin!);
  }
  if (typeof filters.priceMax === "number") {
    filtered = filtered.filter((p) => p.price <= filters.priceMax!);
  }
  if (filters.brands && filters.brands.length > 0) {
    filtered = filtered.filter((p) => filters.brands!.includes(p.brand));
  }
  if (filters.inStockOnly) {
    filtered = filtered.filter((p) => p.stock > 0);
  }

  filtered = sortProducts(filtered, filters.sort);

  const total = filtered.length;
  const pageSize = filters.pageSize ?? 12;
  const page = filters.page ?? 1;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return { items, total, page, pageSize };
}

export async function getBrandsInCategory(categorySlug: string): Promise<string[]> {
  const categoryIds = await getCategoryIdsInSubtree(categorySlug);
  const all = await getAllProducts();
  const brands = new Set(all.filter((p) => categoryIds.includes(p.categoryId)).map((p) => p.brand));
  return Array.from(brands).sort();
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const all = await getAllProducts();
  return all.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.shortDesc.toLowerCase().includes(q)
  );
}

export async function getRelatedProducts(productId: string, limit = 4): Promise<Product[]> {
  const all = await getAllProducts();
  const current = all.find((p) => p.id === productId);
  if (!current) return [];
  return all
    .filter((p) => p.id !== current.id && p.categoryId === current.categoryId)
    .slice(0, limit);
}
