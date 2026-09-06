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

// ---------------------------------------------------------------------------
// Authenticated / mutating requests
// ---------------------------------------------------------------------------
//
// `apiFetch` above covers the read-only public catalog: no headers, no body,
// GET only, and it leans on Next's per-render fetch memoization. Cart, customer
// auth and account calls need three things it deliberately doesn't do —
// a method + JSON body, the caller's identity headers, and the backend's
// structured `{code}` error bodies preserved rather than flattened into a
// generic Error. They also must never be cached: a cart read is per-visitor.

/** The two identity headers the backend understands (see backend/app/api/v1/cart.py's
 * get_cart_owner): a customer bearer token always wins; a guest is identified
 * by the opaque token middleware.ts mints. Never send both. */
export interface ApiIdentity {
  /** Customer JWT from the httpOnly `customer_token` cookie. */
  accessToken?: string | null;
  /** Opaque guest id from the httpOnly `guest_cart_token` cookie. */
  guestCartToken?: string | null;
}

/**
 * A backend error with its machine-readable `code` intact.
 *
 * FastAPI hands back three different `detail` shapes and all three reach here:
 * a plain string (`raise HTTPException(detail="Category not found")`), an
 * object (`detail={"code": "otp_invalid_code", "attempts_left": 3}` — the
 * shape customer_auth.py uses), and Pydantic's 422 array of field errors.
 * Normalising them in one place is what lets lib/i18n/fa.ts map a `code` to a
 * Persian sentence instead of every call site string-matching English prose.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryAfterSeconds: number | null;
  readonly attemptsLeft: number | null;

  constructor(init: {
    status: number;
    code: string;
    message?: string;
    retryAfterSeconds?: number | null;
    attemptsLeft?: number | null;
  }) {
    super(init.message ?? init.code);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.retryAfterSeconds = init.retryAfterSeconds ?? null;
    this.attemptsLeft = init.attemptsLeft ?? null;
  }
}

function parseErrorBody(status: number, body: unknown): ApiError {
  const detail =
    body && typeof body === "object" && "detail" in body
      ? (body as { detail: unknown }).detail
      : body;

  if (typeof detail === "string") {
    return new ApiError({ status, code: detail, message: detail });
  }
  if (Array.isArray(detail)) {
    return new ApiError({ status, code: "validation_error" });
  }
  if (detail && typeof detail === "object") {
    const d = detail as Record<string, unknown>;
    return new ApiError({
      status,
      code: typeof d.code === "string" ? d.code : "api_error",
      message: typeof d.message === "string" ? d.message : undefined,
      retryAfterSeconds:
        typeof d.retry_after_seconds === "number" ? d.retry_after_seconds : null,
      attemptsLeft: typeof d.attempts_left === "number" ? d.attempts_left : null,
    });
  }
  return new ApiError({ status, code: "api_error" });
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    identity?: ApiIdentity;
  } = {}
): Promise<T> {
  const { method = "GET", body, identity } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  // A bearer token always wins — mirrors get_cart_owner's own precedence, so
  // a logged-in customer can never accidentally act on a stale guest cart.
  if (identity?.accessToken) {
    headers["Authorization"] = `Bearer ${identity.accessToken}`;
  } else if (identity?.guestCartToken) {
    headers["X-Guest-Cart-Token"] = identity.guestCartToken;
  }

  const res = await fetch(buildUrl(path), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    // Per-visitor data. `no-store` rather than a tag-based revalidate: two
    // visitors must never share a cart response out of the Data Cache.
    cache: "no-store",
  });

  if (res.status === 204) return null as T;

  const text = await res.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) throw parseErrorBody(res.status, payload);
  return payload as T;
}
