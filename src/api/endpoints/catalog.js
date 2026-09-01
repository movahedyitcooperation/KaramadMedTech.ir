/* catalog.js — categories & products. Live path hits the FastAPI contract
   (§4); default path serves the bundled fixture with the same shapes. */

import { request, USE_LIVE_API, ApiError } from "../client.js";
import { CATEGORIES, PRODUCTS, SETTINGS } from "../fixture.js";

const NET_DELAY = 260; // fixture: enough to show the skeleton once, like the real thing

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    if (signal) signal.addEventListener("abort", () => { clearTimeout(t); reject(new DOMException("aborted", "AbortError")); }, { once: true });
  });
}

let _catCache = null;
let _settingsCache = null;

export async function getCategories() {
  if (_catCache) return _catCache;
  if (USE_LIVE_API) { _catCache = await request("/categories/"); return _catCache; }
  _catCache = CATEGORIES;
  return _catCache;
}

/** GET /settings/ — fetched once at boot and cached (master prompt §4, §11). */
export async function getSettings() {
  if (_settingsCache) return _settingsCache;
  _settingsCache = USE_LIVE_API ? await request("/settings/") : SETTINGS;
  return _settingsCache;
}

/** Resolve a slug to the set of leaf slugs it covers (category + direct children). */
function coveredSlugs(slug) {
  const top = CATEGORIES.find((c) => c.slug === slug);
  if (top) return [top.slug, ...top.children.map((c) => c.slug)];
  return [slug]; // it's a child slug — just itself
}

const SORTERS = {
  newest: () => 0,
  cheapest: (a, b) => a.price - b.price,
  expensive: (a, b) => b.price - a.price,
  rating: (a, b) => b.rating_avg - a.rating_avg,
};

/**
 * getProducts({ categorySlug, priceMin, priceMax, brands, inStockOnly, sort, page, pageSize, signal })
 * -> { items: ProductRead[], total, page, page_size }
 */
export async function getProducts(params = {}) {
  const {
    categorySlug = null, priceMin = null, priceMax = null, brands = [],
    inStockOnly = false, sort = "newest", page = 1, pageSize = 9, signal,
  } = params;

  if (USE_LIVE_API) {
    const q = new URLSearchParams();
    if (categorySlug) q.set("category_slug", categorySlug);
    if (priceMin) q.set("price_min", String(priceMin));
    if (priceMax) q.set("price_max", String(priceMax));
    for (const b of brands) q.append("brands", b);
    if (inStockOnly) q.set("in_stock_only", "true");
    q.set("sort", sort);
    q.set("page", String(page));
    q.set("page_size", String(pageSize));
    return request("/products/?" + q.toString(), { signal });
  }

  await sleep(NET_DELAY, signal);

  let list = PRODUCTS.slice();
  if (categorySlug) {
    const covered = coveredSlugs(categorySlug);
    const top = CATEGORIES.find((c) => c.slug === categorySlug);
    list = list.filter((p) =>
      top ? p.category_slug === categorySlug : covered.includes(p.sub_slug)
    );
  }
  const min = Number(priceMin) || 0;
  const max = Number(priceMax) || 0;
  if (min) list = list.filter((p) => p.price >= min);
  if (max) list = list.filter((p) => p.price <= max);
  if (brands.length) list = list.filter((p) => brands.includes(p.brand));
  if (inStockOnly) list = list.filter((p) => p.stock > 0);
  list.sort(SORTERS[sort] || SORTERS.newest);

  const total = list.length;
  const start = (page - 1) * pageSize;
  return { items: list.slice(start, start + pageSize), total, page, page_size: pageSize };
}

/** GET /products/{slug} -> ProductRead (404 -> ApiError). */
export async function getProduct(slug, signal) {
  if (USE_LIVE_API) return request("/products/" + encodeURIComponent(slug), { signal });
  await sleep(NET_DELAY, signal);
  const p = PRODUCTS.find((x) => x.slug === slug);
  if (!p) throw new ApiError({ status: 404, code: "not_found" });
  return p;
}

/** جدیدترین carousel. */
export async function getNewest(limit = 8, signal) {
  if (USE_LIVE_API) {
    const r = await request("/products/?sort=newest&page=1&page_size=" + limit, { signal });
    return r.items;
  }
  await sleep(NET_DELAY, signal);
  return PRODUCTS.slice().reverse().slice(0, limit);
}

/** پرفروش‌ترین carousel — is_featured is not a query param (BACKEND-GAPS #5),
   so the live path fetches a page and filters client-side. */
export async function getFeatured(signal) {
  if (USE_LIVE_API) {
    const r = await request("/products/?sort=rating&page=1&page_size=50", { signal });
    return r.items.filter((p) => p.is_featured);
  }
  await sleep(NET_DELAY, signal);
  return PRODUCTS.filter((p) => p.is_featured);
}

/** Related products for the PDP: same category first, then accessories. */
export async function getRelated(product, limit = 6, signal) {
  if (USE_LIVE_API) {
    const cat = (await getCategories()).find((c) => c.id === product.category_id);
    const r = cat ? await request("/products/?category_slug=" + cat.slug + "&page_size=" + (limit + 4)) : { items: [] };
    return r.items.filter((p) => p.slug !== product.slug).slice(0, limit);
  }
  await sleep(NET_DELAY, signal);
  return PRODUCTS.filter((p) => p.category_slug === product.category_slug && p.slug !== product.slug)
    .concat(PRODUCTS.filter((p) => p.category_slug === "accessories" && p.slug !== product.slug))
    .slice(0, limit);
}
