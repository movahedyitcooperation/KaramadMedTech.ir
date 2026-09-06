import "server-only";
import { apiRequest } from "@/lib/api/client";
import { mapCart } from "@/lib/api/mappers";
import type { ApiRequestOtpResponse, ApiVerifyOtpResponse } from "@/lib/api/types";
import { getGuestCartToken } from "@/lib/session";
import type { Cart } from "@/lib/types/cart";

/**
 * Customer OTP auth. The backend classifies phone-vs-email itself from the
 * single `contact` field (^09\d{9}$, else an email regex), generates and
 * hashes the code, rate-limits per contact and per IP, and dispatches via the
 * configured SMS/email provider. None of that is mirrored here — this module
 * only forwards and unwraps.
 */

export interface RequestOtpResult {
  contact: string;
  channel: "phone" | "email";
  /** Seconds until the code expires (OTP_TTL_SECONDS, 120 by default). */
  expiresIn: number;
}

export async function requestOtp(contact: string): Promise<RequestOtpResult> {
  const res = await apiRequest<ApiRequestOtpResponse>("/auth/customer/request-otp", {
    method: "POST",
    body: { contact },
  });
  return { contact: res.contact, channel: res.channel, expiresIn: res.expires_in };
}

export interface VerifyOtpResult {
  accessToken: string;
  expiresIn: number;
  contact: string;
  /** The account's cart *after* the guest cart was merged into it. */
  cart: Cart;
}

/**
 * The guest cart token is always sent, so whatever the visitor put in their
 * cart before logging in merges into the account server-side (summing
 * quantities for shared products, clamped to stock). The backend clears the
 * guest token as part of that merge.
 */
export async function verifyOtp(contact: string, code: string): Promise<VerifyOtpResult> {
  const res = await apiRequest<ApiVerifyOtpResponse>("/auth/customer/verify-otp", {
    method: "POST",
    body: { contact, code, guest_cart_token: await getGuestCartToken() },
  });
  return {
    accessToken: res.access_token,
    expiresIn: res.expires_in,
    contact: res.contact,
    cart: mapCart(res.cart),
  };
}
