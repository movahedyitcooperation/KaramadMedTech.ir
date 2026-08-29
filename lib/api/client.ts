const DEFAULT_API_BASE_URL = "http://localhost:8000/api/v1";

function getApiBaseUrl(): string {
  return process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

/**
 * Builds `${base}${path}?${query}` via plain string concatenation —
 * deliberately NOT `new URL(path, base)`. WHATWG URL resolution treats a
 * leading-slash path as absolute-from-origin, so `new URL("/products/",
 * "http://localhost:8000/api/v1")` silently drops the `/api/v1` segment and
 * resolves to `http://localhost:8000/products/`. Every caller here passes a
 * relative API path, so string concatenation is safe and avoids that footgun.
 */
function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  const base = getApiBaseUrl().replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const qs = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) qs.set(key, String(value));
    }
  }
  const query = qs.toString();
  return `${base}${normalizedPath}${query ? `?${query}` : ""}`;
}

export class ApiNotFoundError extends Error {
  constructor(path: string) {
    super(`Not found: ${path}`);
    this.name = "ApiNotFoundError";
  }
}

/**
 * Plain fetch — no axios, no custom cache wrapper. This is deliberate: Next.js
 * Server Components automatically memoize identical `fetch(url, options)`
 * calls within a single render pass, which collapses e.g. the double
 * getProductBySlug() call in app/(shop)/product/[slug]/page.tsx
 * (generateMetadata + page body) and the several independent
 * getContactSetting()/getSiteSettings() call sites (Header, Footer,
 * WhatsAppFab, cart/page.tsx) into one real request per unique URL per page
 * render, with no extra code needed here.
 *
 * List endpoints (/products/, /categories/, /settings/) MUST be called with
 * a trailing slash — the backend routers are mounted with a bare "/" route,
 * and omitting the slash triggers a 307 redirect. Detail endpoints
 * (/products/{slug}, /categories/{slug}) don't need one.
 */
export async function apiFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const url = buildUrl(path, params);
  const res = await fetch(url);
  if (res.status === 404) {
    throw new ApiNotFoundError(path);
  }
  if (!res.ok) {
    throw new Error(`API request to ${url} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

/**
 * 404 -> null, matching the mock-data era's `?? null` contract that feeds
 * Next's notFound(). Every other failure (network error, 5xx, malformed
 * JSON) propagates/throws unchanged — no retry, no fallback. Deliberate
 * simplicity choice for a dev/demo integration.
 */
export async function apiFetchOrNull<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T | null> {
  try {
    return await apiFetch<T>(path, params);
  } catch (err) {
    if (err instanceof ApiNotFoundError) return null;
    throw err;
  }
}
