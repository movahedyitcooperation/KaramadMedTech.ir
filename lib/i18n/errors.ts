import { ApiError } from "@/lib/api/client";
import { fa } from "@/lib/i18n/fa";

/**
 * Turns anything thrown by lib/api/client's apiRequest into one Persian
 * sentence. Kept out of fa.ts so that file stays a pure string table.
 *
 * The mapping is by backend error `code`, never by HTTP status or English
 * prose — codes are the backend's stable contract
 * (backend/app/api/v1/customer_auth.py raises `{"code": ...}` bodies for
 * exactly this reason). An unrecognised code is a real bug, not something to
 * paper over with the raw string: the user gets `generic` and the console
 * gets the code.
 */
export function toPersianError(err: unknown): string {
  if (!(err instanceof ApiError)) return fa.errors.network;

  if (err.code === "otp_invalid_code") {
    // attempts_left comes back on the error body itself, so the message can
    // count down honestly instead of saying "try again" five times.
    return fa.errors.otp_invalid_code(err.attemptsLeft ?? 0);
  }

  // A 5xx carries no `code` of its own — client.ts falls back to the status
  // text ("Internal Server Error"), which is not a contract and must not be
  // reported as an unmapped code below. The shopper gets the retry sentence;
  // the server already logged the real cause.
  if (err.status >= 500) return fa.errors.serverError;

  const table = fa.errors as Record<string, unknown>;
  const entry = table[err.code];
  if (typeof entry === "string") return entry;

  if (process.env.NODE_ENV !== "production") {
    console.warn(`[i18n] unmapped backend error code: ${err.code} (${err.status})`);
  }
  return fa.errors.generic;
}
