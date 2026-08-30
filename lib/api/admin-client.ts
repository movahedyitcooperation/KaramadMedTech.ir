import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "admin_token";
const DEFAULT_API_BASE_URL = "http://localhost:8000/api/v1";

export class AdminApiError extends Error {
  status: number;
  /** Structured error code from the backend's `detail.code`, when present. */
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.code = code;
  }
}

async function getAdminToken(): Promise<string | null> {
  return (await cookies()).get(ADMIN_COOKIE_NAME)?.value ?? null;
}

/**
 * FastAPI's `detail` is a plain string for most errors, but some routes
 * (e.g. the category-delete 409) send a structured `{code, ...}` object so
 * the frontend can branch on it instead of matching English prose — this
 * app is Persian-only, so raw backend text must never reach the UI as-is.
 */
function errorFromDetail(status: number, rawDetail: unknown, fallback: string): AdminApiError {
  if (typeof rawDetail === "string") return new AdminApiError(status, rawDetail);
  if (rawDetail && typeof rawDetail === "object" && "code" in rawDetail && typeof rawDetail.code === "string") {
    return new AdminApiError(status, rawDetail.code, rawDetail.code);
  }
  return new AdminApiError(status, fallback);
}

function apiBase(): string {
  return (process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

/**
 * Authenticated fetch — Server Components / Server Actions only (reads the
 * httpOnly cookie via next/headers, so it cannot run in a Client Component).
 * Forwards the admin cookie as `Authorization: Bearer <token>`. Deliberately
 * a separate module from lib/api/client.ts, which stays public/unauthenticated
 * — keeps the two call surfaces impossible to accidentally cross-wire.
 */
export async function adminApiFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<T> {
  const token = await getAdminToken();
  if (!token) throw new AdminApiError(401, "Not authenticated");

  const res = await fetch(`${apiBase()}${path.startsWith("/") ? path : `/${path}`}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw errorFromDetail(res.status, body?.detail, `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function adminApiUpload(path: string, formData: FormData): Promise<{ url: string }> {
  const token = await getAdminToken();
  if (!token) throw new AdminApiError(401, "Not authenticated");

  const res = await fetch(`${apiBase()}${path.startsWith("/") ? path : `/${path}`}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw errorFromDetail(res.status, body?.detail, `Upload failed: ${res.status}`);
  }
  return res.json();
}
