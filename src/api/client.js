/* client.js — the one place base URL, auth header, guest-cart header, JSON parsing,
   all three error-detail shapes, timeout and AbortController live. Every network
   call goes through request().

   USE_LIVE_API: with the deployed FastAPI backend reachable at API_BASE, set this
   true (or ?live=1) and the endpoint modules call the real API. Off by default so
   the storefront runs standalone on the bundled fixture (this task is frontend-only).
   Either way the endpoint signatures are identical — nothing else changes. */

import { getToken } from "../lib/storage.js";
import { getGuestToken } from "../lib/guest-token.js";

export const API_BASE = "/api/v1";
export const USE_LIVE_API =
  new URLSearchParams(location.search).get("live") === "1" ||
  (typeof window !== "undefined" && window.__KM_LIVE__ === true);

const DEFAULT_TIMEOUT = 12000;

/** Normalises FastAPI error bodies to { code, message, fields, status }.
   Copes with: detail as a string, detail as { code, ... }, and Pydantic's 422
   detail[] array keyed by field location. */
export class ApiError extends Error {
  constructor({ status, code, message, fields, retryAfter, attemptsLeft }) {
    super(message || code || "api_error");
    this.name = "ApiError";
    this.status = status;
    this.code = code || null;
    this.fields = fields || null;         // { fieldName: "message" } for 422 field errors
    this.retryAfter = retryAfter ?? null; // seconds, from otp_resend_too_soon
    this.attemptsLeft = attemptsLeft ?? null;
  }
}

function parseErrorBody(status, body) {
  const detail = body && body.detail !== undefined ? body.detail : body;
  if (typeof detail === "string") {
    return new ApiError({ status, code: detail, message: detail });
  }
  if (Array.isArray(detail)) {
    const fields = {};
    for (const item of detail) {
      const loc = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : "form";
      fields[loc] = item.msg || "نامعتبر";
    }
    return new ApiError({ status, code: "validation_error", fields });
  }
  if (detail && typeof detail === "object") {
    return new ApiError({
      status,
      code: detail.code || "api_error",
      message: detail.message,
      retryAfter: detail.retry_after_seconds,
      attemptsLeft: detail.attempts_left,
    });
  }
  return new ApiError({ status, code: "api_error" });
}

/**
 * request(path, { method, body, auth, guestCart, signal, timeout })
 * - `path` must include the trailing slash on collection routes (no 307s).
 * - `auth: true`  -> send Authorization: Bearer <token> when present.
 * - `guestCart: true` -> send X-Guest-Cart-Token when there is no bearer token.
 */
export async function request(path, opts = {}) {
  const { method = "GET", body, auth = false, guestCart = false, signal, timeout = DEFAULT_TIMEOUT } = opts;

  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const token = getToken();
  if (auth && token) headers["Authorization"] = "Bearer " + token;
  if (guestCart && !token) headers["X-Guest-Cart-Token"] = getGuestToken();

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new DOMException("timeout", "AbortError")), timeout);
  if (signal) signal.addEventListener("abort", () => ctrl.abort(signal.reason), { once: true });

  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
      credentials: "omit",
    });
  } catch (err) {
    clearTimeout(timer);
    if (err && err.name === "AbortError") throw err;
    throw new ApiError({ status: 0, code: "network_error", message: String(err) });
  }
  clearTimeout(timer);

  if (res.status === 204) return null;

  let payload = null;
  const text = await res.text();
  if (text) { try { payload = JSON.parse(text); } catch { payload = text; } }

  if (!res.ok) throw parseErrorBody(res.status, payload);
  return payload;
}
